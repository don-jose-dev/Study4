import React, { useState, useEffect } from 'react';
import { ModuleType, Question } from '../types';
import { generateQuestions } from '../services/geminiService';
import { CheckCircle2, XCircle, RefreshCw, HelpCircle, Plus } from 'lucide-react';

interface Props {
  type: ModuleType;
  onComplete: (module: ModuleType, score: number) => void;
  onAddFlashcard: (front: string, back: string) => void;
}

const QuizModule: React.FC<Props> = ({ type, onComplete, onAddFlashcard }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const loadQuestions = async () => {
    setLoading(true);
    setShowSummary(false);
    setCurrentIndex(0);
    setScore(0);
    setQuestions([]);
    
    // Determine topic based on module (could be random)
    const topic = type === ModuleType.KNM ? 'Dutch History and Geography' : 
                  type === ModuleType.ONA ? 'Job Application and Work Culture' : 'Daily Life Reading';
    
    const newQuestions = await generateQuestions(type, 'A2', topic);
    setQuestions(newQuestions);
    setLoading(false);
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowSummary(true);
      onComplete(type, score);
    }
  };

  const addToFlashcards = () => {
    const q = questions[currentIndex];
    onAddFlashcard(q.text, q.correctAnswer || '');
    // Visual feedback could be added here
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-dutch-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Generating unique questions with AI...</p>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-slate-600 mb-8">You scored {score} out of {questions.length}</p>
        <button 
          onClick={loadQuestions}
          className="w-full flex items-center justify-center space-x-2 bg-dutch-blue text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
        >
          <RefreshCw size={20} />
          <span>Start New Quiz</span>
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-10">
        <p>Failed to load questions. Please try again.</p>
        <button onClick={loadQuestions} className="mt-4 text-dutch-blue underline">Retry</button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-dutch-orange h-full transition-all duration-300"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
               <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold tracking-wide mb-3">
                 QUESTION {currentIndex + 1}/{questions.length}
               </span>
               <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">{currentQ.text}</h2>
               {currentQ.translation && (
                 <p className="text-slate-400 text-sm mt-2 italic">{currentQ.translation}</p>
               )}
            </div>
            <button 
               onClick={addToFlashcards}
               className="p-2 text-slate-400 hover:text-dutch-orange transition-colors"
               title="Add to Flashcards"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {currentQ.options?.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium ";
              
              if (isAnswered) {
                if (option === currentQ.correctAnswer) {
                  btnClass += "border-green-500 bg-green-50 text-green-700";
                } else if (option === selectedOption) {
                  btnClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  btnClass += "border-slate-100 text-slate-400";
                }
              } else {
                btnClass += "border-slate-100 hover:border-dutch-blue/50 hover:bg-slate-50 text-slate-700";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isAnswered && option === currentQ.correctAnswer && <CheckCircle2 size={20} />}
                    {isAnswered && option === selectedOption && option !== currentQ.correctAnswer && <XCircle size={20} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-bottom-5">
            <div className="flex items-start space-x-3 mb-4">
              <HelpCircle className="text-dutch-blue shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Explanation</h4>
                <p className="text-slate-600 text-sm mt-1">{currentQ.explanation}</p>
              </div>
            </div>
            <button
              onClick={nextQuestion}
              className="w-full bg-dutch-blue text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-800 transition-colors"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModule;
