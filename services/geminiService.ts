import { GoogleGenAI, Type, Schema, LiveServerMessage, Modality } from "@google/genai";
import { Question, ModuleType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Content Generation ---

export const generateQuestions = async (module: ModuleType, level: string, topic?: string): Promise<Question[]> => {
  const modelId = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a Dutch Inburgering exam expert. 
  Generate 3 multiple-choice questions for the module: ${module}.
  Target Level: ${level}.
  Language: Dutch (with English translations provided).
  Format: JSON.
  Ensure questions are realistic for the exam.`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['multiple-choice'] },
        text: { type: Type.STRING, description: "The question in Dutch" },
        translation: { type: Type.STRING, description: "The question in English" },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 options in Dutch" },
        correctAnswer: { type: Type.STRING, description: "The correct option text exactly as in options" },
        explanation: { type: Type.STRING, description: "Explanation in simple Dutch followed by English translation" }
      },
      required: ['id', 'type', 'text', 'options', 'correctAnswer', 'explanation']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate questions about ${topic || 'general topics'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: systemInstruction,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    return [];
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

export const evaluateWriting = async (text: string, task: string): Promise<{score: number, feedback: string, correction: string}> => {
   const modelId = 'gemini-2.5-flash';
   const prompt = `Evaluate this Dutch writing task for Inburgering A2 level.
   Task: "${task}"
   Student Text: "${text}"
   
   Provide:
   1. A score (1-10)
   2. Constructive feedback in English.
   3. A corrected version of the Dutch text.
   `;

   const schema: Schema = {
     type: Type.OBJECT,
     properties: {
       score: { type: Type.NUMBER },
       feedback: { type: Type.STRING },
       correction: { type: Type.STRING }
     }
   };

   const response = await ai.models.generateContent({
     model: modelId,
     contents: prompt,
     config: {
       responseMimeType: 'application/json',
       responseSchema: schema
     }
   });
   
   return JSON.parse(response.text || '{}');
};

export const evaluateSpeaking = async (audioBase64: string, question: string): Promise<{score: number, transcription: string, feedback: string}> => {
  const modelId = 'gemini-2.5-flash';
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'audio/webm;codecs=opus', // Assuming webm from browser recorder
            data: audioBase64
          }
        },
        {
          text: `The user was asked: "${question}". Transcribe their audio, rate their pronunciation and grammar (A2 level) from 1-10, and give brief feedback in English.`
        }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          transcription: { type: Type.STRING },
          feedback: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

// --- Live API Helpers ---

// Simple helper to convert Float32Array from AudioContext to PCM Int16
export function pcmToBase64(data: Float32Array): string {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const connectLiveTutor = async (
  onMessage: (msg: LiveServerMessage) => void,
  onOpen: () => void,
  onClose: () => void,
  onError: (e: any) => void
) => {
  return await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are a helpful, encouraging Dutch tutor. Speak slowly and clearly. Help the user practice for the Inburgering exam. Correct their mistakes gently.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });
};
