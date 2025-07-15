# main.py
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Form
from pydantic import BaseModel
import uuid
import os
from qa_chain import process_document, process_documents, ask_question
from chain_store import chain_store

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = {}

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatRequest(BaseModel):
    question: str

class UploadResponse(BaseModel):
    session_id: str
    files: list[dict]

@app.get("/")
def home():
    return {"message": "DocBot API running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    file_info = {
        "id": file_id,
        "name": file.filename,
        "path": file_path,
        "size": os.path.getsize(file_path)
    }

    chain = process_document(file_path)
    sessions[file_id] = {
        "chain": chain,
        "files": [file_info]
    }

    return {
        "session_id": file_id,
        "files": [file_info]
    }


@app.post("/upload-multiple")
async def upload_multiple_files(files: list[UploadFile] = File(...)):
    session_id = str(uuid.uuid4())
    file_paths = []
    file_infos = []

    for file in files:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

        with open(file_path, "wb") as f:
            f.write(await file.read())

        file_info = {
            "id": file_id,
            "name": file.filename,
            "path": file_path,
            "size": os.path.getsize(file_path)
        }

        file_paths.append(file_path)
        file_infos.append(file_info)

    # Create a single chain from all documents
    chain = process_documents(file_paths)
    sessions[session_id] = {
        "chain": chain,
        "files": file_infos
    }

    return {
        "session_id": session_id,
        "files": file_infos
    }


@app.post("/add-file/{session_id}")
async def add_file_to_session(session_id: str, file: UploadFile = File(...)):
    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "Session not found."})

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    file_info = {
        "id": file_id,
        "name": file.filename,
        "path": file_path,
        "size": os.path.getsize(file_path)
    }

    # Get existing files and add the new one
    existing_files = sessions[session_id]["files"]
    existing_files.append(file_info)

    # Recreate the chain with all files
    all_file_paths = [f["path"] for f in existing_files]
    new_chain = process_documents(all_file_paths)

    sessions[session_id] = {
        "chain": new_chain,
        "files": existing_files
    }

    return {
        "session_id": session_id,
        "files": existing_files
    }


@app.post("/chat")
async def chat(chat_request: ChatRequest, session_id: str = Query(...)):
    # Check if session exists
    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "Session not found."})

    # Get the chain from sessions
    qa_chain = sessions[session_id]["chain"]
    answer = ask_question(qa_chain, chat_request.question)
    return { "answer": answer }


@app.get("/session/{session_id}")
async def get_session_info(session_id: str):
    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "Session not found."})
    
    return {
        "session_id": session_id,
        "files": sessions[session_id]["files"]
    }
