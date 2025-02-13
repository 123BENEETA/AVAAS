from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from TTS.api import TTS
import numpy as np
import soundfile as sf
import io
import asyncio
import logging
from typing import Optional
from starlette.websockets import WebSocketDisconnect
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSManager:
    def __init__(self):
        self.tts: Optional[TTS] = None
        self.init_lock = asyncio.Lock()
        self.initialized = False

    async def initialize_tts(self):
        if self.initialized:
            return
        
        async with self.init_lock:
            if self.initialized:
                return
                
            try:
                logger.info("Loading TTS model...")
                self.tts = TTS(
                    model_name="tts_models/en/ljspeech/vits",
                    progress_bar=False,
                    gpu=False
                )
                self.initialized = True
                logger.info("TTS model loaded successfully!")
            except Exception as e:
                logger.error(f"Failed to initialize TTS: {e}")
                self.initialized = False
                raise HTTPException(status_code=500, detail=f"TTS initialization failed: {str(e)}")

    async def generate_speech(self, text: str) -> bytes:
        if not self.initialized:
            await self.initialize_tts()
            
        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty text provided")
            
        try:
            wav = self.tts.tts(text)
            wav_bytes = io.BytesIO()
            sf.write(wav_bytes, wav, samplerate=22050, format='WAV')
            wav_bytes.seek(0)
            return wav_bytes.read()
        except Exception as e:
            logger.error(f"Speech generation error: {e}")
            raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")

@asynccontextmanager
async def websocket_manager(websocket: WebSocket):
    try:
        await websocket.accept()
        yield websocket
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Initialize TTSManager
tts_manager = TTSManager()

@app.on_event("startup")
async def startup_event():
    await tts_manager.initialize_tts()

@app.websocket("/tts")
async def tts_stream(websocket: WebSocket):
    async with websocket_manager(websocket):
        try:
            while True:
                text = await websocket.receive_text()
                if not text:
                    continue
                    
                logger.info(f"Received text: {text[:50]}...")
                wav_data = await tts_manager.generate_speech(text)
                
                # Send audio data in chunks
                chunk_size = 32768  # Increased chunk size for better performance
                for i in range(0, len(wav_data), chunk_size):
                    chunk = wav_data[i:i + chunk_size]
                    await websocket.send_bytes(chunk)
                    await asyncio.sleep(0.01)  # Prevent flooding
                
                await websocket.send_text("END")
                logger.info("Audio streaming completed")
                
        except WebSocketDisconnect:
            logger.info("Client disconnected normally")
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {e}")
            try:
                await websocket.send_text(f"ERROR: {str(e)}")
            except:
                pass

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": tts_manager.tts is not None,
        "phonemizer": "g2p_en"
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting TTS server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")