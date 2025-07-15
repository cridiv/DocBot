import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Upload, 
  FileText, 
  MessageSquare,
  Bot,
  User,
  Clock,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { sendQuestion } from '../lib/api';


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sourceSnippets?: Array<{
    text: string;
    page: number;
    confidence: number;
  }>;
}

interface ChatSession {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
}

const DocBotChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'preview'>('history');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<Array<{name: string; pages?: number; size?: string}>>([]);  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const uploadedFilesData = localStorage.getItem("docbot_files");
    if (uploadedFilesData) {
      try {
        const filesInfo = JSON.parse(uploadedFilesData);
        setCurrentFiles(filesInfo.map((file: any) => ({
          name: file.original_name,
          pages: undefined,
          size: undefined
        })));
      } catch (error) {
        console.error("Error parsing files data:", error);
        // Fallback to single file for backward compatibility
        const uploadedFileName = localStorage.getItem("docbot_filename");
        if (uploadedFileName) {
          setCurrentFiles([{
            name: uploadedFileName,
            pages: undefined,
            size: undefined
          }]);
        } else {
          window.location.href = '/';
        }
      }
    } else {
      // Fallback - redirect to upload if no files
      window.location.href = '/';
    }
  }, []);

  const chatSessions: ChatSession[] = [];

  const fetchAnswerFromBackend = async (question: string): Promise<Message> => {
    const sessionId = localStorage.getItem("docbot_session");

    if (!sessionId) {
      throw new Error("Session ID not found.");
    }

    const answer = await sendQuestion(sessionId, question);

    return {
      id: Date.now().toString() + "-bot",
      content: answer,
      sender: "bot",
      timestamp: new Date()
    };
  };

const handleSend = async () => {
  if (!inputText.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputText,
    sender: 'user',
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsTyping(true);

  try {
    const botMessage = await fetchAnswerFromBackend(userMessage.content);
    setMessages(prev => [...prev, botMessage]);
  } catch (err) {
    console.error(err);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString() + "-error",
        content: "⚠️ Failed to get response. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      }
    ]);
  } finally {
    setIsTyping(false);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Left Sidebar */}
      <div className={`bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 ${isLeftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">DocBot</h2>
            <button
              onClick={() => setIsLeftPanelOpen(false)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="flex rounded-lg bg-gray-700/30 p-1">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'history' && (
            <div className="p-4 space-y-3">
              {chatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No chat history yet</p>
                  <p className="text-xs text-gray-500 mt-1">Start a conversation to see it here</p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{session.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(session.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-4">
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-gray-300">Uploaded Documents</h4>
                {currentFiles.length === 0 ? (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Loading documents...</p>
                  </div>
                ) : (
                  currentFiles.map((file, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-200">{file.name}</p>
                          <p className="text-xs text-gray-400">Document {index + 1} of {currentFiles.length}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Ask About</h4>
                <div className="space-y-1">
                  {['Content Summary', 'Key Points', 'Specific Details', 'Comparisons', 'Analysis'].map((suggestion) => (
                    <div key={suggestion} className="p-2 bg-gray-700/20 hover:bg-gray-700/40 rounded cursor-pointer transition-colors">
                      <p className="text-sm text-gray-300">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            {!isLeftPanelOpen && (
              <button
                onClick={() => setIsLeftPanelOpen(true)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-semibold text-white">
                {currentFiles.length === 0 ? 'Loading...' : 
                 currentFiles.length === 1 ? currentFiles[0].name :
                 `${currentFiles.length} Documents`}
              </h1>
              <p className="text-sm text-gray-400">
                {currentFiles.length === 0 ? 'Loading documents...' :
                 currentFiles.length === 1 ? 'Document' :
                 `${currentFiles.length} documents uploaded`}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-2">Ask me anything about your documents…</p>
                <p className="text-gray-500">I'll help you understand and explore the content across all your files</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-2xl ${message.sender === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-200 backdrop-blur-xl shadow-lg shadow-violet-500/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {message.sourceSnippets && message.sourceSnippets.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-400 font-medium">Sources:</p>
                        {message.sourceSnippets.map((snippet, index) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-700/30 rounded-lg border-l-2 border-violet-500/50 cursor-pointer hover:bg-gray-700/50 transition-colors"
                          >
                            <p className="text-xs text-gray-300">{snippet.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Page {snippet.page}</span>
                              <span className="text-xs text-violet-400">
                                {Math.round(snippet.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800/50 backdrop-blur-xl px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800/50 backdrop-blur-xl border-t border-gray-700/50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your documents..."
                className="w-full bg-gray-700/50 text-gray-200 placeholder-gray-400 rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-gray-700/70 transition-all duration-200"
                rows={1}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                disabled
                className="p-3 bg-gray-700/30 text-gray-500 rounded-xl cursor-not-allowed"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <button
                disabled
                className="p-3 bg-gray-700/30 text-gray-500 rounded-xl cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  inputText.trim()
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white transform hover:scale-105'
                    : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocBotChat;