
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile } from '../types';
import Card from './GlassCard';
import { MicIcon, VolumeIcon, TutorIcon } from './icons';

interface LiveTutorModuleProps {
  userProfile: UserProfile;
}

interface TranscriptLine {
    sender: 'tutor' | 'user';
    text: string;
}

const LiveTutorModule: React.FC<LiveTutorModuleProps> = ({ userProfile }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startTutor = async () => {
    if (isActive) return;
    setStatus('connecting');
    setIsActive(true);
    setTranscript([{ sender: 'tutor', text: "Hello! I'm your AI study buddy. How can I help you learn today?" }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => [...prev, { sender: 'tutor', text }]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscript(prev => [...prev, { sender: 'user', text }]);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onclose: () => stopTutor(),
          onerror: (e) => console.error("Live Tutor Error:", e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are an encouraging and highly knowledgeable personal tutor for a student named ${userProfile.name}. Your goal is to explain complex concepts simply using analogies. Be concise, interactive, and ask questions to check for understanding. You are currently in a live audio study session.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live Tutor:", err);
      stopTutor();
    }
  };

  const stopTutor = () => {
    setIsActive(false);
    setStatus('idle');
    if (sessionRef.current) {
        sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => { if (isActive) stopTutor(); };
  }, [isActive]);

  return (
    <Card className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg transition-transform ${isActive ? 'scale-110 animate-pulse' : ''}`}>
                <TutorIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
                <h2 className="text-xl font-bold leading-tight">Live AI Tutor</h2>
                <p className="text-xs text-[var(--foreground-muted)] font-bold uppercase tracking-widest">
                    {status === 'idle' ? 'Ready to help' : status.toUpperCase()}
                </p>
            </div>
          </div>
          <button
              onClick={isActive ? stopTutor : startTutor}
              className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg text-sm ${
                  isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[var(--primary)] text-white hover:opacity-90'
              }`}
          >
              {status === 'connecting' ? <div className="loader !w-4 !h-4 !border-white"></div> : isActive ? <VolumeIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
              {status === 'idle' ? 'Start Voice' : isActive ? 'End Session' : 'Connecting'}
          </button>
      </div>

      <div className="flex-grow bg-[var(--primary)]/5 rounded-2xl p-4 overflow-y-auto mb-4 border border-[var(--input-border)] min-h-0">
        <div className="space-y-4">
            {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--foreground-muted)] py-20">
                    <TutorIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="italic text-sm">Tap "Start Voice" to begin your interactive study session.</p>
                </div>
            ) : (
                transcript.map((line, i) => (
                    <div key={i} className={`flex items-start gap-3 ${line.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {line.sender === 'tutor' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">SB</div>
                        )}
                        <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            line.sender === 'user' 
                            ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                            : 'bg-[var(--input-bg)] text-[var(--foreground)] rounded-tl-none border border-[var(--card-border)]'
                        }`}>
                            {line.text}
                        </div>
                    </div>
                ))
            )}
            <div ref={transcriptEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 flex justify-center">
         <div className="flex items-center gap-6 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
            <span className={status === 'listening' ? 'text-[var(--primary)] animate-pulse' : ''}>Mic Active</span>
            <div className="w-px h-3 bg-[var(--card-border)]"></div>
            <span className={status === 'speaking' ? 'text-[var(--accent)] animate-pulse' : ''}>Tutor Speaking</span>
         </div>
      </div>
    </Card>
  );
};

export default LiveTutorModule;
