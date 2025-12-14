import React, { useState, useRef, useMemo, useCallback } from 'react';
import { FileText, Send, Download, File, UploadCloud, Eye, Loader2, X, Folder, ChevronRight, Home, Search, Plus, Filter, Tag, Calendar, User, MoreVertical, ScanLine, ArrowDownLeft, ArrowUpRight, Check, Sparkles, Trash2 } from 'lucide-react';
import { draftLetter, extractDocumentMetadata } from '../services/geminiService';
import { Project, ProjectDocument, UserRole } from '../types';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    Box, 
    Typography, 
    IconButton, 
    Menu, 
    MenuItem, 
    Breadcrumbs, 
    Link as MuiLink, 
    Chip, 
    Grid, 
    Stack, 
    Divider, 
    Paper, 
    FormControl, 
    InputLabel, 
    Select, 
    CircularProgress, 
    ToggleButton, 
    ToggleButtonGroup,
    Card,
    CardContent,
    InputAdornment
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

interface Props {
    project: Project;
    userRole: UserRole;
    onProjectUpdate: (project: Project) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

interface FolderCardProps {
  folderName: string;
  project: Project; // Needed to filter files count
  setCurrentFolder: (folder: string | null) => void;
}

const FolderCard: React.FC<FolderCardProps> = React.memo(({ folderName, project, setCurrentFolder }) => {
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Paper 
          variant="outlined" 
          onClick={() => setCurrentFolder(folderName)} 
          onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentFolder(folderName);
              }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Open folder ${folderName}`}
          sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 2, borderColor: 'primary.main' }, '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
      >
          <Box sx={{ color: 'lightblue' }}><Folder size={48} /></Box>
          <Typography variant="subtitle1">{folderName}</Typography>
          <Typography variant="caption">{project.documents.filter(d => (d.folder || 'Uncategorized') === folderName).length} files</Typography>
      </Paper>
    </Grid>
  );
});

const renderIcon = (type: string) => {
    const color = type === 'PDF' ? 'error.main' : type === 'IMAGE' ? 'primary.main' : 'text.secondary';
    return <FileText color={color} />;
};

interface DocumentItemProps {
  doc: ProjectDocument;
  canDelete: boolean;
  setPreviewDoc: (doc: ProjectDocument | null) => void;
  handleDeleteClick: (e: React.MouseEvent, docId: string) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = React.memo(({ doc, canDelete, setPreviewDoc, handleDeleteClick }) => {
  return (
    <Paper 
        key={doc.id} 
        variant="outlined" 
        onClick={() => setPreviewDoc(doc)} 
        onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                setPreviewDoc(doc);
            }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View document ${doc.name}`}
        sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
    >
        {renderIcon(doc.type)}
        <Box flexGrow={1}><Typography variant="body2" fontWeight="medium">{doc.name}</Typography><Typography variant="caption" color="text.secondary">{doc.date} - {doc.size}</Typography></Box>
        <Box>{doc.tags?.map(t => <Chip key={t} label={t} size="small" sx={{ mr: 0.5 }} />)}</Box>
        {canDelete && <IconButton size="small" onClick={(e) => handleDeleteClick(e, doc.id)} aria-label="Delete document" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 size={16} /></IconButton>}
    </Paper>
  );
});

const DocumentsModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const [topic, setTopic] = useState('');
  const [recipient, setRecipient] = useState('Authority Engineer');
  const [tone, setTone] = useState('Formal'); // New state for tone
  const [additionalContext, setAdditionalContext] = useState(''); // New state for additional context
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  

  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displaySearchQuery, setDisplaySearchQuery] = useState(''); // New state for input value
  
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  const [uploadMode, setUploadMode] = useState<'SIMPLE' | 'SCAN'>('SIMPLE');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTargetFolder, setUploadTargetFolder] = useState('Correspondence');
  const [uploadTags, setUploadTags] = useState<string>('');
  
  const [letterType, setLetterType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [scanStep, setScanStep] = useState<'IDLE' | 'PROCESSING' | 'REVIEW'>('IDLE');
  const [scannedMetadata, setScannedMetadata] = useState({
      subject: '', refNo: '', date: new Date().toISOString().split('T')[0], sender: '', recipient: ''
  });

  const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null); // State for ID of item to delete
  const { showNotification } = useNotification(); // Use notification hook


  const handleOpenUpload = () => setUploadModalOpen(true);
  const handleCloseUpload = () => {
      setUploadModalOpen(false);
      setUploadFiles([]);
      setUploadMode('SIMPLE');
      setUploadTags('');
      setScanStep('IDLE');
      setScannedMetadata({ subject: '', refNo: '', date: new Date().toISOString().split('T')[0], sender: '', recipient: '' });
  };

  const canDelete = userRole === UserRole.ADMIN || userRole === UserRole.PROJECT_MANAGER;

  const handleDeleteClick = (e: React.MouseEvent, docId: string) => {
      e.stopPropagation();
      setItemToDeleteId(docId);
      setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
      if (itemToDeleteId) {
          onProjectUpdate({ ...project, documents: project.documents.filter(d => d.id !== itemToDeleteId) });
          if (previewDoc?.id === itemToDeleteId) setPreviewDoc(null);
          showNotification("Document deleted successfully!", "success");
          setItemToDeleteId(null);
          setConfirmOpen(false);
      }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsDrafting(true);
    setGeneratedLetter(await draftLetter(topic, recipient, tone, additionalContext));
    setIsDrafting(false);
  };

  const handleSaveAsPdf = () => {
      if (!generatedLetter) return;
      const name = `${topic.substring(0, 20).replace(/\s+/g, '_')}_Draft.pdf`;
      onProjectUpdate({
          ...project,
          documents: [{
            id: `doc-${Date.now()}`, name, type: 'PDF', folder: 'Correspondence',
            date: new Date().toISOString().split('T')[0], size: '0.5 MB',
            refNo: `DRAFT/${Date.now().toString().slice(-4)}`, subject: topic,
            content: window.btoa(generatedLetter), tags: ['Draft', 'Generated', 'Outgoing']
          }, ...project.documents]
      });
      showNotification("Document saved to 'Correspondence' folder.", "success");
  };

  const folders = useMemo(() => {
      const allFolders = new Set(project.documents.map(d => d.folder || 'Uncategorized'));
      ['Contracts', 'Drawings', 'Correspondence', 'Reports', 'Invoices', 'Site Photos'].forEach(f => allFolders.add(f));
      return Array.from(allFolders).sort();
  }, [project.documents]);

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300), 
    []
  );

  const handleDisplaySearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplaySearchQuery(e.target.value);
    debouncedSetSearchQuery(e.target.value);
  };

  const filteredDocs = useMemo(() => {
      let docs = currentFolder ? project.documents.filter(d => (d.folder || 'Uncategorized') === currentFolder) : project.documents;
      if (searchQuery) {
          const lower = searchQuery.toLowerCase();
          docs = docs.filter(d => d.name.toLowerCase().includes(lower) || d.subject?.toLowerCase().includes(lower) || d.refNo?.toLowerCase().includes(lower) || d.date?.includes(lower) || d.tags?.some(t => t.toLowerCase().includes(lower)));
      }
      return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [project.documents, currentFolder, searchQuery]);



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          setUploadFiles(Array.from(event.target.files));
      }
  };

  const handleUploadFiles = () => {
      if (uploadFiles.length === 0) return;

      const newDocs: ProjectDocument[] = uploadFiles.map(file => ({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'IMAGE' : 'PDF', // Basic type detection
          folder: uploadTargetFolder,
          date: new Date().toISOString().split('T')[0],
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB', // Size in MB
          uploadedBy: "currentUser?.name || 'Unknown'", // Fixed: use string literal as currentUser is not in scope
          tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }));

      onProjectUpdate({ ...project, documents: [...newDocs, ...project.documents] });
      handleCloseUpload();
      showNotification(`${newDocs.length} document(s) uploaded successfully!`, "success");
  };

  const handleScanStart = async () => {
      if (uploadFiles.length === 0) return;
      setScanStep('PROCESSING');
      try {
          const file = uploadFiles[0];
          const reader = new FileReader();

          reader.onloadend = async () => {
              const base64Content = reader.result?.toString().split(',')[1]; // Get base64 content
              if (base64Content) {
                  const metadata = await extractDocumentMetadata(base64Content, file.type); // Pass base64 and mimeType to service
                  setScannedMetadata({
                      ...scannedMetadata,
                      subject: metadata.subject || '',
                      refNo: metadata.refNo || '',
                      date: metadata.date || new Date().toISOString().split('T')[0],
                  });
                  setScanStep('REVIEW');
              } else {
                  throw new Error("Failed to convert file to Base64.");
              }
          };
          reader.onerror = (error) => {
              console.error("FileReader error:", error);
              showNotification("Error reading file. Please try again.", "error");
              setScanStep('IDLE');
          };
          reader.readAsDataURL(file); // Read file as Data URL (Base64)
      } catch (error) {
          console.error("Error extracting metadata:", error);
          showNotification("Failed to extract metadata. Please try again or use simple upload.", "error");
          setScanStep('IDLE');
      }
  };

  const handleScanReviewSave = () => {
      if (uploadFiles.length === 0 || !scannedMetadata.subject) return;

      const newDoc: ProjectDocument = {
          id: `doc-${Date.now()}`,
          name: uploadFiles[0].name,
          type: uploadFiles[0].type.startsWith('image/') ? 'IMAGE' : 'PDF', // Simplified
          folder: uploadTargetFolder,
          date: scannedMetadata.date,
          refNo: scannedMetadata.refNo,
          subject: scannedMetadata.subject,
          size: (uploadFiles[0].size / 1024 / 1024).toFixed(2) + ' MB',
          tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag),
          // content: URL.createObjectURL(uploadFiles[0]) // Use this for preview if needed
      };

      onProjectUpdate({ ...project, documents: [newDoc, ...project.documents] });
      handleCloseUpload();
      showNotification("Scanned document saved successfully!", "success");
  };
  
  return (
    <Grid container spacing={3} sx={{ height: 'calc(100vh - 160px)' }}>
      <Grid item xs={12} lg={4} sx={{ height: '100%', display: 'flex' }}>
        <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Draft Correspondence (AI)</Typography>
            </CardContent>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth><InputLabel>Recipient</InputLabel><Select value={recipient} label="Recipient" onChange={(e) => setRecipient(e.target.value)}><MenuItem value="Authority Engineer">Authority Engineer</MenuItem><MenuItem value="Sub-Contractor">Sub-Contractor</MenuItem></Select></FormControl>
                <TextField label="Subject / Topic" multiline rows={5} fullWidth value={topic} onChange={(e) => setTopic(e.target.value)} />
                {/* New Tone Selection */}
                <FormControl fullWidth>
                    <InputLabel>Tone</InputLabel>
                    <Select value={tone} label="Tone" onChange={(e) => setTone(e.target.value)}>
                        <MenuItem value="Formal">Formal</MenuItem>
                        <MenuItem value="Informal">Informal</MenuItem>
                        <MenuItem value="Urgent">Urgent</MenuItem>
                        <MenuItem value="Friendly">Friendly</MenuItem>
                    </Select>
                </FormControl>
                {/* New Additional Context Field */}
                <TextField label="Additional Context (Optional)" multiline rows={3} fullWidth value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} />
                <Button variant="contained" onClick={handleGenerate} disabled={isDrafting || !topic} startIcon={isDrafting ? <CircularProgress size={20} /> : <Send />}>{isDrafting ? 'Drafting...' : 'Generate Draft'}</Button>
            </CardContent>
            {isDrafting ? (
                <CardContent sx={{ borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <CircularProgress size={30} sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">Generating draft letter...</Typography>
                </CardContent>
            ) : generatedLetter && (
                <CardContent sx={{ borderTop: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}><Typography variant="subtitle2">Draft Preview</Typography><Button size="small" startIcon={<Download />} onClick={handleSaveAsPdf}>Save as PDF</Button></Box>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}><Typography variant="body2">{generatedLetter}</Typography></Paper>
                </CardContent>
            )}
        </Card>
      </Grid>

      <Grid item xs={12} lg={8} sx={{ height: '100%', display: 'flex' }}>
        <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                    <Box><Typography variant="h6" fontWeight="bold">Project Documents</Typography><Breadcrumbs separator="›"><MuiLink component="button" onClick={() => setCurrentFolder(null)}>Root</MuiLink>{currentFolder && <Typography>{currentFolder}</Typography>}</Breadcrumbs></Box>
                    <Box display="flex" gap={1}>
                        <TextField 
                            size="small" 
                            placeholder="Search..." 
                            value={displaySearchQuery} 
                            onChange={handleDisplaySearchQueryChange} 
                            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} 
                        />
                        <Button variant="contained" onClick={handleOpenUpload} startIcon={<UploadCloud />}>Upload</Button>
                    </Box>
                </Box>
            </CardContent>
            <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                 {!currentFolder && !searchQuery ? (
                     <Grid container spacing={2}>
                         {folders.map(folderName => (
                             <FolderCard
                                 key={folderName}
                                 folderName={folderName}
                                 project={project}
                                 setCurrentFolder={setCurrentFolder}
                             />
                         ))}
                     </Grid>
                 ) : filteredDocs.length === 0 ? (
                     <Box p={8} textAlign="center" color="text.secondary">
                         <Box sx={{ opacity: 0.3 }}><FileText size={40} /></Box>
                         <Typography mt={1}>No documents found matching your criteria.</Typography>
                         {(currentFolder || searchQuery) && (
                             <Button size="small" sx={{ mt: 2 }} onClick={() => { setCurrentFolder(null); setSearchQuery(''); }}>Clear Filters</Button>
                         )}
                     </Box>
                 ) : (
                     <Stack spacing={1}>
                         {filteredDocs.map(doc => (
                             <DocumentItem
                                 key={doc.id}
                                 doc={doc}
                                 canDelete={canDelete}
                                 setPreviewDoc={setPreviewDoc}
                                 handleDeleteClick={handleDeleteClick}
                             />
                         ))}
                     </Stack>
                 )}
            </CardContent>
        </Card>
      </Grid>
      
      {/* Modals remain mostly the same but will now inherit consistent theme styles for buttons, textfields etc. */}
      
      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onClose={handleCloseUpload} maxWidth="md" fullWidth>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent dividers>
              <Stack spacing={3}>
                  <ToggleButtonGroup
                      value={uploadMode}
                      exclusive
                      onChange={(e, newMode) => newMode && setUploadMode(newMode)}
                      fullWidth
                  >
                      <ToggleButton value="SIMPLE">
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}><Plus size={20} /></Box> Simple Upload
                      </ToggleButton>
                      <ToggleButton value="SCAN">
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}><ScanLine size={20} /></Box> Scan & Extract Metadata (AI)
                      </ToggleButton>
                  </ToggleButtonGroup>

                  <input
                      type="file"
                      ref={modalFileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      multiple={uploadMode === 'SIMPLE'}
                      accept={uploadMode === 'SCAN' ? 'application/pdf,image/*' : '*/*'}
                      aria-label="Select files for upload"
                  />
                  <Button variant="outlined" onClick={() => modalFileInputRef.current?.click()} startIcon={<File />}>
                      {uploadFiles.length > 0 ? `${uploadFiles.length} File(s) Selected` : `Select File${uploadMode === 'SIMPLE' ? 's' : ''}`}
                  </Button>
                  {uploadFiles.length > 0 && (
                      <Box>
                          <Typography variant="body2">Selected: {uploadFiles.map(f => f.name).join(', ')}</Typography>
                      </Box>
                  )}

                  <FormControl fullWidth>
                      <InputLabel>Target Folder</InputLabel>
                      <Select value={uploadTargetFolder} label="Target Folder" onChange={(e) => setUploadTargetFolder(e.target.value)}>
                          {folders.map(folder => (
                              <MenuItem key={folder} value={folder}>{folder}</MenuItem>
                          ))}
                      </Select>
                  </FormControl>

                  <TextField
                      label="Tags (comma-separated)"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      fullWidth
                  />

                  {uploadMode === 'SCAN' && (
                      <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="h6" gutterBottom>AI Scan & Metadata Extraction</Typography>
                          {scanStep === 'IDLE' && (
                              <Button variant="contained" onClick={handleScanStart} disabled={uploadFiles.length === 0} startIcon={<Sparkles />}>
                                  Start Scan
                              </Button>
                          )}
                          {scanStep === 'PROCESSING' && (
                              <Stack direction="row" alignItems="center" spacing={2}>
                                  <CircularProgress size={20} />
                                  <Typography>Extracting metadata with AI...</Typography>
                              </Stack>
                          )}
                          {scanStep === 'REVIEW' && (
                              <Stack spacing={2}>
                                  <Typography variant="subtitle1">Review Extracted Metadata:</Typography>
                                  <TextField label="Subject" value={scannedMetadata.subject} onChange={(e) => setScannedMetadata({ ...scannedMetadata, subject: e.target.value })} fullWidth />
                                  <TextField label="Reference No." value={scannedMetadata.refNo} onChange={(e) => setScannedMetadata({ ...scannedMetadata, refNo: e.target.value })} fullWidth />
                                  <TextField label="Date" type="date" value={scannedMetadata.date} onChange={(e) => setScannedMetadata({ ...scannedMetadata, date: e.target.value })} fullWidth />
                                  <Button variant="contained" onClick={handleScanReviewSave} startIcon={<Check />}>
                                      Save Scanned Document
                                  </Button>
                              </Stack>
                          )}
                      </Box>
                  )}
              </Stack>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseUpload}>Cancel</Button>
              {uploadMode === 'SIMPLE' && (
                  <Button onClick={handleUploadFiles} variant="contained" disabled={uploadFiles.length === 0}>
                      Upload
                  </Button>
              )}
          </DialogActions>
      </Dialog>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="md" fullWidth>
          <DialogTitle>{previewDoc?.name}</DialogTitle>
          <DialogContent dividers>
              {previewDoc && (
                  <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight="bold">Details:</Typography>
                      <Typography variant="body2"><strong>Subject:</strong> {previewDoc.subject || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Reference No.:</strong> {previewDoc.refNo || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Date:</strong> {previewDoc.date}</Typography>
                      <Typography variant="body2"><strong>Folder:</strong> {previewDoc.folder}</Typography>
                      <Typography variant="body2"><strong>Tags:</strong> {previewDoc.tags?.map(tag => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />) || 'N/A'}</Typography>

                      {previewDoc.content && (
                          <Box mt={2}>
                              <Typography variant="subtitle1" fontWeight="bold">Preview:</Typography>
                              {previewDoc.type === 'PDF' && (
                                  <iframe 
                                      src={`data:application/pdf;base64,${previewDoc.content}`} 
                                      width="100%" 
                                      height="500px" 
                                      style={{ border: 'none' }} 
                                      title={previewDoc.name}
                                  />
                              )}
                              {previewDoc.type === 'IMAGE' && (
                                  <img 
                                      src={`data:image/jpeg;base64,${previewDoc.content}`} // Assuming JPEG for simplicity, could be dynamic
                                      alt={previewDoc.name} 
                                      style={{ maxWidth: '100%', height: 'auto' }} 
                                  />
                              )}
                              {/* Add more types if needed */}
                          </Box>
                      )}
                      {!previewDoc.content && <Typography variant="body2" color="text.secondary">No preview content available.</Typography>}
                  </Stack>
              )}
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setPreviewDoc(null)}>Close</Button>
          </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
            setConfirmOpen(false);
            setItemToDeleteId(null);
            showNotification("Document deletion cancelled.", "info");
        }}
      />
    </Grid>
  );
};

export default DocumentsModule;