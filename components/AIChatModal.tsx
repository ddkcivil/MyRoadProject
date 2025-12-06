
import React, { useState } from 'react';
import { X, Bot, Send } from 'lucide-react';
import { analyzeProjectStatus } from '../services/geminiService';
import { Project } from '../types';

interface Props {
  project: Project;
  onClose: () => void;
}

const AIChatModal: React.FC<Props> = ({ project, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    // Pass selected project data to the service
    const result = await analyzeProjectStatus(project.boq, project.rfis, project.schedule, query);
    
    setResponse(result);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <div>
                <h3 className="font-bold text-lg">RoadMaster AI Assistant</h3>
                <div className="text-xs text-indigo-200">Context: {project.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {response ? (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-sm">
                 <Bot size={16} /> AI Analysis
              </div>
              <div className="prose prose-sm text-slate-700 max-w-none whitespace-pre-wrap">
                {response}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <Bot size={48} className="opacity-20" />
              <p className="text-center text-sm max-w-xs">
                Ask me about delays, RFI bottlenecks, or generate a summary for <strong>{project.code}</strong>.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => setQuery("Summarize the critical delays")} className="text-xs bg-white border px-3 py-1 rounded-full hover:bg-indigo-50">Summarize Delays</button>
                <button onClick={() => setQuery("Which BOQ items are behind schedule?")} className="text-xs bg-white border px-3 py-1 rounded-full hover:bg-indigo-50">BOQ Status</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask about ${project.code}...`}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 flex items-center gap-2 font-medium"
            >
              {isLoading ? 'Thinking...' : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
