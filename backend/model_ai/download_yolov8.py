"""Unduh model klasifikasi YOLOv8n-cls `best.pt` dari Google Drive (folder publik).

Model: run training `freshness_cls_model-12` (task classify, yolov8n-cls, imgsz 224).
File bersifat publik, sehingga unduhan dilakukan tanpa OAuth lewat
https://drive.google.com/uc?export=download&id=<id> (fallback: drive.usercontent.google.com).

Pemakaian:
    python backend/model_ai/download_yolov8.py
"""

import os
import sys
import urllib.error
import urllib.request

FILE_ID = '18550uQwWRlhGaZtfag-oLOH-7svotjKa'
EXPECTED_SIZE = 2_964_808
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEST_PATH = os.path.join(BASE_DIR, 'yolov8_cls_best.pt')
USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/126.0 Safari/537.36'
)


def _open(url: str):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    return urllib.request.urlopen(req, timeout=120)


def download(dest_path: str) -> int:
    urls = [
        f'https://drive.google.com/uc?export=download&id={FILE_ID}',
        (
            'https://drive.usercontent.google.com/download'
            f'?id={FILE_ID}&export=download&confirm=t'
        ),
    ]
    last_error = None
    for url in urls:
        try:
            with _open(url) as resp:
                data = resp.read()
                content_type = resp.headers.get('Content-Type', '')
        except urllib.error.HTTPError as exc:
            last_error = exc
            continue
        if 'text/html' in content_type or data[:20].lstrip().startswith(b'<'):
            last_error = RuntimeError(f'respons HTML dari {url}')
            continue
        with open(dest_path, 'wb') as fh:
            fh.write(data)
        return len(data)
    raise RuntimeError(f'gagal mengunduh model: {last_error}')


def main() -> int:
    if os.path.exists(DEST_PATH) and os.path.getsize(DEST_PATH) > 0:
        size = os.path.getsize(DEST_PATH)
        print(f'= {DEST_PATH} sudah ada ({size:,} byte), dilewati')
        if size != EXPECTED_SIZE:
            print(f'! peringatan: ukuran berbeda dari yang diharapkan {EXPECTED_SIZE:,} byte')
        return 0

    size = download(DEST_PATH)
    print(f'+ {DEST_PATH} ({size:,} byte)')
    if size != EXPECTED_SIZE:
        print(f'! peringatan: ukuran berbeda dari yang diharapkan {EXPECTED_SIZE:,} byte')
        return 1
    print('OK: model siap dipakai AI service.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
