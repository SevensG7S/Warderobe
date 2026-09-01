import os
import hmac
import hashlib
import json
import uuid
from urllib.parse import parse_qsl, unquote
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
from rembg import remove
from PIL import Image
import io

BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/wardrobe")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "https://your-account-id.r2.cloudflarestorage.com")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "your-access-key")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "your-secret-key")
S3_BUCKET = os.getenv("S3_BUCKET", "wardrobe-images")
S3_PUBLIC_DOMAIN = os.getenv("S3_PUBLIC_DOMAIN", "https://pub-your-id.r2.dev")

app = FastAPI(title="Wardrobe TMA Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
)

def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

def validate_telegram_init_data(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("tma "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    init_data_raw = authorization[4:]
    try:
        parsed_data = dict(parse_qsl(init_data_raw, keep_blank_values=True))
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed initData")

    if "hash" not in parsed_data:
        raise HTTPException(status_code=401, detail="Hash missing from initData")

    received_hash = parsed_data.pop("hash")
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))

    # Вычисление secret_key = HMAC_SHA256("WebAppData", bot_token)
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    user_dict = json.loads(unquote(parsed_data.get("user", "{}")))
    return user_dict

# ----------------- Эндпоинты -----------------

@app.get("/items")
def list_items(category: Optional[str] = None, user: dict = Depends(validate_telegram_init_data), db=Depends(get_db)):
    tg_id = user.get("id")
    with db.cursor() as cur:
        if category:
            cur.execute("SELECT * FROM items WHERE user_id = %s AND category = %s ORDER BY created_at DESC", (str(tg_id), category))
        else:
            cur.execute("SELECT * FROM items WHERE user_id = %s ORDER BY created_at DESC", (str(tg_id),))
        rows = cur.fetchall()
    return rows

@app.post("/items/upload")
async def upload_item(
    file: UploadFile = File(...),
    category: str = Form(...),
    color: str = Form(...),
    name: str = Form(...),
    brand: Optional[str] = Form(None),
    user: dict = Depends(validate_telegram_init_data),
    db=Depends(get_db),
):
    tg_id = str(user.get("id"))
    raw_bytes = await file.read()

    # 1. Удаление фона через rembg
    input_image = Image.open(io.BytesIO(raw_bytes))
    output_image = remove(input_image)

    out_bytes = io.BytesIO()
    output_image.save(out_bytes, format="PNG")
    out_bytes.seek(0)

    # 2. Загрузка в S3 / Cloudflare R2
    item_id = str(uuid.uuid4())
    key = f"items/{tg_id}/{item_id}.png"
    s3.upload_fileobj(
        out_bytes,
        S3_BUCKET,
        key,
        ExtraArgs={"ContentType": "image/png"}
    )
    image_url = f"{S3_PUBLIC_DOMAIN}/{key}"

    # 3. Сохранение записи в PostgreSQL
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO items (id, user_id, category, color, brand, name, image_url, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (item_id, tg_id, category, color, brand, name, image_url, datetime.utcnow())
        )
        saved_item = cur.fetchone()
        db.commit()

    return saved_item

@app.delete("/items/{item_id}")
def delete_item(item_id: str, user: dict = Depends(validate_telegram_init_data), db=Depends(get_db)):
    tg_id = str(user.get("id"))
    with db.cursor() as cur:
        cur.execute("DELETE FROM items WHERE id = %s AND user_id = %s", (item_id, tg_id))
        db.commit()
    return {"status": "ok"}

class SaveLookRequest(BaseModel):
    name: str
    layers: List[dict]
    previewUrl: Optional[str] = None

@app.get("/looks")
def list_looks(user: dict = Depends(validate_telegram_init_data), db=Depends(get_db)):
    tg_id = str(user.get("id"))
    with db.cursor() as cur:
        cur.execute("SELECT * FROM looks WHERE user_id = %s ORDER BY created_at DESC", (tg_id,))
        rows = cur.fetchall()
    return rows

@app.post("/looks")
def save_look(body: SaveLookRequest, user: dict = Depends(validate_telegram_init_data), db=Depends(get_db)):
    tg_id = str(user.get("id"))
    look_id = str(uuid.uuid4())

    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO looks (id, user_id, name, layers, preview_url, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (look_id, tg_id, body.name, json.dumps(body.layers), body.previewUrl, datetime.utcnow())
        )
        saved_look = cur.fetchone()
        db.commit()

    return saved_look