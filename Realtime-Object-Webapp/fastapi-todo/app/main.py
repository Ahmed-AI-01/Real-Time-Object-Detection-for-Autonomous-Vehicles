import torch
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from ultralytics import YOLO
import io
from PIL import Image
import time
from starlette.responses import StreamingResponse
from collections import defaultdict
import statistics
import os
import shutil

# FastAPI app initialization
app = FastAPI()

# Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for detection settings
CONFIDENCE_THRESHOLD = 0.5
SELECTED_CLASSES = set()  # Empty set means detect all classes
detection_stats = defaultdict(int)

# Processing statistics
process_times = []
last_fps_update = time.time()
fps = 0
frame_count = 0

# Path to your trained YOLO model
model_path = r"C:\Users\moustafa\Downloads\best (5).pt"

# Load YOLO model
model = YOLO(model_path)

# Open the video file
video_path = r"C:\Users\moustafa\Downloads\2103099-uhd_3840_2160_30fps.mp4"
cap = cv2.VideoCapture(video_path)

# Check if the video opened successfully
if not cap.isOpened():
    print("Error: Couldn't open video.")
    exit()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ConfidenceUpdate(BaseModel):
    confidence: float

class ClassesUpdate(BaseModel):
    classes: List[int]

@app.on_event("shutdown")
def cleanup():
    cap.release()

@app.post("/update-confidence")
async def update_confidence(update: ConfidenceUpdate):
    global CONFIDENCE_THRESHOLD
    CONFIDENCE_THRESHOLD = update.confidence
    return {"status": "success", "confidence": CONFIDENCE_THRESHOLD}

@app.post("/update-classes")
async def update_classes(update: ClassesUpdate):
    global SELECTED_CLASSES
    SELECTED_CLASSES = set(update.classes)
    return {"status": "success", "classes": list(SELECTED_CLASSES)}

@app.get("/detection-stats")
async def get_detection_stats():
    return dict(detection_stats)

@app.get("/processing-stats")
async def get_processing_stats():
    global fps, process_times
    # Calculate average process time from the last 30 frames
    avg_process_time = statistics.mean(process_times[-30:]) if process_times else 0
    return {
        "fps": fps,
        "processTime": round(avg_process_time, 2),
        "totalDetections": sum(detection_stats.values())
    }

@app.get("/video")
async def video_feed():
    def generate():
        global fps, frame_count, last_fps_update, process_times
        
        while True:
            start_time = time.time()
            
            ret, frame = cap.read()
            if not ret:
                # Reset video to beginning when it ends
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Resize frame for better performance
            frame = cv2.resize(frame, (1280, 720))

            # Convert frame to RGB for YOLO
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Perform inference
            results = model(img)

            # Reset detection stats for this frame
            frame_stats = defaultdict(int)

            # Extract predictions
            predictions = results[0].boxes.xywh.cpu().numpy()
            scores = results[0].boxes.conf.cpu().numpy()
            class_ids = results[0].boxes.cls.cpu().numpy()

            # Draw bounding boxes
            for box, score, class_id in zip(predictions, scores, class_ids):
                class_id = int(class_id)
                
                # Skip if class is not in selected classes (if any are selected)
                if SELECTED_CLASSES and class_id not in SELECTED_CLASSES:
                    continue
                
                # Skip if confidence is below threshold
                if score < CONFIDENCE_THRESHOLD:
                    continue

                # Update detection stats
                frame_stats[class_id] += 1

                x, y, w, h = map(int, box)
                x1, y1, x2, y2 = x - w//2, y - h//2, x + w//2, y + h//2
                
                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Draw label with class name and confidence
                label = f'{model.names[class_id]} {score:.2f}'
                cv2.putText(frame, label, (x1, y1 - 10), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # Update global detection stats
            detection_stats.clear()
            detection_stats.update(frame_stats)

            # Calculate processing time
            process_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            process_times.append(process_time)
            if len(process_times) > 30:  # Keep only last 30 frames
                process_times.pop(0)

            # Update FPS
            frame_count += 1
            current_time = time.time()
            if current_time - last_fps_update >= 1.0:
                fps = frame_count
                frame_count = 0
                last_fps_update = current_time

            # Convert frame to PIL Image
            frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

            # Convert to bytes
            img_byte_arr = io.BytesIO()
            frame_pil.save(img_byte_arr, format='JPEG', quality=85)
            img_byte_arr.seek(0)

            # Yield multipart frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + img_byte_arr.getvalue() + b'\r\n')

            # Maintain target FPS
            elapsed = (time.time() - start_time) * 1000
            if elapsed < 33.33:  # Target 30 FPS
                time.sleep((33.33 - elapsed) / 1000)

    return StreamingResponse(
        content=generate(),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Optionally, set this as the new video for detection
    global cap
    if cap is not None:
        cap.release()
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open uploaded video file")
    return {"status": "success", "filename": file.filename}