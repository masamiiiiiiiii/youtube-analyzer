from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import boto3
import os
import json

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

    # Lambdaクライアントを初期化
    lambda_client = boto3.client(
        'lambda',
        region_name=os.environ.get('AWS_REGION'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )

    lambda_function_name = os.environ.get('LAMBDA_FUNCTION_NAME', 'video-analyzer-lambda')

    try:
        # Lambda関数を非同期で呼び出す
        response = lambda_client.invoke(
            FunctionName=lambda_function_name,
            InvocationType='Event', # 非同期呼び出し
            Payload=json.dumps({'s3Url': video_url.s3Url})
        )
        logger.info(f"Lambda invocation response: {response}")
        return {"message": "Analysis job triggered successfully", "s3Url": video_url.s3Url}
    except Exception as e:
        logger.error(f"Error invoking Lambda function: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to trigger analysis job: {e}")