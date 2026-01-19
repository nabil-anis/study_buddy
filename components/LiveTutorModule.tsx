
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
    setTranscript([{ sender: 'tutor', text: "Ready to study together? I'm listening." }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // CRITICAL: Ensure AudioContext is resumed (browser safety)
      if (outputCtx.state === 'suspended') await outputCtx.resume();
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
          onerror: (e) => {
            console.error("Live Tutor Error:", e);
            stopTutor();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `Explain complex concepts simply to ${userProfile.name}. Be concise and interactive.`,
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

  return (
    <Card className="h-full flex flex-col p-6 items-center justify-center min-h-[500px] lg:min-h-0 overflow-hidden relative">
      <div className="flex-grow flex flex-col items-center justify-center gap-10 w-full max-w-lg">
        {/* Main Voice Focus Orb */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-[var(--primary)] rounded-full blur-[40px] transition-all duration-1000 ${isActive ? 'opacity-30 scale-150 animate-pulse' : 'opacity-0 scale-100'}`}></div>
          <button
            onClick={isActive ? stopTutor : startTutor}
            className={`relative w-40 h-40 lg:w-48 lg:h-48 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-2xl z-10 
              ${isActive ? 'bg-white dark:bg-zinc-800 scale-105' : 'bg-[var(--primary)] hover:scale-105'}
            `}
          >
            {status === 'connecting' ? (
              <div className="loader !w-10 !h-10 !border-[var(--primary)]"></div>
            ) : (
              <>
                {isActive ? (
                  <div className="flex flex-col items-center">
                    <VolumeIcon className={`w-12 h-12 lg:w-16 lg:h-16 ${status === 'speaking' ? 'text-[var(--accent)] animate-bounce' : 'text-[var(--primary)]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-[var(--foreground)] opacity-40">Tap to End</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <MicIcon className="w-12 h-12 lg:w-16 lg:h-16" strokeWidth={1.5} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] mt-4">Start Tutor</span>
                  </div>
                )}
              </>
            )}
          </button>
        </div>

        {/* Live Status Text */}
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tighter mb-2">
            {status === 'idle' ? 'Voice Tutor' : status.charAt(0).toUpperCase() + status.slice(1)}
          </h2>
          <p className="text-[var(--foreground-muted)] text-sm lg:text-[15px] font-medium max-w-xs mx-auto">
            {status === 'idle' ? 'Tap the orb to start a natural voice conversation about your studies.' : 'Speak clearly into your microphone.'}
          </p>
        </div>

        {/* Mini Transcript View */}
        {transcript.length > 0 && (
          <div className="w-full bg-[var(--foreground)]/[0.03] rounded-3xl p-6 border border-[var(--card-border)] max-h-40 overflow-y-auto">
             {transcript.slice(-2).map((line, i) => (
                <div key={i} className={`mb-3 animate-fade-in ${line.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${line.sender === 'user' ? 'text-[var(--primary)]' : 'text-[var(--accent)]'}`}>
                    {line.sender}
                  </p>
                  <p className="text-sm font-medium leading-relaxed opacity-80">{line.text}</p>
                </div>
             ))}
             <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Floating Indicators */}
      {isActive && (
        <div className="absolute bottom-8 flex gap-6 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-xl">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Listening</span>
           </div>
           <div className="w-px h-3 bg-white/20"></div>
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'speaking' ? 'bg-[var(--accent)] animate-pulse' : 'bg-zinc-400'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Speaking</span>
           </div>
        </div>
      )}
    </Card>
  );
};

export default LiveTutorModule;
