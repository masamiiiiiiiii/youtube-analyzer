from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class S3VideoURL(BaseModel):
    s3Url: str

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/analyze-s3")
async def analyze_s3_video(video_url: S3VideoURL):
    logger.info(f"Received S3 URL for analysis: {video_url.s3Url}")
    # ここにS3から動画をダウンロードし、分析ジョブをトリガーするロジックを追加します。
    # 現時点では、S3 URLを受け取ったことを確認するメッセージを返します。
    return {"message": "S3 URL received for analysis", "s3Url": video_url.s3Url}
