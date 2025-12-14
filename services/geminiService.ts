
import { GoogleGenAI } from "@google/genai";
import { BOQItem, RFI, ScheduleTask } from '../types';

const getAIClient = () => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

// Original simple analysis (kept for backward compatibility if needed, but updated to use Pro)
export const analyzeProjectStatus = async (
  boq: BOQItem[],
  rfis: RFI[],
  schedule: ScheduleTask[],
  userQuery: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  const context = `
    You are an expert Senior Project Manager for a major Road Construction project.
    Analyze the following project data and answer the user's query.
    
    User Query: "${userQuery}"

    Project Data:
    1. Critical Schedule Items:
    ${JSON.stringify(schedule.filter(s => s.status !== 'Completed').slice(0, 5))}

    2. Recent RFIs:
    ${JSON.stringify(rfis.slice(0, 5))}

    3. BOQ Progress:
    ${JSON.stringify(boq.slice(0, 5))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI service.";
  }
};

// --- New Robust Chat Function ---
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachment?: {
    mimeType: string;
    data: string; // base64
    type: 'image' | 'video' | 'pdf';
  };
}

export const chatWithGemini = async (
  currentMessage: string,
  history: ChatMessage[],
  projectContext: any,
  attachment?: { mimeType: string; data: string },
  useFastModel: boolean = false
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable.";

  // Model Selection Logic
  // Default to Pro for reasoning and document extraction
  let model = 'gemini-2.5-flash';
  
  // Use Flash Lite ONLY if specifically requested AND no media is attached (Flash Lite is text-optimized/multimodal-light but Pro is requested for media)
  if (useFastModel && !attachment) {
    model = 'gemini-2.5-flash-lite';
  }

  // System Instruction / Context
  const systemInstruction = `You are RoadMaster AI, a helpful construction management assistant.
  
  Context:
  - Project: ${projectContext.name} (${projectContext.code})
  - Location: ${projectContext.location}
  - Contractor: ${projectContext.contractor}
  
  Your capabilities include:
  1. Answering questions about the project schedule, BOQ, and status.
  2. Analyzing uploaded documents (PDFs, Images) such as RFIs, Invoices, and Drawings.
  3. Analyzing site photos and videos for progress and safety.

  SPECIFIC INSTRUCTIONS FOR DOCUMENT ANALYSIS:
  - If the user uploads an RFI (Request for Inspection) document (PDF/Image):
    Please extract and present the following details in a structured format:
    * **RFI Number**: [Extract number]
    * **Location/Chainage**: [Extract location]
    * **Description of Work**: [Extract description]
    * **Date**: [Extract date]
    * **Status**: [Determine if it looks Open, Approved, or Rejected based on signatures or remarks]
    * **Key Observations**: [Any constraints or notes found in the doc]

  - If the user uploads an Invoice or Bill:
    Extract Bill No, Vendor, Date, and Total Amount.
    
  - For Site Photos/Videos:
    Describe progress, identify machinery, or spot safety hazards.`;

  try {
    // Construct History for API
    // We filter out attachments from history to keep context lightweight, 
    // sending only the text of previous turns, unless it's the current turn.
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add Current Message
    const currentParts: any[] = [{ text: currentMessage }];
    if (attachment) {
      currentParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

export const draftLetter = async (topic: string, recipient: string, tone: string, additionalContext: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Service Unavailable.";

  const prompt = `
    Draft a construction project correspondence letter.
    Topic: ${topic}
    Recipient Role: ${recipient}
    Sender Role: Project Manager
    Tone: ${tone}
    Additional Context: ${additionalContext || 'None provided.'}
    
    Please ensure the letter is professional and directly addresses the topic, considering the tone and additional context.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate draft.";
  } catch (error) {
    console.error("Gemini Letter Gen Error:", error);
    return "Error generating letter.";
  }
};

export const extractDocumentMetadata = async (fileBase64: string, mimeType: string): Promise<{
  refNo: string, 
  date: string, 
  subject: string,
  sender: string,
  recipient: string
}> => {
  const ai = getAIClient();
  if (!ai) return { refNo: '', date: '', subject: '', sender: '', recipient: '' };

  const prompt = `
    Analyze this document image/PDF.
    Extract the following fields in JSON format:
    - refNo: The reference number or letter number.
    - date: The date of the letter (YYYY-MM-DD).
    - subject: The subject line or main topic.
    - sender: Who sent this letter (Organization/Person).
    - recipient: Who is it addressed to.
    
    Return JSON: { "refNo": "...", "date": "...", "subject": "...", "sender": "...", "recipient": "..." }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Extract Metadata Error:", error);
    return { refNo: '', date: '', subject: '', sender: '', recipient: '' };
  }
};
