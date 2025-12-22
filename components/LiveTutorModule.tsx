
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile } from '../types';
import Card from './GlassCard';
import { MicIcon, VolumeIcon, TutorIcon } from './icons';

interface LiveTutorModuleProps {
  userProfile: UserProfile;
}

const LiveTutorModule: React.FC<LiveTutorModuleProps> = ({ userProfile }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

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
    setTranscript(["Tutor: Hello! I'm your AI study buddy. How can I help you learn today?"]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
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
              setTranscript(prev => [...prev.slice(-10), `Tutor: ${message.serverContent!.outputTranscription!.text}`]);
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
        // sessionRef.current.close(); // Not always available, depends on SDK version
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
    <Card className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-xl transition-all duration-500 ${isActive ? 'scale-110' : ''}`}>
           <TutorIcon className="w-16 h-16 text-white" />
        </div>
        {isActive && (
            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] animate-ping opacity-20"></div>
        )}
      </div>

      <h2 className="text-3xl font-bold mb-2">Live AI Tutor</h2>
      <p className="text-[var(--foreground-muted)] mb-8 max-w-md">
        Speak directly with your AI tutor. Ask for explanations, practice problems, or learning tips in real-time.
      </p>

      <div className="w-full max-w-lg bg-black/10 rounded-xl p-4 h-48 overflow-y-auto mb-8 text-left border border-[var(--card-border)]">
        {transcript.length === 0 ? (
            <p className="text-center text-[var(--foreground-muted)] italic mt-16 text-sm">Session transcript will appear here...</p>
        ) : (
            transcript.map((line, i) => (
                <p key={i} className={`mb-2 text-sm ${line.startsWith('Tutor:') ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}`}>
                    {line}
                </p>
            ))
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
            onClick={isActive ? stopTutor : startTutor}
            className={`px-10 py-4 rounded-full font-bold flex items-center gap-3 transition-all transform hover:scale-105 shadow-xl ${
                isActive ? 'bg-red-500 text-white' : 'bg-[var(--primary)] text-white'
            }`}
        >
            {status === 'connecting' ? (
                <div className="loader !w-5 !h-5 !border-white !border-b-transparent"></div>
            ) : isActive ? (
                <VolumeIcon className="w-6 h-6" />
            ) : (
                <MicIcon className="w-6 h-6" />
            )}
            {status === 'idle' && 'Start Voice Session'}
            {status === 'connecting' && 'Connecting...'}
            {status === 'listening' && 'Listening...'}
            {status === 'speaking' && 'Tutor is Speaking'}
        </button>
        <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest font-bold">
            {isActive ? 'Session Active • Click to Stop' : 'Ready to help'}
        </p>
      </div>
    </Card>
  );
};

export default LiveTutorModule;
