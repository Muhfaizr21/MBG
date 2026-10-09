"""AI service MBG: pengenal menu dan kesegaran hidangan matang YOLOv8n-cls.

Dipanggil oleh gateway Go (POST /api/scans) lewat POST /predict-tray
(dengan fallback POST /predict untuk foto utuh). Jalankan dari folder
backend/ai_service:
    uvicorn app.main:app --host 127.0.0.1 --port 8083

Endpoint /predict-detect menerapkan Pendekatan 1 (two-stage):
Tahap 1 model deteksi (objek_deteksi.pt) mencari bounding box kategori
umum (makanan_pokok, lauk, sayur, ...), Tahap 2 tiap crop dikirim ke
model klasifikasi (food_recognition_best.pt) untuk nama menu spesifik.
"""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from ultralytics import YOLO

from app import labels, tray

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.normpath(os.path.join(BASE_DIR, '..', '..', 'model_ai'))
MENU_MODEL_PATH = os.environ.get(
    'AI_MENU_MODEL_PATH',
    os.path.join(MODEL_DIR, 'food_recognition_best.pt'),
)
FRESHNESS_MODEL_PATH = os.environ.get(
    'AI_FRESHNESS_MODEL_PATH',
    os.environ.get('AI_MODEL_PATH', os.path.join(MODEL_DIR, 'cooked_food_freshness_best.pt')),
)
DETECTOR_MODEL_PATH = os.environ.get(
    'AI_DETECTOR_MODEL_PATH',
    os.path.join(MODEL_DIR, 'objek_deteksi.pt'),
)
IMG_SIZE = int(os.environ.get('AI_IMGSZ', '224'))
DET_IMGSZ = int(os.environ.get('AI_DET_IMGSZ', '640'))
DET_CONF = float(os.environ.get('AI_DET_CONF', '0.25'))
DET_IOU = float(os.environ.get('AI_DET_IOU', '0.45'))
# Kategori deteksi yang bukan makanan sehingga tidak diklasifikasikan menu.
NON_FOOD_CATEGORIES = {
    label.strip().lower()
    for label in os.environ.get('AI_NON_FOOD_CATEGORIES', 'uang').split(',')
    if label.strip()
}
# Folder split dataset (train/valid/test) kadang ikut tersimpan sebagai kelas.
INVALID_MENU_LABELS = {
    label.strip().lower()
    for label in os.environ.get('AI_INVALID_MENU_LABELS', 'train,valid,val,test').split(',')
    if label.strip()
}
MIXED_MARGIN = float(os.environ.get('AI_MIXED_MARGIN', '0.10'))
MAX_COMPARTMENTS = int(os.environ.get('AI_MAX_COMPARTMENTS', '12'))

_menu_model: YOLO | None = None
_freshness_model: YOLO | None = None
_detector_model: YOLO | None = None
_menu_names: dict[int, str] = {}
_freshness_names: dict[int, str] = {}
_detector_names: dict[int, str] = {}
_valid_menu_ids: list[int] = []


def _load_model() -> None:
    global _menu_model, _freshness_model, _detector_model
    global _menu_names, _freshness_names, _detector_names, _valid_menu_ids
    for path in (MENU_MODEL_PATH, FRESHNESS_MODEL_PATH, DETECTOR_MODEL_PATH):
        if not os.path.exists(path):
            raise FileNotFoundError(f'Model tidak ditemukan: {path}')

    _menu_model = YOLO(MENU_MODEL_PATH)
    _freshness_model = YOLO(FRESHNESS_MODEL_PATH)
    _detector_model = YOLO(DETECTOR_MODEL_PATH)
    if _menu_model.task != 'classify' or _freshness_model.task != 'classify':
        raise RuntimeError('Model menu dan kesegaran harus berupa checkpoint klasifikasi YOLO.')
    if _detector_model.task != 'detect':
        raise RuntimeError('Model deteksi harus berupa checkpoint detection YOLO.')
    _menu_names = {int(k): str(v) for k, v in _menu_model.names.items()}
    _freshness_names = {int(k): str(v) for k, v in _freshness_model.names.items()}
    _detector_names = {int(k): str(v) for k, v in _detector_model.names.items()}
    if not _menu_names or not _freshness_names or not _detector_names:
        raise RuntimeError('Checkpoint tidak memiliki metadata kelas.')

    _valid_menu_ids = [
        class_id
        for class_id, class_name in sorted(_menu_names.items())
        if class_name.strip().lower() not in INVALID_MENU_LABELS
    ]
    if not _valid_menu_ids:
        raise RuntimeError('Checkpoint menu tidak memiliki kelas hidangan yang valid.')

    print(f'Model menu dimuat: {MENU_MODEL_PATH} ({len(_menu_names)} kelas: {_menu_names})')
    print(f'Kelas menu valid dipakai untuk prediksi: {len(_valid_menu_ids)}')
    if len(_valid_menu_ids) != len(_menu_names):
        excluded = sorted(set(_menu_names.values()) - {_menu_names[i] for i in _valid_menu_ids})
        print(f'Kelas dikecualikan (bukan nama hidangan): {excluded}')
    print(f'Model kesegaran dimuat: {FRESHNESS_MODEL_PATH} ({len(_freshness_names)} kelas: {_freshness_names})')
    print(f'Model deteksi dimuat: {DETECTOR_MODEL_PATH} ({len(_detector_names)} kelas: {_detector_names})')


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_model()
    yield


