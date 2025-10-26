import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Card from './GlassCard';
import { askAboutFile, parseFileContent } from '../services/geminiService';
import { useVoice } from '../hooks/useVoice';
import { FileTextIcon, MicIcon, SendIcon, VolumeIcon, VolumeOffIcon } from './icons';

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
    const [isParsing, setIsParsing] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
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

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsParsing(true);
            setFileName(file.name);
            setMessages([]);
            try {
                const text = await parseFileContent(file);
                setFileContent(text);
                setMessages([{ sender: 'ai', text: `I've read "${file.name}". What would you like to know? I'm basically a librarian who doesn't shush you.` }]);
            } catch (error) {
                 console.error("Error parsing file:", error);
                alert("Sorry, I couldn't read that file. Please try a different one.");
                setFileName('');
                setFileContent(null);
            } finally {
                setIsParsing(false);
            }
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
            if (isVoiceEnabled) {
              speak(aiResponse);
            }
        } catch (error) {
            console.error("Error asking about file:", error);
            setMessages([...newMessages, { sender: 'ai', text: "My circuits are a bit fried. Can you ask that again?" }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!fileContent && !isParsing) {
      return (
          <Card className="h-full flex flex-col items-center justify-center text-center">
              <FileTextIcon className="w-16 h-16 text-[#134686] mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-[#134686]">File Chat Assistant</h2>
              <p className="text-[#134686]/80 mb-6 max-w-md">Upload a document (PDF, DOCX, TXT, etc.) and I'll answer your questions about it.</p>
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-[#134686] text-white font-bold rounded-lg hover:bg-[#134686]/90 transition-transform transform hover:scale-105 shadow-lg">
                  Upload a File
              </label>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" />
          </Card>
      );
    }
    
    if (isParsing) {
       return (
          <Card className="h-full flex flex-col items-center justify-center text-center">
              <FileTextIcon className="w-16 h-16 text-[#134686] mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2 text-[#134686]">Reading Your File...</h2>
              <p className="text-[#134686]/80 mb-6 max-w-md">Processing: {fileName}</p>
          </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-center text-[#134686]">Chatting about: <span className="text-[#ED3F27]">{fileName}</span></h3>
            <div ref={chatContainerRef} className="flex-grow bg-[#134686]/5 p-4 rounded-lg overflow-y-auto mb-4 border border-[#134686]/10">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-[#134686] flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                            <div className={`max-w-xs md:max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-[#FEB21A] text-[#134686] rounded-br-none' : 'bg-white text-[#134686] rounded-bl-none shadow'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex items-start gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-[#134686] flex items-center justify-center text-white font-bold flex-shrink-0">A</div>
                         <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white text-[#134686] rounded-bl-none shadow">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[#134686]/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-[#134686]/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-[#134686]/50 rounded-full animate-bounce"></div>
                            </div>
                         </div>
                       </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsVoiceEnabled(v => !v)} className={`p-3 rounded-full transition bg-[#134686]/10 hover:bg-[#134686]/20`}>
                    {isVoiceEnabled ? <VolumeIcon className="w-6 h-6 text-[#134686]" /> : <VolumeOffIcon className="w-6 h-6 text-[#134686]" />}
                </button>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isListening ? 'Listening...' : "Ask a question..."}
                    className="flex-grow px-4 py-3 bg-white/50 rounded-full border border-[#134686]/20 placeholder:text-[#134686]/60 focus:outline-none focus:ring-2 focus:ring-[#134686] text-[#134686]"
                    disabled={isLoading}
                />
                <button onClick={isListening ? stopListening : startListening} className={`p-3 rounded-full transition ${isListening ? 'bg-[#ED3F27] text-white animate-pulse' : 'bg-[#134686]/10 hover:bg-[#134686]/20'}`}>
                    <MicIcon className="w-6 h-6" />
                </button>
                <button onClick={handleSendMessage} disabled={isLoading || !userInput} className="p-3 rounded-full bg-[#134686] text-white hover:bg-[#134686]/90 disabled:bg-[#134686]/60 disabled:opacity-50 transition">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </Card>
    );
};

export default FileAssistantModule;