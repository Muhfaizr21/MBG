"""Normalisasi nampan dan pemotongan sekat per komponen.

Koordinat sekat disimpan dalam bentuk persentase (0.0-1.0) terhadap bidang
nampan yang sudah dinormalisasi sehingga tetap valid meski resolusi foto
berubah. Foto nampan miring ditangani lebih dulu lewat transformasi
perspektif ke persegi kanonik, baru grid dipotong.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import cv2
import numpy as np

TRAY_TARGET_WIDTH = int(os.environ.get('AI_TRAY_WIDTH', '900'))
DEFAULT_ROWS = max(1, int(os.environ.get('AI_TRAY_ROWS', '2')))
DEFAULT_COLS = max(1, int(os.environ.get('AI_TRAY_COLS', '3')))
CELL_INSET = float(os.environ.get('AI_TRAY_INSET', '0.04'))
MIN_TRAY_AREA_RATIO = float(os.environ.get('AI_TRAY_MIN_AREA', '0.20'))
FOOD_COLOR_DISTANCE = float(os.environ.get('AI_FOOD_COLOR_DIST', '42'))
FOOD_MIN_RATIO = float(os.environ.get('AI_FOOD_MIN_RATIO', '0.12'))
TEXTURE_MIN_VARIANCE = float(os.environ.get('AI_TEXTURE_MIN', '55'))
EDGE_MARGIN_RATIO = 0.08


@dataclass(frozen=True)
class Cell:
    """Satu sekat nampan dalam koordinat normalisasi (0.0-1.0)."""

    row: int
    col: int
    bbox: tuple[float, float, float, float]

    @property
    def label(self) -> str:
        return f'{chr(ord("A") + self.row)}{self.col + 1}'


def build_grid(rows: int = DEFAULT_ROWS, cols: int = DEFAULT_COLS, inset: float = CELL_INSET) -> list[Cell]:
    rows = max(1, int(rows))
    cols = max(1, int(cols))
    inset = min(max(inset, 0.0), 0.25)
    cells: list[Cell] = []
    for row in range(rows):
        for col in range(cols):
            x1 = (col + inset) / cols
            x2 = (col + 1 - inset) / cols
            y1 = (row + inset) / rows
            y2 = (row + 1 - inset) / rows
            cells.append(Cell(row=row, col=col, bbox=(x1, y1, x2, y2)))
    return cells


def _order_points(points: np.ndarray) -> np.ndarray:
    points = np.asarray(points, dtype=np.float32).reshape(4, 2)
    total = points.sum(axis=1)
    diff = np.diff(points, axis=1).reshape(-1)
    return np.array(
        [
            points[np.argmin(total)],
            points[np.argmin(diff)],
            points[np.argmax(total)],
            points[np.argmax(diff)],
        ],
        dtype=np.float32,
    )


def _distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))


def find_tray(img: np.ndarray) -> np.ndarray | None:
    """Cari quadrilateral nampan terbesar. Mengembalikan titik dalam skala asli atau None."""
    height, width = img.shape[:2]
    scale = min(1.0, 480.0 / max(height, width))
    small = cv2.resize(img, (int(width * scale), int(height * scale))) if scale < 1.0 else img.copy()

    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 40, 130)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    image_area = float(small.shape[0] * small.shape[1])
    min_area = MIN_TRAY_AREA_RATIO * image_area
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:12]:
        area = cv2.contourArea(contour)
        if area < min_area:
            break
        approx = cv2.approxPolyDP(contour, 0.03 * cv2.arcLength(contour, True), True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue

        rect = _order_points(approx.reshape(4, 2))
        top = (_distance(rect[0], rect[1]) + _distance(rect[3], rect[2])) / 2.0
        left = (_distance(rect[0], rect[3]) + _distance(rect[1], rect[2])) / 2.0
        if top < 1.0 or left < 1.0:
            continue
        aspect = top / left
        if not 0.3 <= aspect <= 3.2:
            continue
        if area / image_area < MIN_TRAY_AREA_RATIO:
            continue
        return rect / scale
    return None


def normalize_tray(img: np.ndarray, rect: np.ndarray | None) -> tuple[np.ndarray, bool, np.ndarray | None]:
    """Warp nampan ke persegi kanonik.

    Mengembalikan (gambar kanonik, terdeteksi, matriks perspektif). Matriks
    dipakai untuk memetakan kembali koordinat sekat ke foto asli sehingga
    overlay di frontend dapat digambar tepat di atas gambar pengguna.
    """
    height, width = img.shape[:2]
    if rect is None:
        return img.copy(), False, None

    top = (_distance(rect[0], rect[1]) + _distance(rect[3], rect[2])) / 2.0
    left = (_distance(rect[0], rect[3]) + _distance(rect[1], rect[2])) / 2.0
    target_w = float(TRAY_TARGET_WIDTH)
    target_h = max(1.0, round(target_w * left / top))
    dst = np.array(
        [[0.0, 0.0], [target_w - 1, 0.0], [target_w - 1, target_h - 1], [0.0, target_h - 1]],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(np.asarray(rect, dtype=np.float32), dst)
    warped = cv2.warpPerspective(img, matrix, (int(target_w), int(target_h)))
    return warped, True, matrix


def cell_quad_norm(
    cell: Cell,
    matrix: np.ndarray | None,
    warped_shape: tuple[int, ...],
    original_shape: tuple[int, ...],
) -> list[list[float]]:
    """Empat sudut sekat dalam koordinat normalisasi (0-1) terhadap foto asli.

    Saat nampan tidak terdeteksi, ruang kanonik identik dengan foto sehingga
    koordinat sekat cukup dipakai apa adanya.
    """
    x1, y1, x2, y2 = cell.bbox
    corners = np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.float32)
    if matrix is None:
        return [[float(x), float(y)] for x, y in corners]

    warped_h, warped_w = warped_shape[:2]
    orig_h, orig_w = original_shape[:2]
    warped_pixels = corners * np.array([warped_w, warped_h], dtype=np.float32)
    homogeneous = np.hstack([warped_pixels, np.ones((4, 1), dtype=np.float32)])

    inverse = np.linalg.inv(matrix)
    original = (inverse @ homogeneous.T).T
    original = original[:, :2] / original[:, 2:3]
    return [[float(px / orig_w), float(py / orig_h)] for px, py in original]


def occupancy(crop: np.ndarray) -> tuple[float, float]:
    """Rasio piksel makanan dan varians tekstur satu sekat.

    Makanan dianggap ada bila warnanya menjauh dari warna dasar nampan pada
    cincin tepi, atau bila permukaannya bertekstur. Keduanya dipakai bersama
    karena sekat penuh membuat perkiraan warna dasar dari tepi tidak andal.
    """
    if crop is None or crop.size == 0:
        return 0.0, 0.0

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    texture = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    height, width = crop.shape[:2]
    ring = max(2, int(min(height, width) * EDGE_MARGIN_RATIO))
    if height > 2 * ring and width > 2 * ring:
        border = crop.copy()
        border[ring:height - ring, ring:width - ring] = 0
        mask = np.ones((height, width), dtype=bool)
        mask[ring:height - ring, ring:width - ring] = False
        border_pixels = crop[mask]
    else:
        border_pixels = crop.reshape(-1, 3)
    if border_pixels.size == 0:
        border_pixels = crop.reshape(-1, 3)

    background = np.median(border_pixels, axis=0).astype(np.float32)
    distance = np.linalg.norm(crop.astype(np.float32) - background, axis=2)
    ratio = float((distance > FOOD_COLOR_DISTANCE).mean())
    return ratio, texture


def is_empty(ratio: float, texture: float) -> bool:
    return ratio < FOOD_MIN_RATIO and texture < TEXTURE_MIN_VARIANCE


def crop_cell(tray: np.ndarray, cell: Cell) -> np.ndarray:
    height, width = tray.shape[:2]
    x1, y1, x2, y2 = cell.bbox
    px1 = int(round(x1 * width))
    px2 = int(round(x2 * width))
    py1 = int(round(y1 * height))
    py2 = int(round(y2 * height))
    return tray[py1:max(py2, py1 + 1), px1:max(px2, px1 + 1)]
