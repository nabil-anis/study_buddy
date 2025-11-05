import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Card from './GlassCard';
import { askAboutFile, parseFileContent } from '../services/geminiService';
import { FileTextIcon, SendIcon } from './icons';

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
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [messages, isLoading]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsParsing(true);
            setFileName(file.name);
            setMessages([]);
            setFileContent(null);
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
              <FileTextIcon className="w-16 h-16 text-[var(--primary)] mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">File Chat Assistant</h2>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md">Upload a document (PDF, DOCX, TXT, etc.) and I'll answer your questions about it.</p>
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                  Upload a File
              </label>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" />
          </Card>
      );
    }
    
    if (isParsing) {
       return (
          <Card className="h-full flex flex-col items-center justify-center text-center">
              <div className="loader !w-12 !h-12 !border-4 mb-6"></div>
              <h2 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Reading Your File...</h2>
              <p className="text-[var(--foreground-muted)] max-w-md truncate">Processing: {fileName}</p>
          </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-4 text-center text-[var(--foreground)]">Chatting about: <span className="text-[var(--accent)] truncate">{fileName}</span></h3>
            <div ref={chatContainerRef} className="flex-grow bg-[var(--primary)]/5 p-4 rounded-lg overflow-y-auto mb-4 border border-[var(--input-border)]">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">SB</div>}
                            <div className={`max-w-xs md:max-w-xl p-3 px-4 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-none' : 'bg-[var(--input-bg)] text-[var(--foreground)] rounded-bl-none shadow'}`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex items-start gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">SB</div>
                         <div className="max-w-xs md:max-w-md p-3 px-4 rounded-2xl bg-[var(--input-bg)] text-[var(--foreground)] rounded-bl-none shadow">
                            <div className="flex space-x-1.5">
                                <div className="w-2 h-2 bg-[var(--foreground-muted)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-[var(--foreground-muted)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-[var(--foreground-muted)] rounded-full animate-bounce"></div>
                            </div>
                         </div>
                       </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask a question..."
                      className="w-full pl-4 pr-4 py-3 bg-[var(--input-bg)] rounded-full border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)]"
                      disabled={isLoading}
                  />
                </div>
                <button onClick={handleSendMessage} disabled={isLoading || !userInput} className="p-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-opacity-90 disabled:bg-opacity-60 disabled:cursor-not-allowed transition-transform transform enabled:hover:scale-110">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </Card>
    );
};

export default FileAssistantModule;