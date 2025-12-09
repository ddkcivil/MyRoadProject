
import React, { useState, useRef } from 'react';
import { File, UploadCloud, Eye, Loader2, X } from 'lucide-react';
import { draftLetter, extractDocumentMetadata } from '../services/geminiService';
import { Project, ProjectDocument } from '../types';

interface Props {
    project: Project;
    onProjectUpdate: (project: Project) => void;
}

const DocumentsModule: React.FC<Props> = ({ project, onProjectUpdate }) => {
  // Extraction States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  const addDocument = (name: string, size: string, refNo?: string, subject?: string, date?: string, content?: string) => {
      const newDoc: ProjectDocument = {
        id: `doc-${Date.now()}`,
        name: name,
        type: 'PDF',
        date: date || new Date().toISOString().split('T')[0],
        size: size,
        refNo: refNo,
        subject: subject,
        content: content
      };
      onProjectUpdate({
          ...project,
          documents: [newDoc, ...project.documents]
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsExtracting(true);

      try {
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
             const base64String = reader.result as string;
             const base64Data = base64String.split(',')[1];
             
             // Call Gemini Vision to extract metadata
             const meta = await extractDocumentMetadata(base64Data, file.type);
             
             // Add Document with content for preview if it's an image or allow PDF preview if browser supports
             const content = base64String;

             addDocument(file.name, `${(file.size / 1024 / 1024).toFixed(2)} MB`, meta.refNo, meta.subject, meta.date, content);
             setIsExtracting(false);
             if(fileInputRef.current) fileInputRef.current.value = ''; // Reset
        };
      } catch (error) {
          console.error("Upload error", error);
          setIsExtracting(false);
          // Fallback add without metadata
          addDocument(file.name, `${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }
  };

  return (
    <>
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 h-[calc(100vh-140px)] flex flex-col">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Project Documents</h3>
            <button 
               onClick={() => fileInputRef.current?.click()} 
               disabled={isExtracting}
               className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 px-3 py-2 rounded flex items-center gap-2 transition-colors border border-blue-200"
            >
                {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                {isExtracting ? 'Scanning...' : 'Import & Scan'}
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
            />
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-3">
            {project.documents.length === 0 ? (
                <div className="text-slate-400 text-sm italic">No documents saved.</div>
            ) : (
                project.documents.map((doc) => (
                    <div 
                        key={doc.id} 
                        onClick={() => setPreviewDoc(doc)}
                        className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-100 cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                               <File className="text-red-500" size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-sm font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</div>
                                {doc.refNo && (
                                    <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded inline-block mt-1 font-mono">
                                        Ref: {doc.refNo}
                                    </div>
                                )}
                                {doc.subject && (
                                    <div className="text-xs text-slate-600 mt-1 line-clamp-2 italic">
                                        Sub: {doc.subject}
                                    </div>
                                )}
                                <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                                    <span>Date: {doc.date}</span>
                                    <span>{doc.size}</span>
                                </div>
                            </div>
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={16} className="text-blue-400" />
                            </div>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>

                          {previewDoc && (
                            <>
                              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
                                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                          <h3 className="font-bold text-slate-800">{previewDoc.name}</h3>
                          <p className="text-xs text-slate-500">Ref: {previewDoc.refNo || 'N/A'}</p>
                      </div>
                      <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  <div className="flex-1 bg-slate-100 overflow-auto p-4 flex items-center justify-center">
                      {previewDoc.content ? (
                          <iframe src={previewDoc.content} title="Document Preview" className="w-full h-full border-0 rounded-lg shadow-lg" />
                      ) : (
                          <div className="text-center text-slate-400">
                              <FileText size={64} className="mx-auto mb-4 opacity-50"/>
                              <p className="text-lg font-medium">Preview Unavailable</p>
                              <p className="text-sm">This is a mockup file ({previewDoc.type}).</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
            </>
        )}
    </>
  );
};

export default DocumentsModule;
