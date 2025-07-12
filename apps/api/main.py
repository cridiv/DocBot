import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from qa_chain import process_document, ask_question

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_data = {}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a document and process it for question answering."""
    contents = await file.read()

    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(contents)

    session_data["chain"] = process_document(file_path)

    return {"message": "Document uploaded and processed."}


@app.post("/chat")
async def chat_with_doc(question: str = Form(...)):
    """Accept user query and return AI-generated answer."""
    chain = session_data.get("chain")
    if not chain:
        return {"error": "Upload a document first."}

    response = ask_question(chain, question)
    return {"answer": response}
