"""AI service MBG: klasifikasi kesegaran makanan YOLOv8n-cls (best.pt).

Dipanggil oleh gateway Go (POST /api/scans) lewat POST /predict.
Jalankan dari folder backend/ai_service:
    uvicorn app.main:app --host 127.0.0.1 --port 8083
"""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get(
    'AI_MODEL_PATH',
    os.path.normpath(os.path.join(BASE_DIR, '..', '..', 'model_ai', 'yolov8_cls_best.pt')),
)
IMG_SIZE = int(os.environ.get('AI_IMGSZ', '224'))

_model: YOLO | None = None
_class_names: dict[int, str] = {}


def _load_model() -> None:
    global _model, _class_names
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f'Model tidak ditemukan: {MODEL_PATH}. '
            'Jalankan dulu: python backend/model_ai/download_yolov8.py'
        )
    _model = YOLO(MODEL_PATH)
    _class_names = {int(k): str(v) for k, v in _model.names.items()}
    print(f'Model dimuat: {MODEL_PATH} ({len(_class_names)} kelas: {_class_names})')


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_model()
    yield


app = FastAPI(title='MBG AI Service', version='1.0.0', lifespan=lifespan)


@app.get('/health')
def health() -> dict:
    return {
        'status': 'ok',
        'model_loaded': _model is not None,
        'classes': list(_class_names.values()),
    }


@app.post('/predict')
async def predict(image: UploadFile = File(...)) -> dict:
    if _model is None:
        raise HTTPException(status_code=503, detail='model belum dimuat')

    started = time.perf_counter()
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail='file gambar kosong')

    buffer = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail='gambar tidak valid')

    result = _model.predict(img, imgsz=IMG_SIZE, device='cpu', verbose=False)[0]
    probs = result.probs
    if probs is None:
        raise HTTPException(status_code=500, detail='model tidak menghasilkan probabilitas')

    probabilities = [float(p) for p in probs.data.tolist()]
    top_id = int(probs.top1)
    latency_ms = round((time.perf_counter() - started) * 1000, 2)

    return {
        'class_id': top_id,
        'class_name': _class_names.get(top_id, str(top_id)),
        'confidence': probabilities[top_id],
        'class_probabilities': {
            _class_names.get(idx, str(idx)): prob
            for idx, prob in enumerate(probabilities)
        },
        'latency_ms': latency_ms,
    }
