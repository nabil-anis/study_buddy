import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Flashcard, Task } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildPrompt = (baseInstruction: string, context?: string): string => {
  if (context) {
    return `${baseInstruction}
    
    Please base your response on the following document content:
    ---
    ${context}
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
      contents: prompt,
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
      contents: `Based on the following document content, please answer the user's question. Be helpful and conversational.
      
      DOCUMENT CONTENT:
      ---
      ${fileContent}
      ---
      
      USER'S QUESTION: "${question}"`,
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
