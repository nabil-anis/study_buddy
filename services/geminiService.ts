import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Flashcard, Task } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Assume mammoth and XLSX are loaded globally from the script tags in index.html
declare const mammoth: any;
declare const XLSX: any;


// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                if (!event.target?.result) {
                    return reject('File could not be read.');
                }

                if (file.type === 'application/pdf') {
                    const pdf = await pdfjsLib.getDocument(new Uint8Array(event.target.result as ArrayBuffer)).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ');
                    }
                    resolve(text);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const result = await mammoth.extractRawText({ arrayBuffer: event.target.result as ArrayBuffer });
                    resolve(result.value);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                     const workbook = XLSX.read(event.target.result, { type: 'binary' });
                     let content = '';
                     workbook.SheetNames.forEach(sheetName => {
                         const worksheet = workbook.Sheets[sheetName];
                         content += XLSX.utils.sheet_to_csv(worksheet);
                     });
                     resolve(content);
                } else if (file.type.startsWith('text/')) {
                    reader.readAsText(file);
                    reader.onload = (e) => resolve(e.target?.result as string);
                } else {
                    reject('Unsupported file type.');
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        
        // For text files, read as text. For others, read as ArrayBuffer.
        if (file.type.startsWith('text/')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
};


const buildPrompt = (baseInstruction: string, context?: string): string => {
  if (context) {
    // Truncate context to avoid hitting token limits
    const truncatedContext = context.length > 15000 ? context.substring(0, 15000) : context;
    return `${baseInstruction}
    
    Please base your response on the following document content:
    ---
    ${truncatedContext}
    ---
    `;
  }
  return baseInstruction;
}

export const summarizeText = async (text: string): Promise<string> => {
  try {
    const prompt = `Summarize the following text concisely, focusing on the key points. Here is the text: "${text}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildPrompt(prompt),
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error in summarizeText:", error);
    throw new Error("Failed to summarize text.");
  }
};

export const generateQuiz = async (topic: string, count: number, context?: string): Promise<QuizQuestion[]> => {
  try {
    const prompt = buildPrompt(
      `Generate a JSON array of ${count} multiple-choice quiz questions about "${topic}". Each question should be an object with three properties: "question" (string), "options" (an array of 4 strings), and "correctAnswer" (a string that is one of the options).`,
      context
    );
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
      },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as QuizQuestion[];
  } catch (error) {
    console.error("Gemini API error in generateQuiz:", error);
    throw new Error("Failed to generate quiz questions.");
  }
};

export const generateFlashcards = async (topic: string, count: number, context?: string): Promise<Flashcard[]> => {
    try {
        const prompt = buildPrompt(
            `Generate a JSON array of ${count} flashcards about "${topic}". Each flashcard should be an object with two properties: "front" (a question or term) and "back" (the answer or definition).`,
            context
        );

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING },
                            back: { type: Type.STRING }
                        },
                        required: ['front', 'back']
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Flashcard[];
    } catch (error) {
        console.error("Gemini API error in generateFlashcards:", error);
        throw new Error("Failed to generate flashcards.");
    }
};

export const askAboutFile = async (fileContent: string, question: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildPrompt(`Answer the user's question in a helpful and conversational way. USER'S QUESTION: "${question}"`, fileContent),
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error in askAboutFile:", error);
    throw new Error("Failed to get an answer about the file.");
  }
};

export const generateStudyPlan = async (goal: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a JSON array of actionable study tasks for the following goal: "${goal}". The array should contain strings representing individual tasks. For example, for "pass my biology exam", tasks could be "Review chapter 1 notes", "Create flashcards for vocabulary", "Take practice quiz A". Provide between 5 and 8 tasks.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini API error in generateStudyPlan:", error);
        throw new Error("Failed to generate a study plan.");
    }
};