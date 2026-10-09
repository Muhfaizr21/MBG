from app.labels import FRESHNESS_LABEL_ID, MENU_LABEL_ID, freshness_label, menu_label


def test_every_food101_class_has_indonesian_label():
    # Kelas valid checkpoint food_recognition_best.pt (35 hidangan Food-101).
    food101 = {
        'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
        'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
        'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
        'ceviche', 'cheese_plate', 'cheesecake', 'chicken_curry', 'chicken_quesadilla',
        'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
        'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
        'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
    }
    assert food101 <= set(MENU_LABEL_ID)


def test_menu_label_returns_indonesian_display_name():
    assert menu_label('chicken_curry') == 'kari ayam'
    assert menu_label('Chicken-Curry') == 'kari ayam'
    assert menu_label(' ') == ''


def test_menu_label_keeps_unknown_class_verbatim():
    # Kelas SPPG hasil retrain harus lolos tanpa perlu tambah peta.
    assert menu_label('nasi_kuning') == 'nasi_kuning'


def test_freshness_labels_are_indonesian():
    assert freshness_label('Fresh') == 'Segar'
    assert freshness_label('Spoiled') == 'Basi'
    assert freshness_label('Segar') == 'Segar'
    assert set(FRESHNESS_LABEL_ID) == {'Fresh', 'Spoiled'}
