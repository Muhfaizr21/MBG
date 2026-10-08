import cv2
import numpy as np

from app import tray


def make_photo_with_tray(width=640, height=480) -> np.ndarray:
    """Foto nampan trapesium di atas latar gelap, meniru sudut pengambilan gambar."""
    img = np.full((height, width, 3), 35, dtype=np.uint8)
    rng = np.random.default_rng(7)
    noise = rng.integers(0, 25, (height, width, 3), dtype=np.uint8)
    img = cv2.add(img, noise)

    src = np.float32([[120, 70], [530, 95], [575, 430], [70, 405]])
    cv2.fillPoly(img, [src.astype(np.int32)], (185, 182, 175))
    return img, src


def test_build_grid_bounds_and_inset():
    cells = tray.build_grid(rows=2, cols=3, inset=0.05)
    assert len(cells) == 6
    assert [cell.label for cell in cells] == ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']
    for cell in cells:
        x1, y1, x2, y2 = cell.bbox
        assert 0.0 < x1 < x2 < 1.0
        assert 0.0 < y1 < y2 < 1.0
        assert x1 - (cell.col / 3) > 0
        assert y1 - (cell.row / 2) > 0


def test_build_grid_rejects_invalid_dimensions():
    assert len(tray.build_grid(rows=0, cols=0)) == 1
    assert len(tray.build_grid(rows=3, cols=3, inset=0.9)) == 9


def test_find_tray_detects_quadrilateral():
    img, src = make_photo_with_tray()
    rect = tray.find_tray(img)
    assert rect is not None
    found = sorted(map(tuple, np.round(rect).astype(int).tolist()))
    expected = sorted(map(tuple, np.round(src).astype(int).tolist()))
    for point, target in zip(found, expected):
        assert np.linalg.norm(np.array(point) - np.array(target)) < 25


def test_find_tray_returns_none_on_flat_image():
    flat = np.full((240, 320, 3), 128, dtype=np.uint8)
    assert tray.find_tray(flat) is None


def test_normalize_tray_warps_to_canonical_width():
    img, src = make_photo_with_tray()
    warped, detected, matrix = tray.normalize_tray(img, src)
    assert detected is True
    assert matrix is not None
    assert warped.shape[1] == tray.TRAY_TARGET_WIDTH
    assert warped.shape[0] > 0


def test_normalize_tray_without_detection_keeps_original_geometry():
    img = np.full((240, 320, 3), 128, dtype=np.uint8)
    warped, detected, matrix = tray.normalize_tray(img, None)
    assert detected is False
    assert matrix is None
    assert warped.shape == img.shape


def test_cell_quad_norm_without_tray_keeps_bbox():
    cell = tray.build_grid(rows=2, cols=2)[0]
    quad = tray.cell_quad_norm(cell, None, (200, 400, 3), (200, 400, 3))
    expected = [
        [cell.bbox[0], cell.bbox[1]],
        [cell.bbox[2], cell.bbox[1]],
        [cell.bbox[2], cell.bbox[3]],
        [cell.bbox[0], cell.bbox[3]],
    ]
    assert np.allclose(quad, expected, atol=1e-6)


def test_cell_quad_norm_maps_back_onto_original_photo():
    img, src = make_photo_with_tray()
    rect = tray.find_tray(img)
    assert rect is not None
    warped, detected, matrix = tray.normalize_tray(img, rect)
    assert detected is True

    cells = tray.build_grid(rows=2, cols=2, inset=0.05)
    for cell in cells:
        quad = tray.cell_quad_norm(cell, matrix, warped.shape, img.shape)
        for x, y in quad:
            assert 0.0 <= x <= 1.0 and 0.0 <= y <= 1.0
        # Sudut sekat harus berada di sekitar bidang nampan asli.
        xs = [x for x, _ in quad]
        ys = [y for _, y in quad]
        tray_x = [p[0] / img.shape[1] for p in src]
        tray_y = [p[1] / img.shape[0] for p in src]
        assert min(tray_x) - 0.05 <= min(xs) <= max(tray_x)
        assert min(tray_y) - 0.05 <= min(ys) <= max(tray_y)
        assert max(xs) <= max(tray_x) + 0.05
        assert max(ys) <= max(tray_y) + 0.05


def test_occupancy_flags_empty_and_filled_compartments():
    empty = np.full((120, 160, 3), (170, 168, 160), dtype=np.uint8)
    ratio, texture = tray.occupancy(empty)
    assert tray.is_empty(ratio, texture) is True

    filled = empty.copy()
    rng = np.random.default_rng(3)
    blob = rng.integers(0, 255, (70, 90, 3), dtype=np.uint8)
    filled[25:95, 35:125] = blob
    ratio, texture = tray.occupancy(filled)
    assert ratio > tray.FOOD_MIN_RATIO
    assert tray.is_empty(ratio, texture) is False


def test_occupancy_keeps_fully_covered_compartment_detected():
    rng = np.random.default_rng(11)
    covered = rng.integers(40, 220, (120, 160, 3), dtype=np.uint8)
    ratio, texture = tray.occupancy(covered)
    assert tray.is_empty(ratio, texture) is False


def test_crop_cell_uses_normalised_coordinates():
    tray_img = np.zeros((200, 400, 3), dtype=np.uint8)
    cell = tray.build_grid(rows=2, cols=2, inset=0.1)[3]
    crop = tray.crop_cell(tray_img, cell)
    x1, y1, x2, y2 = cell.bbox
    assert crop.shape[0] == int(round(y2 * 200)) - int(round(y1 * 200))
    assert crop.shape[1] == int(round(x2 * 400)) - int(round(x1 * 400))
