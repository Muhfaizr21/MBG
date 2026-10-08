from app import tray
from app.main import MAX_COMPARTMENTS, _parse_grid


def test_parse_grid_uses_defaults_when_absent():
    assert _parse_grid(None) == (tray.DEFAULT_ROWS, tray.DEFAULT_COLS)
    assert _parse_grid('') == (tray.DEFAULT_ROWS, tray.DEFAULT_COLS)


def test_parse_grid_accepts_single_value_and_pair():
    assert _parse_grid('4') == (4, 1)
    assert _parse_grid('2x3') == (2, 3)
    assert _parse_grid('3,2') == (3, 2)


def test_parse_grid_never_exceeds_compartment_limit():
    rows, cols = _parse_grid('12x12')
    assert rows * cols <= MAX_COMPARTMENTS
    rows, cols = _parse_grid('0x0')
    assert rows >= 1 and cols >= 1


def test_parse_grid_falls_back_on_garbage():
    assert _parse_grid('nasi') == (tray.DEFAULT_ROWS, tray.DEFAULT_COLS)
    assert _parse_grid('2x') == (2, 1)
