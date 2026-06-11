from fastapi import FastAPI, UploadFile, File, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pypdf import PdfReader
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pypdf import PdfWriter
from fastapi.responses import FileResponse
import uuid
from pypdf import PdfReader, PdfWriter
import zipfile

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
    
@app.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):

    if len(files) < 2:
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload at least 2 PDF files."}
        )

    if len(files) > 10:
        return JSONResponse(
            status_code=400,
            content={"error": "Maximum 10 files allowed at once."}
        )

    try:
        writer = PdfWriter()
        saved_paths = []

        for file in files:
            if not file.filename.endswith(".pdf"):
                return JSONResponse(
                    status_code=400,
                    content={"error": f"{file.filename} is not a PDF."}
                )

            file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{file.filename}")
            with open(file_path, "wb") as f:
                f.write(await file.read())
            saved_paths.append(file_path)

            reader = PdfReader(file_path)
            for page in reader.pages:
                writer.add_page(page)

        # Save merged PDF
        merged_path = os.path.join(UPLOAD_FOLDER, f"merged_{uuid.uuid4()}.pdf")
        with open(merged_path, "wb") as f:
            writer.write(f)

        # Clean up individual files
        for path in saved_paths:
            os.remove(path)

        return FileResponse(
            path=merged_path,
            filename="merged.pdf",
            media_type="application/pdf",
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Merge failed: {str(e)}"}
        )
@app.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    pages: str = Form(None)
):
    if not file.filename.endswith(".pdf"):
        return JSONResponse(
            status_code=400,
            content={"error": "Only PDF files are supported."}
        )

    file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        reader = PdfReader(file_path)
        total_pages = len(reader.pages)

        if total_pages < 2:
            return JSONResponse(
                status_code=400,
                content={"error": "PDF must have at least 2 pages to split."}
            )

        # Parse page ranges if provided, else split every page
        if pages:
            try:
                page_nums = []
                for part in pages.split(","):
                    part = part.strip()
                    if "-" in part:
                        start, end = part.split("-")
                        page_nums.extend(range(int(start) - 1, int(end)))
                    else:
                        page_nums.append(int(part) - 1)
                page_nums = [p for p in page_nums if 0 <= p < total_pages]
            except:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid page range format. Use: 1,2,3 or 1-3,5"}
                )
        else:
            page_nums = list(range(total_pages))

        # Create a zip of all split pages
        zip_path = os.path.join(UPLOAD_FOLDER, f"split_{uuid.uuid4()}.zip")

        with zipfile.ZipFile(zip_path, "w") as zf:
            for i, page_num in enumerate(page_nums):
                writer = PdfWriter()
                writer.add_page(reader.pages[page_num])

                page_path = os.path.join(
                    UPLOAD_FOLDER,
                    f"page_{page_num + 1}_{uuid.uuid4()}.pdf"
                )
                with open(page_path, "wb") as pf:
                    writer.write(pf)

                zf.write(page_path, f"page_{page_num + 1}.pdf")
                os.remove(page_path)

        os.remove(file_path)

        return FileResponse(
            path=zip_path,
            filename="split_pages.zip",
            media_type="application/zip",
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Split failed: {str(e)}"}
        )

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "gemini": "available" if gemini_available else "unavailable — check GEMINI_API_KEY"
    }
