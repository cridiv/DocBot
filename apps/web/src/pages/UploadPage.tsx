import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, X, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { uploadMultipleFiles } from '../lib/api';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const DocBotUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allowedTypes = ['.pdf', '.txt', '.docx'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 5; // Maximum number of files

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(extension) && file.size <= maxSize;
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(validateFile);
    const remainingSlots = maxFiles - uploadedFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length !== newFiles.length) {
      alert("Some files were skipped: Please upload valid files (.pdf, .txt, .docx) under 10MB");
    }

    if (filesToAdd.length !== validFiles.length) {
      alert(`Maximum ${maxFiles} files allowed. Only ${filesToAdd.length} files were added.`);
    }

    const uploadedFileObjects: UploadedFile[] = filesToAdd.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    setUploadedFiles(prev => [...prev, ...uploadedFileObjects]);
  };

const handleUpload = async () => {
  if (uploadedFiles.length === 0) return;

  setIsUploading(true);
  setUploadProgress(0);

  try {
    const files = uploadedFiles.map(f => f.file);
    const response = await uploadMultipleFiles(files);
    
    localStorage.setItem("docbot_session", response.session_id);
    localStorage.setItem("docbot_files", JSON.stringify(response.files));

    setShowSuccess(true);
  } catch (err) {
    console.error(err);
    alert("Failed to upload files.");
  } finally {
    setIsUploading(false);
    setUploadProgress(100);
  }
};

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setShowSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-violet-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-violet-500 rounded-full animate-pulse delay-2000"></div>
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <line x1="25%" y1="25%" x2="75%" y2="33%" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.4" />
          <line x1="33%" y1="66%" x2="66%" y2="75%" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.4" />
          <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.4" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            DocBot
          </h1>
          <p className="text-gray-400 text-lg">Upload files to chat with them.</p>
        </div>

        {/* Upload Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragging 
                ? 'border-violet-400 bg-violet-400/10 scale-105' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            {uploadedFiles.length === 0 && !isUploading && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <File className="w-16 h-16 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-300 mb-2">
                    Drag and drop your files here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse (max {maxFiles} files)
                  </p>
                  <button
                    onClick={openFileDialog}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Files
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports: {allowedTypes.join(', ')} (Max 10MB each)
                </p>
              </div>
            )}

            {uploadedFiles.length > 0 && !isUploading && !showSuccess && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <File className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-300 mb-4">{uploadedFiles.length} file(s) selected</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-3 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <File className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-gray-200 font-medium text-sm">{file.name}</p>
                              <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {uploadedFiles.length < maxFiles && (
                    <button
                      onClick={openFileDialog}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add More Files
                    </button>
                  )}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className="text-gray-300 mb-4">Uploading {uploadedFiles.length} file(s)...</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && showSuccess && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <p className="text-green-400 font-medium mb-2">Upload Complete!</p>
                  <p className="text-gray-300 mb-3">{uploadedFiles.length} file(s) uploaded successfully</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-3 text-left">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-gray-200 font-medium text-sm">{file.name}</p>
                            <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload and Continue Buttons */}
          <div className="mt-8 space-y-3">
            {uploadedFiles.length > 0 && !showSuccess && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-200 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 transform hover:scale-105 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}`}
              </button>
            )}
            
            <button
              disabled={!showSuccess}
              onClick={() => navigate("/chat")}
              className={`
                w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-200
                ${showSuccess 
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105 shadow-lg shadow-green-500/25' 
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
                }
              `}
            >
              Continue to Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocBotUpload;