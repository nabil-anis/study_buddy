import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Card from './GlassCard';
import { askAboutFile } from '../services/geminiService';
import { useVoice } from '../hooks/useVoice';
import { FileTextIcon, MicIcon, SendIcon } from './icons';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const FileAssistantModule: React.FC = () => {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { transcript, isListening, startListening, stopListening, speak } = useVoice();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (transcript) {
            setUserInput(transcript);
        }
    }, [transcript]);

    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [messages]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setFileContent(text);
                setFileName(file.name);
                setMessages([{ sender: 'ai', text: `I've read "${file.name}". What would you like to know? I'm basically a librarian who doesn't shush you.` }]);
            };
            // For this demo, we can only read text-based files.
            // In a real-world app, you'd use libraries like pdf.js, mammoth.js, or SheetJS here.
            reader.readAsText(file);
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || !fileContent) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const aiResponse = await askAboutFile(fileContent, userInput);
            setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
            speak(aiResponse);
        } catch (error) {
            console.error("Error asking about file:", error);
            setMessages([...newMessages, { sender: 'ai', text: "My circuits are a bit fried. Can you ask that again?" }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!fileContent) {
      return (
          <Card className="h-full flex flex-col items-center justify-center text-center">
              <FileTextIcon className="w-16 h-16 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-zinc-100">File Chat Assistant</h2>
              <p className="text-zinc-400 mb-6 max-w-md">Upload a document (PDF, DOCX, TXT, etc.) and I'll answer your questions about it.</p>
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-transform transform hover:scale-105 shadow-lg">
                  Upload a File
              </label>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
          </Card>
      );
    }

    return (
        <Card className="h-full flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-center text-zinc-200">Chatting about: <span className="text-purple-400">{fileName}</span></h3>
            <div ref={chatContainerRef} className="flex-grow bg-zinc-950/50 p-4 rounded-lg overflow-y-auto mb-4 border border-zinc-800">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                            <div className={`max-w-xs md:max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex items-start gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">A</div>
                         <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-zinc-800 text-zinc-200 rounded-bl-none">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                            </div>
                         </div>
                       </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isListening ? 'Listening...' : "Ask a question..."}
                    className="flex-grow px-4 py-3 bg-zinc-800 rounded-full border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-100"
                    disabled={isLoading}
                />
                <button onClick={isListening ? stopListening : startListening} className={`p-3 rounded-full transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                    <MicIcon className="w-6 h-6 text-zinc-200" />
                </button>
                <button onClick={handleSendMessage} disabled={isLoading} className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-500 transition">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </Card>
    );
};

export default FileAssistantModule;