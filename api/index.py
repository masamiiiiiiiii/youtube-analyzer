from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import os
import json
from google.cloud import storage
from datetime import timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class SignedURLRequest(BaseModel):
    filename: str
    contentType: str

class GCSVideoURL(BaseModel):
    gcsUrl: str

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/get-gcs-signed-url")
async def get_gcs_signed_url(request: SignedURLRequest):
    bucket_name = os.environ.get('GCS_BUCKET_NAME')
    if not bucket_name:
        raise HTTPException(status_code=500, detail="GCS bucket name is not configured.")

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(f"uploads/{request.filename}")

    # 署名付きURLを生成
    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),  # URLの有効期限
        method="PUT",
        content_type=request.contentType
    )
    gcs_file_url = f"gs://{bucket_name}/uploads/{request.filename}"

    return {"signedUrl": signed_url, "gcsFileUrl": gcs_file_url}

@app.post("/api/analyze-gcs")
async def analyze_gcs_video(video_url: GCSVideoURL):
    logger.info(f"Received GCS URL for analysis: {video_url.gcsUrl}")
    # ここにCloud Run サービスをトリガーするロジックを追加します。
    # 現時点では、GCS URLを受け取ったことを確認するメッセージを返します。
    return {"message": "GCS URL received for analysis", "gcsUrl": video_url.gcsUrl}