app = FastAPI(title='MBG AI Service', version='1.0.0', lifespan=lifespan)


@app.get('/health')
def health() -> dict:
    loaded = _menu_model is not None and _freshness_model is not None and _detector_model is not None
    return {
        'status': 'ok' if loaded else 'unavailable',
        'model_loaded': loaded,
        'menu_model': {
            'loaded': _menu_model is not None,
            'path': MENU_MODEL_PATH,
            'classes': list(_menu_names.values()),
            'valid_classes': [_menu_names[i] for i in _valid_menu_ids],
        },
        'freshness_model': {'loaded': _freshness_model is not None, 'classes': list(_freshness_names.values())},
        'detector_model': {
            'loaded': _detector_model is not None,
            'path': DETECTOR_MODEL_PATH,
            'classes': list(_detector_names.values()),
            'non_food_categories': sorted(NON_FOOD_CATEGORIES),
        },
        'tray': {
            'rows': tray.DEFAULT_ROWS,
            'cols': tray.DEFAULT_COLS,
            'max_compartments': MAX_COMPARTMENTS,
        },
    }


def _decode(raw: bytes) -> np.ndarray:
    if not raw:
        raise HTTPException(status_code=400, detail='file gambar kosong')
    img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail='gambar tidak valid')
    return img


def _predict_menu(img: np.ndarray) -> tuple[int, str, float, dict[str, float]]:
    result = _menu_model.predict(img, imgsz=IMG_SIZE, device='cpu', verbose=False)[0]
    probs = result.probs
    if probs is None:
        raise HTTPException(status_code=500, detail='model menu tidak menghasilkan probabilitas')
    values = [float(p) for p in probs.data.tolist()]
    class_id = max(_valid_menu_ids, key=lambda idx: values[idx], default=-1)
    class_name = _menu_names.get(class_id, '') if class_id >= 0 else ''
    confidence = values[class_id] if class_id >= 0 else 0.0
    probabilities = {_menu_names[idx]: values[idx] for idx in _valid_menu_ids if idx in _menu_names}
    return class_id, class_name, confidence, probabilities


def _predict_freshness(img: np.ndarray) -> tuple[int, str, float, dict[str, float]]:
    result = _freshness_model.predict(img, imgsz=IMG_SIZE, device='cpu', verbose=False)[0]
    probs = result.probs
    if probs is None:
        raise HTTPException(status_code=500, detail='model kesegaran tidak menghasilkan probabilitas')
    values = [float(p) for p in probs.data.tolist()]
    freshness_id = int(probs.top1)
    return (
        freshness_id,
        _freshness_names.get(freshness_id, str(freshness_id)),
        values[freshness_id],
        {_freshness_names.get(idx, str(idx)): prob for idx, prob in enumerate(values)},
    )


def _whole_payload(img: np.ndarray, started: float) -> dict:
    menu_id, menu_class, menu_confidence, menu_probs = _predict_menu(img)
    freshness_id, freshness_class, freshness_confidence, freshness_probs = _predict_freshness(img)
    return {
        'menu_class_id': menu_id,
        'menu_class_name': menu_class,
        'menu_display_name': labels.menu_label(menu_class),
        'menu_confidence': menu_confidence,
        'freshness_class_id': freshness_id,
        'freshness_class_name': freshness_class,
        'freshness_display_name': labels.freshness_label(freshness_class),
        'freshness_confidence': freshness_confidence,
        'menu_class_probabilities': menu_probs,
        'freshness_class_probabilities': freshness_probs,
        'latency_ms': round((time.perf_counter() - started) * 1000, 2),
    }


