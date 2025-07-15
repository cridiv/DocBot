# qa_chain.py
import os
from dotenv import load_dotenv

from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, OpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

VECTORSTORE_DIR = "vectorstores"
os.makedirs(VECTORSTORE_DIR, exist_ok=True)

def save_vectorstore(session_id: str, file_paths: list[str]):
    """Loads, chunks, embeds and saves a vectorstore to disk under a session"""
    all_docs = []

    for path in file_paths:
        loader = TextLoader(path, encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata['source_file'] = path
        all_docs.extend(docs)

    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    chunks = splitter.split_documents(all_docs)

    vectorstore = FAISS.from_documents(chunks, embeddings)

    save_path = os.path.join(VECTORSTORE_DIR, session_id)
    vectorstore.save_local(save_path)
    print(f"✅ Vectorstore saved to: {save_path}")

def load_vectorstore(session_id: str):
    """Loads a saved vectorstore and returns a QA chain with memory"""
    path = os.path.join(VECTORSTORE_DIR, session_id)
    if not os.path.exists(path):
        raise FileNotFoundError(f"No vectorstore found at {path}")

    vectorstore = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=OpenAI(openai_api_key=openai_api_key),
        retriever=vectorstore.as_retriever(),
        memory=memory,
        return_source_documents=True
    )

    return qa_chain

def process_document(file_path: str):
    """Process a single document and return a QA chain"""
    # For single document, we'll use the save/load pattern too
    import uuid
    temp_session_id = str(uuid.uuid4())
    save_vectorstore(temp_session_id, [file_path])
    return load_vectorstore(temp_session_id)

def process_documents(file_paths: list[str]):
    """Process multiple documents and return a QA chain"""
    # For multiple documents, we'll create a temporary session
    import uuid
    temp_session_id = str(uuid.uuid4())
    save_vectorstore(temp_session_id, file_paths)
    return load_vectorstore(temp_session_id)

def ask_question(chain, question: str):
    """Ask a question using the QA chain"""
    result = chain.invoke({"question": question})
    return result["answer"]
