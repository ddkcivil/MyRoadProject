
import React, { useState, useRef, useEffect } from 'react';
import { X, Bot, Send, Paperclip, Zap, Image as ImageIcon, Video, Loader2, Sparkles, FileText } from 'lucide-react';
import { chatWithGemini, ChatMessage } from '../services/geminiService';
import { Project } from '../types';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Avatar, 
  Switch, 
  FormControlLabel, 
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';

interface Props {
  project: Project;
  onClose: () => void;
}

const AIChatModal: React.FC<Props> = ({ project, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{
    file: File;
    preview: string;
    type: 'image' | 'video' | 'pdf';
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{
            role: 'model',
            text: `Hello! I'm your AI assistant for project **${project.code}**. \n\nYou can:
• Upload **RFI PDFs** to extract details (Status, Location, Date).
• Upload Site Photos/Videos for progress analysis.
• Ask about the project schedule or BOQ status.`
        }]);
    }
  }, [project.code]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';
      const preview = URL.createObjectURL(file);
      
      setAttachment({
        file,
        preview,
        type: isVideo ? 'video' : isPdf ? 'pdf' : 'image'
      });
    }
  };

  const clearAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
      setAttachment(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const userText = input.trim();
    
    // 1. Prepare User Message for UI
    const newUserMsg: ChatMessage = {
      role: 'user',
      text: userText,
      attachment: attachment ? {
          mimeType: attachment.file.type,
          data: attachment.preview, // Use preview URL for UI
          type: attachment.type
      } : undefined
    };

    // Update UI immediately
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    // 2. Prepare Data for API
    let base64Data = '';
    if (attachment) {
        try {
            base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    // Remove data url prefix (e.g. "data:image/png;base64,")
                    resolve(base64String.split(',')[1]);
                };
                reader.readAsDataURL(attachment.file);
            });
        } catch (err) {
            console.error("File read error", err);
        }
    }

    // 3. Call AI Service
    const responseText = await chatWithGemini(
        userText,
        messages, // Send previous history
        project,
        attachment ? { mimeType: attachment.file.type, data: base64Data } : undefined,
        isFastMode
    );

    // 4. Update UI with AI Response
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
    clearAttachment();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-3 px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Bot size={24} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">RoadMaster AI</h3>
                <div className="text-xs text-indigo-200 flex items-center gap-1">
                    Powered by Gemini {isFastMode ? 'Flash Lite' : '3.0 Pro'}
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              <FormControlLabel
                control={
                    <Switch 
                        size="small" 
                        checked={isFastMode} 
                        onChange={(e) => setIsFastMode(e.target.checked)} 
                        color="warning"
                        sx={{ 
                            '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.5)' } 
                        }}
                    />
                }
                label={
                    <span className="text-xs font-medium text-white flex items-center gap-1">
                        <Zap size={12} className={isFastMode ? "text-yellow-300 fill-yellow-300" : ""} />
                        Fast Mode
                    </span>
                }
              />
              <IconButton onClick={onClose} size="medium" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}>
                <X size={20} />
              </IconButton>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white'}`}>
                            {msg.role === 'user' ? (
                                <span className="text-xs font-bold text-indigo-700">ME</span>
                            ) : (
                                <Sparkles size={16} className="text-indigo-600" />
                            )}
                        </div>

                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                        }`}>
                            {/* Attachment Preview in Message */}
                            {msg.attachment && (
                                <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                                    {msg.attachment.type === 'video' ? (
                                        <div className="bg-black/20 flex items-center justify-center h-32 w-48">
                                            <Video size={32} className="opacity-80"/>
                                            <span className="ml-2 text-xs">Video Attached</span>
                                        </div>
                                    ) : msg.attachment.type === 'pdf' ? (
                                        <div className="bg-white/20 p-3 rounded-lg flex items-center gap-3">
                                            <div className="bg-red-100 p-2 rounded">
                                                <FileText size={24} className="text-red-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white/90">PDF Document</span>
                                                <span className="text-[10px] text-white/70">Attached for analysis</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={msg.attachment.data} alt="Upload" className="max-w-xs max-h-48 object-cover" />
                                    )}
                                </div>
                            )}
                            
                            <div className="whitespace-pre-wrap font-sans">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                            <Bot size={16} className="text-indigo-600" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-xs text-slate-500 font-medium">Analyzing document...</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            {/* Attachment Preview Area */}
            {attachment && (
                <div className="mb-3 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 w-fit animate-in slide-in-from-bottom-2">
                    <div className="w-12 h-12 bg-slate-200 rounded overflow-hidden flex items-center justify-center relative">
                        {attachment.type === 'image' ? (
                            <img src={attachment.preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : attachment.type === 'pdf' ? (
                            <FileText size={24} className="text-red-500" />
                        ) : (
                            <Video size={20} className="text-slate-500" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{attachment.file.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{attachment.type}</span>
                    </div>
                    <IconButton size="small" onClick={clearAttachment} sx={{ ml: 1, minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}>
                        <X size={14} />
                    </IconButton>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden" 
                    accept="image/*,video/*,application/pdf"
                    aria-label="Select files for upload"
                />
                
                <Tooltip title="Upload PDF (RFI/Invoice) or Media" arrow>
                    <IconButton 
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                        sx={{
                            bgcolor: attachment ? 'indigo.50' : 'grey.50', 
                            color: attachment ? 'indigo.600' : 'grey.600',
                            border: '1px solid',
                            borderColor: attachment ? 'indigo.200' : 'grey.200',
                            borderRadius: 3,
                            p: 1.5,
                            minWidth: { xs: 44, md: 'auto' },
                            minHeight: { xs: 44, md: 'auto' },
                            '&:hover': { bgcolor: 'indigo.100', color: 'indigo.700' }
                        }}
                    >
                        <Paperclip size={20} />
                    </IconButton>
                </Tooltip>

                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about schedule, or upload RFI PDF for extraction..."
                        className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                        autoFocus
                        aria-label="Chat input"
                    />
                </div>

                <IconButton 
                    type="submit" 
                    disabled={isLoading || (!input.trim() && !attachment)}
                    sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        p: 1.5,
                        borderRadius: 3,
                        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&.Mui-disabled': { bgcolor: 'grey.200', color: 'grey.400', boxShadow: 'none' }
                    }}
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </IconButton>
            </form>
            <div className="text-center mt-2">
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                    AI can make mistakes. Verify important project information.
                </Typography>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