def _parse_grid(grid: str | None) -> tuple[int, int]:
    if not grid:
        return tray.DEFAULT_ROWS, tray.DEFAULT_COLS
    parts = [part for part in grid.replace(',', 'x').lower().split('x') if part.strip()]
    try:
        if len(parts) == 1:
            value = max(1, min(int(parts[0]), MAX_COMPARTMENTS))
            return value, 1
        rows = max(1, min(int(parts[0]), MAX_COMPARTMENTS))
        cols = max(1, min(int(parts[1]), MAX_COMPARTMENTS // rows))
        return rows, cols
    except ValueError:
        return tray.DEFAULT_ROWS, tray.DEFAULT_COLS


@app.post('/predict')
async def predict(image: UploadFile = File(...)) -> dict:
    if _menu_model is None or _freshness_model is None:
        raise HTTPException(status_code=503, detail='model belum dimuat')
    return _whole_payload(_decode(await image.read()), time.perf_counter())


@app.post('/predict-tray')
async def predict_tray(
    image: UploadFile = File(...),
    grid: str | None = Form(None),
) -> dict:
    """Prediksi seluruh foto sekaligus per sekat nampan.

    Koordinat sekat dikembalikan dalam persentase terhadap nampan hasil
    normalisasi sehingga tetap stabil walau resolusi foto berbeda.
    """
    if _menu_model is None or _freshness_model is None:
        raise HTTPException(status_code=503, detail='model belum dimuat')

    started = time.perf_counter()
    img = _decode(await image.read())
    rows, cols = _parse_grid(grid)
    cells = tray.build_grid(rows, cols)
    if len(cells) > MAX_COMPARTMENTS:
        raise HTTPException(status_code=400, detail=f'grid {rows}x{cols} melebihi batas {MAX_COMPARTMENTS} sekat')

    rect = tray.find_tray(img)
    warped, tray_detected, matrix = tray.normalize_tray(img, rect)

    crops: list[np.ndarray] = []
    occupancy: list[tuple[float, float]] = []
    for cell in cells:
        crop = tray.crop_cell(warped, cell)
        crops.append(crop)
        occupancy.append(tray.occupancy(crop))

    original_shape = img.shape
    warped_shape = warped.shape
    results = _menu_model.predict(crops, imgsz=IMG_SIZE, device='cpu', verbose=False)
    compartments = []
    for index, (cell, crop, (ratio, texture), result) in enumerate(zip(cells, crops, occupancy, results)):
        probs = result.probs
        empty = tray.is_empty(ratio, texture)
        quad = tray.cell_quad_norm(cell, matrix, warped_shape, original_shape)
        if probs is None or empty:
            compartments.append(
                {
                    'index': index,
                    'row': cell.row,
                    'col': cell.col,
                    'cell': cell.label,
                    'bbox_norm': list(cell.bbox),
                    'bbox_quad_norm': quad,
                    'empty': empty,
                    'food_ratio': round(ratio, 4),
                    'texture': round(texture, 2),
                    'menu_class_id': -1,
                    'menu_class_name': '',
                    'menu_display_name': '',
                    'menu_confidence': 0.0,
                    'mixed': False,
                    'alternatives': {},
                }
            )
            continue

        values = [float(p) for p in probs.data.tolist()]
        ranked = sorted(
            ((idx, values[idx]) for idx in _valid_menu_ids if idx in _menu_names),
            key=lambda item: item[1],
            reverse=True,
        )
        top_id, top_conf = ranked[0] if ranked else (-1, 0.0)
        runner_up = ranked[1][1] if len(ranked) > 1 else 0.0
        alternatives = {_menu_names[idx]: value for idx, value in ranked[:3]}
        compartments.append(
            {
                'index': index,
                'row': cell.row,
                'col': cell.col,
                'cell': cell.label,
                'bbox_norm': list(cell.bbox),
                'bbox_quad_norm': quad,
                'empty': False,
                'food_ratio': round(ratio, 4),
                'texture': round(texture, 2),
                'menu_class_id': top_id,
                'menu_class_name': _menu_names.get(top_id, ''),
                'menu_display_name': labels.menu_label(_menu_names.get(top_id, '')),
                'menu_confidence': top_conf,
                'mixed': (top_conf - runner_up) < MIXED_MARGIN,
                'alternatives': alternatives,
            }
        )

    payload = _whole_payload(img, started)
    payload.update(
        {
            'tray_detected': tray_detected,
            'grid': {'rows': rows, 'cols': cols},
            'compartments': compartments,
            'latency_ms': round((time.perf_counter() - started) * 1000, 2),
        }
    )
    return payload


def _rank_menu_probs(result) -> list[tuple[int, float]]:
    """Urutkan kelas menu valid dari probabilitas terbesar ke terkecil."""
    probs = result.probs
    if probs is None:
        return []
    values = [float(p) for p in probs.data.tolist()]
    return sorted(
        ((idx, values[idx]) for idx in _valid_menu_ids if idx in _menu_names),
        key=lambda item: item[1],
        reverse=True,
    )


def _clamp_box(x1: int, y1: int, x2: int, y2: int, height: int, width: int) -> tuple[int, int, int, int]:
    x1 = max(0, min(x1, width - 1))
    y1 = max(0, min(y1, height - 1))
    x2 = max(0, min(x2, width))
    y2 = max(0, min(y2, height))
    if x2 <= x1:
        x2 = min(width, x1 + 1)
    if y2 <= y1:
        y2 = min(height, y1 + 1)
    return x1, y1, x2, y2


@app.post('/predict-detect')
async def predict_detect(image: UploadFile = File(...), conf: str | None = Form(None)) -> dict:
    """Pendekatan 1 (two-stage): deteksi bounding box lalu klasifikasi per crop.

    Tahap 1 model deteksi menghasilkan bbox + kategori umum, tiap crop
    dikirim ke model klasifikasi untuk nama menu spesifik. Kategori non-makanan
    (mis. uang) dilewati tahap klasifikasi.
    """
    if _menu_model is None or _detector_model is None:
        raise HTTPException(status_code=503, detail='model belum dimuat')

    try:
        min_conf = float(conf) if conf not in (None, '') else DET_CONF
    except ValueError:
        raise HTTPException(status_code=400, detail='conf harus berupa angka')
    min_conf = max(0.0, min(min_conf, 1.0))

    started = time.perf_counter()
    img = _decode(await image.read())
    height, width = img.shape[:2]

    det = _detector_model.predict(
        img, imgsz=DET_IMGSZ, conf=min_conf, iou=DET_IOU, device='cpu', verbose=False
    )[0]

    boxes: list[dict] = []
    crops: list[np.ndarray] = []
    for box in det.boxes:
        category = _detector_names.get(int(box.cls[0]), '')
        x1, y1, x2, y2 = _clamp_box(*(int(v) for v in box.xyxy[0].tolist()), height, width)
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        boxes.append(
            {
                'kategori_umum': category,
                'confidence_deteksi': round(float(box.conf[0]), 4),
                'box': [x1, y1, x2, y2],
            }
        )
        crops.append(crop)

    # Tahap 2: klasifikasi seluruh crop sekaligus (batch) agar latensi minimal.
    classify_index: list[int] = []
    classify_crops: list[np.ndarray] = []
    for index, (entry, crop) in enumerate(zip(boxes, crops)):
        if entry['kategori_umum'].strip().lower() in NON_FOOD_CATEGORIES:
            continue
        classify_index.append(index)
        classify_crops.append(crop)

    if classify_crops:
        results = _menu_model.predict(classify_crops, imgsz=IMG_SIZE, device='cpu', verbose=False)
        for index, result in zip(classify_index, results):
            ranked = _rank_menu_probs(result)
            top_id, top_conf = ranked[0] if ranked else (-1, 0.0)
            top_raw = _menu_names.get(top_id, '')
            boxes[index]['nama_spesifik_id'] = top_id
            boxes[index]['nama_spesifik'] = labels.menu_label(top_raw)
            boxes[index]['nama_spesifik_asli'] = top_raw
            boxes[index]['confidence_klasifikasi'] = round(top_conf, 4)
            boxes[index]['alternatives'] = {
                labels.menu_label(_menu_names[idx]): round(value, 4) for idx, value in ranked[:3]
            }

    items = []
    for entry in boxes:
        items.append(
            {
                'kategori_umum': entry['kategori_umum'],
                'nama_spesifik': entry.get('nama_spesifik', ''),
                'nama_spesifik_asli': entry.get('nama_spesifik_asli', ''),
                'confidence_deteksi': entry['confidence_deteksi'],
                'confidence_klasifikasi': entry.get('confidence_klasifikasi', 0.0),
                'alternatives': entry.get('alternatives', {}),
                'box': entry['box'],
            }
        )

    return {
        'status': 'success',
        'total_item': len(items),
        'data': items,
        'latency_ms': round((time.perf_counter() - started) * 1000, 2),
    }
