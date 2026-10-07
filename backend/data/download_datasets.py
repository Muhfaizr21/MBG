"""Unduh file data (CSV/JSON/XLSX/TXT) dari folder Drive publik DATASET_KAWANGIZI.

Folder sumber: https://drive.google.com/drive/folders/1x5ZEu2BoLQYk6WdzbfpOOx6CuU0IcWJP
Folder bersifat publik, sehingga unduhan dilakukan tanpa OAuth lewat
https://drive.google.com/uc?export=download&id=<id> (fallback: drive.usercontent.google.com).

Pemakaian:
    python backend/data/download_datasets.py
"""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

FOLDER_ID = '1x5ZEu2BoLQYk6WdzbfpOOx6CuU0IcWJP'
FOLDER_URL = f'https://drive.google.com/drive/folders/{FOLDER_ID}'
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/126.0 Safari/537.36'
)
EXTENSIONS = ('.csv', '.json', '.xlsx', '.txt')

# ID -> nama file (diekstrak dari HTML publik folder; ID di-hardcode agar deterministik).
FILES = {
    '1IspGtM6dlHgMZHbGXJpceGZvlcBfKZOZ': 'dataset_kesimpulan_train.json',
    '1qJd8dgWLwyB60Co5tzhpGtQCVDEnAfe9': 'dataset_nutrisi_kasar.csv',
    '1-xTvIG7ZqANh-FOMOC_Tbq-u865OtI3V': 'dataset_nutrisi_train.json',
    '1GMkM-xrEFdz0aZ-gomHLR0wUrnMFUr4i': 'food_spoilage.csv',
    '1iysBeV1tyk-46eAW7HL1k4UddRZYnfHI': (
        'Jumlah Siswa SMA-MA-SMK sederajat yang Mendapatkan Makanan Bergizi Gratis '
        '(MBG) di Kabupaten Pati, 2025.json'
    ),
    '1cRBz2Y9gRq76weY5K8b2XoYotixSPhJx': (
        'jumlah Siswa SMP-MTs sederajat yang Mendapatkan Makanan Bergizi Gratis '
        '(MBG) di Kabupaten Pati, 2025.json'
    ),
    '1Si-_O2c4N07tNHVmpgtGQiL1B4gFfcOH': (
        'jumlah-siswa-sd-mi-sederajat-yang-mendapatkan-makanan-bergizi-gratis-'
        'mbg-di-kabupaten-pati-2025.xlsx'
    ),
    '1prIAVNfoSy50Uy3xLyPUf_G_SBvuK_rR': 'nilai-gizi.csv',
    '1oNBSy5Nj9Q6lR6kPv9iAiZeYLKbP0Dzf': 'sppg_operasional.csv',
}


def _open(url: str):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    return urllib.request.urlopen(req, timeout=120)


def download_file(file_id: str, dest_path: str) -> int:
    """Unduh satu file Drive publik. Return jumlah byte yang ditulis."""
    urls = [
        f'https://drive.google.com/uc?export=download&id={file_id}',
        (
            'https://drive.usercontent.google.com/download'
            f'?id={file_id}&export=download&confirm=t'
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
        # Halaman confirm (file besar) masih berupa HTML, bukan konten file.
        if 'text/html' in content_type or data[:20].lstrip().startswith(b'<'):
            last_error = RuntimeError(f'respons HTML dari {url}')
            continue
        with open(dest_path, 'wb') as fh:
            fh.write(data)
        return len(data)
    raise RuntimeError(f'gagal mengunduh {file_id}: {last_error}')


def discover_from_folder() -> dict:
    """Fallback: telusuri HTML folder publik untuk file data tambahan."""
    with _open(FOLDER_URL) as resp:
        page = resp.read().decode('utf-8', errors='replace')
    found = {}
    for match in re.finditer(r'data-id="([^"]+)"[^>]*data-tooltip="([^"]+)"', page):
        file_id, name = match.group(1), match.group(2)
        if name.lower().endswith(EXTENSIONS):
            found[file_id] = name
    return found


def main() -> int:
    files = dict(FILES)
    try:
        for file_id, name in discover_from_folder().items():
            files.setdefault(file_id, name)
    except Exception as exc:  # network gagal -> pakai daftar hardcode
        print(f'! penelusuran folder dilewati ({exc}); memakai daftar ID hardcode')

    ok, failed = 0, []
    for file_id, name in files.items():
        dest = os.path.join(DATA_DIR, name)
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            print(f'= {name} (sudah ada, dilewati)')
            ok += 1
            continue
        try:
            size = download_file(file_id, dest)
            print(f'+ {name} ({size:,} byte)')
            ok += 1
        except Exception as exc:
            print(f'! {name} GAGAL: {exc}')
            failed.append(name)

    print(f'\nSelesai: {ok}/{len(files)} file tersedia di {DATA_DIR}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
