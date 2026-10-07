import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')
TOKEN_FILE = os.path.join(BASE_DIR, 'token.json')

# ID Folder Dataset_Fruits_Vegetables dari Google Drive Anda
FOLDER_ID = '1BtsJd56VnCzhkrJm2ERRBp3rIhLvTbSX'


def get_drive_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(
                host='127.0.0.1',
                port=8765,
                open_browser=True,
                access_type='offline',
                prompt='consent',
            )
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        print('Token disimpan ke', TOKEN_FILE)
    return build('drive', 'v3', credentials=creds)


def list_children(service, folder_id):
    items = []
    page_token = None
    while True:
        response = service.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            fields='nextPageToken, files(id, name, mimeType, size)',
            pageSize=1000,
            pageToken=page_token,
        ).execute()
        items.extend(response.get('files', []))
        page_token = response.get('nextPageToken')
        if not page_token:
            break
    return items


service = get_drive_service()

items = list_children(service, FOLDER_ID)

folders = [i for i in items if i['mimeType'] == 'application/vnd.google-apps.folder']
others = [i for i in items if i['mimeType'] != 'application/vnd.google-apps.folder']

print(f"\nIsi folder {FOLDER_ID} -> {len(items)} item")
print(f"\nSub-folder ({len(folders)}):")
for item in folders:
    print(f"- {item['name']} (ID: {item['id']})")

print(f"\nFile ({len(others)}):")
for item in others[:50]:
    size = int(item.get('size', 0) or 0)
    print(f"- {item['name']} ({size} bytes, ID: {item['id']})")
if len(others) > 50:
    print(f"... dan {len(others) - 50} file lainnya")
