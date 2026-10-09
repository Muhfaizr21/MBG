"""Peta nama kelas checkpoint ke tampilan bahasa Indonesia.

Checkpoint klasifikasi (food_recognition_best.pt) melatih kelas Food-101
berbahasa Inggris, sedangkan aplikasi menampilkan nama menu kepada petugas
dalam bahasa Indonesia. Pemetaan hanya dipakai pada lapisan presentasi
(/predict-detect); label asli tetap disertakan untuk audit.

Kelas yang tidak terdaftar (mis. kelas SPPG seperti nasi_kuning setelah
retrain) dilewatkan apa adanya sehingga model baru langsung dipakai tanpa
ubah kode.
"""

from __future__ import annotations

# kelas checkpoint -> nama tampilan Indonesia
MENU_LABEL_ID: dict[str, str] = {
    'apple_pie': 'pai apel',
    'baby_back_ribs': 'iga panggang',
    'baklava': 'baklava',
    'beef_carpaccio': 'karpasio daging sapi',
    'beef_tartare': 'tartar daging sapi',
    'beet_salad': 'salad bit',
    'beignets': 'kue goreng beignet',
    'bibimbap': 'bibimbap',
    'bread_pudding': 'puding roti',
    'breakfast_burrito': 'burrito sarapan',
    'bruschetta': 'bruschetta',
    'caesar_salad': 'salad caesar',
    'cannoli': 'kue cannoli',
    'caprese_salad': 'salad caprese',
    'carrot_cake': 'kue wortel',
    'ceviche': 'ceviche ikan',
    'cheese_plate': 'papan keju',
    'cheesecake': 'kue keju',
    'chicken_curry': 'kari ayam',
    'chicken_quesadilla': 'kesadilla ayam',
    'chicken_wings': 'sayap ayam',
    'chocolate_cake': 'kue cokelat',
    'chocolate_mousse': 'mousse cokelat',
    'churros': 'churros',
    'clam_chowder': 'sup kerang',
    'club_sandwich': 'sandwich club',
    'crab_cakes': 'bola-bola kepiting',
    'creme_brulee': 'krim brulee',
    'croque_madame': 'croque madame',
    'cup_cakes': 'cupcake',
    'deviled_eggs': 'telur isi',
    'donuts': 'donat',
    'dumplings': 'dumpling',
    'edamame': 'edamame',
    'eggs_benedict': 'telur benedict',
    # Kelas split dataset yang bukan nama hidangan; sudah difilter di main.py,
    # dicantumkan di sini agar ikut tampil Indonesia bila lolos.
    'test': 'uji coba',
    'train': 'data latih',
    'valid': 'data validasi',
}

# Kelas kesegaran -> tampilan Indonesia.
FRESHNESS_LABEL_ID: dict[str, str] = {
    'Fresh': 'Segar',
    'Spoiled': 'Basi',
}


def _key(name: str) -> str:
    return name.strip().lower().replace('-', '_').replace(' ', '_')


def menu_label(class_name: str) -> str:
    """Kembalikan nama tampilan Indonesia untuk kelas menu."""
    if not class_name or not class_name.strip():
        return ''
    return MENU_LABEL_ID.get(_key(class_name), class_name)


def freshness_label(class_name: str) -> str:
    """Kembalikan nama tampilan Indonesia untuk kelas kesegaran."""
    if not class_name or not class_name.strip():
        return ''
    return FRESHNESS_LABEL_ID.get(class_name.strip(), class_name)
