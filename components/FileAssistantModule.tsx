
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Card from './GlassCard';
import { askAboutFile, parseFileContent } from '../services/geminiService';
import { FileTextIcon, SendIcon } from './icons';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface FileAssistantModuleProps {
    userProfile: UserProfile;
}

const FileAssistantModule: React.FC<FileAssistantModuleProps> = ({ userProfile }) => {
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

    const saveChatToSupabase = async (updatedMessages: Message[]) => {
        if (supabase && userProfile.id && fileName) {
            // Upsert based on filename for simplicity in this demo
            await supabase.from('file_chats').upsert({
                user_id: userProfile.id,
                file_name: fileName,
                messages: updatedMessages
            }, { onConflict: 'user_id, file_name' });
        }
    };

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
                const initialMsg: Message = { sender: 'ai', text: `I've read "${file.name}". What would you like to know?` };
                setMessages([initialMsg]);
                await saveChatToSupabase([initialMsg]);
            } catch (error) {
                 console.error("Error parsing file:", error);
                alert("Sorry, I couldn't read that file.");
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
            const finalMessages: Message[] = [...newMessages, { sender: 'ai', text: aiResponse }];
            setMessages(finalMessages);
            await saveChatToSupabase(finalMessages);
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">File Chat Assistant</h2>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md">Upload any document and I'll keep our conversation history saved in your account.</p>
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:scale-105 transition shadow-lg">
                  Upload a File
              </label>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx" />
          </Card>
      );
    }
    
    if (isParsing) {
       return (
          <Card className="h-full flex flex-col items-center justify-center text-center">
              <div className="loader !w-12 !h-12 !border-4 mb-6"></div>
              <h2 className="text-2xl font-bold mb-2">Reading Your File...</h2>
              <p className="text-[var(--foreground-muted)] max-w-md truncate">{fileName}</p>
          </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-4 text-center">Chatting about: <span className="text-[var(--accent)]">{fileName}</span></h3>
            <div ref={chatContainerRef} className="flex-grow bg-[var(--primary)]/5 p-4 rounded-lg overflow-y-auto mb-4 border border-[var(--input-border)]">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">SB</div>}
                            <div className={`max-w-xs md:max-w-xl p-3 px-4 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-none' : 'bg-[var(--input-bg)] text-[var(--foreground)] rounded-bl-none shadow'}`}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex items-start gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">SB</div>
                         <div className="max-w-xs md:max-w-md p-3 px-4 rounded-2xl bg-[var(--input-bg)] text-[var(--foreground)] rounded-bl-none shadow"><div className="loader !w-3 !h-3"></div></div>
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
                    placeholder="Ask a question..."
                    className="flex-grow pl-4 pr-4 py-3 bg-[var(--input-bg)] rounded-full border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)]"
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading || !userInput} className="p-3 rounded-full bg-[var(--primary)] text-white hover:scale-110 transition shadow">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </Card>
    );
};

export default FileAssistantModule;
