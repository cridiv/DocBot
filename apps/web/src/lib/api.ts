const BASE_URL = "http://localhost:8000";

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
}

export interface UploadResponse {
  session_id: string;
  files: FileInfo[];
}

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
}

export interface UploadResponse {
  session_id: string;
  files: FileInfo[];
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data;
}

export async function uploadMultipleFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  const res = await fetch(`${BASE_URL}/upload-multiple`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Multiple file upload failed");
  }

  const data = await res.json();
  return data;
}

export async function addFileToSession(sessionId: string, file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/add-file/${sessionId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Adding file to session failed");
  }

  const data = await res.json();
  return data;
}

export async function getSessionInfo(sessionId: string): Promise<UploadResponse> {
  const res = await fetch(`${BASE_URL}/session/${sessionId}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to get session info");
  }

  const data = await res.json();
  return data;
}

export async function sendQuestion(sessionId: string, question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat?session_id=${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error("Question failed");
  }

  const data = await res.json();
  return data.answer;
}
