import React, { useState } from 'react';
import { evaluateWriting } from '../services/geminiService';
import { ModuleType } from '../types';
import { Send, RefreshCw, PenLine } from 'lucide-react';

interface Props {
  onComplete: (module: ModuleType, score: number) => void;
}

const tasks = [
  "Write an email to your neighbor explaining that you will have a party on Saturday.",
  "Describe your favorite holiday destination and why you like it.",
  "Write a short motivation letter for a job as a cleaner.",
];

const WritingModule: React.FC<Props> = ({ onComplete }) => {
  const [taskIndex, setTaskIndex] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{score: number, feedback: string, correction: string} | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const evaluation = await evaluateWriting(text, tasks[taskIndex]);
      setResult(evaluation);
      onComplete(ModuleType.WRITING, evaluation.score);
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTask = () => {
    setTaskIndex((prev) => (prev + 1) % tasks.length);
    setResult(null);
    setText('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
           <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
             <PenLine size={24} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-800">Writing Practice</h2>
             <p className="text-sm text-slate-500">Task {taskIndex + 1}</p>
           </div>
        </div>
        
        <p className="text-lg font-medium text-slate-800 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          {tasks[taskIndex]}
        </p>

        {!result ? (
          <div className="space-y-4">
            <textarea
              className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dutch-blue focus:border-transparent resize-none"
              placeholder="Type your answer here in Dutch..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !text}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-white transition-colors ${
                isSubmitting || !text ? 'bg-slate-300' : 'bg-dutch-blue hover:bg-blue-800'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit for AI Review</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Score</p>
                <p className="text-3xl font-bold text-blue-800">{result.score}/10</p>
              </div>
              <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Feedback</p>
                <p className="text-sm text-slate-700">{result.feedback}</p>
              </div>
            </div>

            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Correction</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{result.correction}</p>
            </div>

            <button
              onClick={nextTask}
              className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:border-slate-300 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Next Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingModule;
