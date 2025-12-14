import React, { useState, useRef, useEffect } from 'react';
import { evaluateSpeaking, pcmToBase64 } from '../services/geminiService';
import { ModuleType } from '../types';
import { Mic, Square, Play, Award, ChevronRight } from 'lucide-react';

interface Props {
  onComplete: (module: ModuleType, score: number) => void;
}

const questions = [
  "Vertel iets over jezelf. (Tell something about yourself)",
  "Wat doe je in je vrije tijd? (What do you do in your free time?)",
  "Beschrijf je huis. (Describe your house)",
];

const SpeakingModule: React.FC<Props> = ({ onComplete }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{score: number, transcription: string, feedback: string} | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const submitAudio = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
            const evaluation = await evaluateSpeaking(base64String, questions[questionIndex]);
            setResult(evaluation);
            onComplete(ModuleType.SPEAKING, evaluation.score);
        } catch (e) {
            console.error(e);
            alert("Error analyzing audio.");
        } finally {
            setIsProcessing(false);
        }
    };
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="inline-block p-3 bg-dutch-orange/10 text-dutch-orange rounded-full mb-2">
            <Mic size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800">{questions[questionIndex]}</h2>
          <p className="text-slate-500">Record your answer clearly in Dutch.</p>

          {!result ? (
            <div className="flex flex-col items-center space-y-6 mt-8">
              {!audioBlob && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' 
                      : 'bg-dutch-blue text-white hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
                </button>
              )}

              {audioBlob && (
                <div className="w-full space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-center space-x-4">
                    <button 
                       onClick={() => { setAudioBlob(null); setResult(null); }}
                       className="text-slate-400 text-sm hover:text-red-500"
                    >
                        Retake
                    </button>
                    <audio src={URL.createObjectURL(audioBlob)} controls className="h-10 rounded-full" />
                  </div>
                  <button
                    onClick={submitAudio}
                    disabled={isProcessing}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    {isProcessing ? 'Analyzing...' : 'Submit Answer'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-left space-y-6 animate-in slide-in-from-bottom-5">
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-xs font-bold text-slate-500 uppercase">You said:</p>
                 <p className="text-slate-800 italic mt-1">"{result.transcription}"</p>
               </div>
               
               <div className="flex items-center space-x-4">
                 <div className="flex-1 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="flex items-center space-x-2 text-yellow-700 mb-2">
                        <Award size={20} />
                        <span className="font-bold">Score</span>
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{result.score}/10</span>
                 </div>
               </div>

               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2">Feedback</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{result.feedback}</p>
               </div>

               <button
                  onClick={() => {
                      setQuestionIndex((prev) => (prev + 1) % questions.length);
                      setAudioBlob(null);
                      setResult(null);
                  }}
                  className="w-full py-3 flex items-center justify-center space-x-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900"
               >
                   <span>Next Question</span>
                   <ChevronRight size={18} />
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingModule;
