import React, { useEffect, useState, useRef } from 'react';
import { LiveServerMessage } from '@google/genai';
import { connectLiveTutor, pcmToBase64 } from '../services/geminiService';
import { Mic, MicOff, Volume2, Loader2, Info } from 'lucide-react';

const LiveTutor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Gemini Session Ref
  const sessionRef = useRef<any>(null); // Type is complex, keeping any for brevity in this constraint
  const nextStartTimeRef = useRef<number>(0);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    setIsConnected(false);
    setStatus('disconnected');
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  const handleDisconnect = () => {
    cleanup();
  };

  const handleConnect = async () => {
    setStatus('connecting');
    try {
      // 1. Setup Audio Output
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      // 2. Setup Audio Input
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 3. Connect to Gemini
      const onOpen = () => {
        setStatus('connected');
        setIsConnected(true);
        startAudioStream();
      };

      const onMessage = async (message: LiveServerMessage) => {
        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && outputContextRef.current) {
          setIsSpeaking(true);
          const binaryString = atob(base64Audio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
          
          const int16 = new Int16Array(bytes.buffer);
          const buffer = outputContextRef.current.createBuffer(1, int16.length, 24000);
          const channelData = buffer.getChannelData(0);
          for(let i=0; i<int16.length; i++) {
              channelData[i] = int16[i] / 32768.0;
          }

          const source = outputContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(outputContextRef.current.destination);
          
          const currentTime = outputContextRef.current.currentTime;
          const startTime = Math.max(currentTime, nextStartTimeRef.current);
          source.start(startTime);
          nextStartTimeRef.current = startTime + buffer.duration;
          
          source.onended = () => {
              if (outputContextRef.current && outputContextRef.current.currentTime >= nextStartTimeRef.current) {
                  setIsSpeaking(false);
              }
          }
        }

        if (message.serverContent?.interrupted) {
          nextStartTimeRef.current = 0;
          setIsSpeaking(false);
        }
      };

      const onError = (e: any) => {
        console.error("Gemini Error", e);
        setStatus('error');
        cleanup();
      };
      
      const onClose = () => {
          console.log("Session Closed");
          cleanup();
      }

      const sessionPromise = connectLiveTutor(onMessage, onOpen, onClose, onError);
      
      // Store session to send data later
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const startAudioStream = () => {
    if (!inputContextRef.current || !streamRef.current) return;
    
    inputSourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current);
    processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);
    
    processorRef.current.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Simple viz logic
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      setAudioLevel(Math.sqrt(sum / inputData.length));

      // Send to Gemini
      const b64Data = pcmToBase64(inputData);
      if (sessionRef.current) {
        sessionRef.current.then((session: any) => {
           session.sendRealtimeInput({
             media: {
               mimeType: 'audio/pcm;rate=16000',
               data: b64Data
             }
           });
        });
      }
    };

    inputSourceRef.current.connect(processorRef.current);
    processorRef.current.connect(inputContextRef.current.destination); // Required for script processor to run
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 flex-1 flex flex-col items-center justify-center text-white relative overflow-hidden shadow-2xl">
        {/* Abstract Background Animation */}
        {isConnected && (
            <div className="absolute inset-0 opacity-20">
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl transition-all duration-100 ease-linear ${isSpeaking ? 'scale-150' : 'scale-100'}`} />
            </div>
        )}

        <div className="z-10 text-center space-y-8">
            <div className="relative">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-white/20 backdrop-blur-md' : 'bg-white/10'}`}>
                    {status === 'connecting' ? (
                        <Loader2 className="w-12 h-12 animate-spin text-white" />
                    ) : isConnected ? (
                        <div className="relative">
                             <Volume2 size={48} className={isSpeaking ? 'animate-pulse' : ''} />
                             {/* User Voice Viz */}
                             {audioLevel > 0.01 && (
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex space-x-1 h-8 items-end">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-1 bg-green-400 rounded-full transition-all duration-75" style={{ height: `${Math.min(100, audioLevel * 500 * (i+1))}%`}}></div>
                                    ))}
                                </div>
                             )}
                        </div>
                    ) : (
                        <MicOff size={48} className="text-white/50" />
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-bold mb-2">
                    {isConnected ? "AI Tutor is Listening" : "Start Conversation Practice"}
                </h2>
                <p className="text-indigo-100 max-w-md mx-auto">
                    {isConnected 
                        ? "Speak naturally in Dutch. I'm here to help you practice pronunciation and grammar." 
                        : "Connect to start a real-time voice session with your personal AI language coach."}
                </p>
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
         {!isConnected ? (
             <button 
                onClick={handleConnect}
                disabled={status === 'connecting'}
                className="bg-dutch-orange text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-orange-600 hover:scale-105 transition-all flex items-center space-x-3"
             >
                <Mic size={24} />
                <span>Start Session</span>
             </button>
         ) : (
            <button 
                onClick={handleDisconnect}
                className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-red-600 hover:scale-105 transition-all flex items-center space-x-3"
            >
                <MicOff size={24} />
                <span>End Session</span>
            </button>
         )}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-2 text-slate-400 text-xs">
         <Info size={14} />
         <span>Uses Microphone • Standard data rates apply</span>
      </div>
    </div>
  );
};

export default LiveTutor;
