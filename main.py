from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pypdf import PdfReader
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import google.generativeai as genai
from dotenv import load_dotenv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

latest_text = ""

# Load Gemini safely — won't crash if key is missing
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    gemini_available = True
    print("✅ Gemini API loaded")
else:
    gemini_available = False
    print("⚠️  GEMINI_API_KEY not found — AI summary will be disabled")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global latest_text

    if not file.filename.endswith(".pdf"):
        return JSONResponse(
            status_code=400,
            content={"error": "Only PDF files are supported."}
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        reader = PdfReader(file_path)
        text = ""

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        if not text.strip():
            return JSONResponse(
                status_code=200,
                content={
                    "filename": file.filename,
                    "text": "",
                    "warning": "No text could be extracted. This PDF may be a scanned image."
                }
            )

        latest_text = text

        return JSONResponse(
            status_code=200,
            content={
                "filename": file.filename,
                "text": text[:5000],
                "total_chars": len(text),
                "pages": len(reader.pages),
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process PDF: {str(e)}"}
        )


@app.post("/summary")
async def generate_summary():
    global latest_text

    if not latest_text:
        return JSONResponse(
            status_code=400,
            content={"error": "No PDF uploaded yet. Please upload a PDF first."}
        )

    if not gemini_available:
        return JSONResponse(
            status_code=503,
            content={"error": "Gemini API key not configured. Add GEMINI_API_KEY to your .env file."}
        )

    try:
        prompt = f"""
Summarize the following document clearly and concisely.

Give:
1. Main Topic
2. Important Points (bullet points)
3. Key Conclusions

Document:
{latest_text[:15000]}
"""
        response = model.generate_content(prompt)

        return JSONResponse(
            status_code=200,
            content={"summary": response.text}
        )

    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            return JSONResponse(
                status_code=429,
                content={"error": "Gemini API quota exceeded. Please check your plan or try again later."}
            )
        return JSONResponse(
            status_code=500,
            content={"error": f"Summary failed: {error_msg}"}
        )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "gemini": "available" if gemini_available else "unavailable — check GEMINI_API_KEY"
    }