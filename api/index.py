from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import os
import json
import requests
from google.auth.transport.requests import Request
from google.oauth2 import id_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS設定を追加
origins = [
    "http://localhost:3000", # Next.jsのデフォルトポート
    "http://localhost:8000", # FastAPIのデフォルトポート
    "https://youtube-analyzer-*.vercel.app", # Vercelデプロイのドメインパターン
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class S3VideoURL(BaseModel):
    s3Url: str

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/analyze-s3")
async def analyze_s3_video(video_url: S3VideoURL):
    logger.info(f"Received S3 URL for analysis: {video_url.s3Url}")

    # Cloud Run サービスのURLとサービスアカウントのメールアドレスを環境変数から取得
    cloud_run_service_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
    service_account_email = os.environ.get('GCP_SERVICE_ACCOUNT_EMAIL')

    if not cloud_run_service_url or not service_account_email:
        raise HTTPException(status_code=500, detail="Cloud Run service URL or service account email not configured.")

    try:
        # IDトークンを取得して認証ヘッダーを作成
        auth_req = Request()
        id_token_jwt = id_token.fetch_id_token(auth_req, cloud_run_service_url)

        headers = {
            'Authorization': f'Bearer {id_token_jwt}',
            'Content-Type': 'application/json'
        }

        # Cloud Run サービスにリクエストを送信
        response = requests.post(
            cloud_run_service_url + "/analyze-video", # Cloud Run サービス内のエンドポイント
            headers=headers,
            data=json.dumps({'s3Url': video_url.s3Url})
        )
        response.raise_for_status() # HTTPエラーが発生した場合に例外を発生させる

        logger.info(f"Cloud Run invocation response: {response.json()}")
        return {"message": "Analysis job triggered successfully", "s3Url": video_url.s3Url}
    except Exception as e:
        logger.error(f"Error invoking Cloud Run service: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to trigger analysis job: {e}")