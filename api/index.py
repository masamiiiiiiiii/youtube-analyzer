from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import shutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class VideoURL(BaseModel):
    url: str

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/analyze")
def analyze_video(video_url: VideoURL):
    video_id = str(uuid.uuid4())
    audio_path = f"/tmp/{video_id}.mp3"

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': audio_path,
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url.url])
        
        # For now, just return the path. Later, we'll process this audio.
        return {"message": "Audio extracted successfully", "audio_path": audio_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract audio: {e}")
    finally:
        # Clean up the audio file after processing (or after this test phase)
        if os.path.exists(audio_path):
            os.remove(audio_path)

@app.post("/api/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    logger.info("File upload started.")
    try:
        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        logger.info(f"File uploaded successfully: {file.filename}")
    except Exception as e:
        logger.error(f"Error during file upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")
    finally:
        file.file.close()
        logger.info("File upload process finished.")

    return {"message": "File uploaded successfully", "filename": file.filename, "file_location": file_location}