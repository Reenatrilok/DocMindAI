from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pypdf import PdfReader
from fastapi.staticfiles import StaticFiles

import os

# Gemini
import google.generativeai as genai
from dotenv import load_dotenv

# -----------------------------
# FastAPI Setup
# -----------------------------

app = FastAPI()
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

templates = Jinja2Templates(directory="templates")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

latest_text = ""

# -----------------------------
# Load Gemini API Key
# -----------------------------

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    "gemini-2.0-flash"
)


# -----------------------------
# Home Page
# -----------------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )

# -----------------------------
# Upload PDF
# -----------------------------

@app.post("/upload", response_class=HTMLResponse)
async def upload_pdf(
    request: Request,
    file: UploadFile = File(...)
):

    global latest_text

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as f:
        f.write(await file.read())

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    latest_text = text

    return templates.TemplateResponse(
        request=request,
        name="result.html",
        context={
            "filename": file.filename,
            "text": text[:5000]
        }
    )

# -----------------------------
# Gemini Summary
# -----------------------------

@app.post("/summary")
async def generate_summary():

    global latest_text

    if not latest_text:

        return JSONResponse(
            content={
                "summary": "No PDF uploaded."
            }
        )

    try:

        prompt = f"""
        Summarize the following document.

        Give:

        1. Main Topic
        2. Important Points
        3. Key Conclusions

        Document:

        {latest_text[:15000]}
        """

        response = model.generate_content(
            prompt
        )

        return JSONResponse(
            content={
                "summary": response.text
            }
        )

    except Exception as e:

        return JSONResponse(
            content={
                "summary": f"Error: {str(e)}"
            }
        )