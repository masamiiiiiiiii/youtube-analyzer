from fastapi import FastAPI
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/api/hello")
def hello():
    logger.info("Hello endpoint called.")
    return {"message": "Hello from FastAPI!"}