from fastapi import FastAPI, UploadFile
from pypdf import PdfReader

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Quiz Generator API running"}