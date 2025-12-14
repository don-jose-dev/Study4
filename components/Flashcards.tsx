import React, { useState } from 'react';
import { Flashcard } from '../types';
import { Repeat, Check, X, RotateCcw } from 'lucide-react';

interface Props {
  cards: Flashcard[];
  setCards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
}

const Flashcards: React.FC<Props> = ({ cards, setCards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter cards due for review (simplified logic)
  const dueCards = cards.filter(c => c.nextReview <= Date.now());

  const handleRate = (quality: number) => {
    // Simplified SM-2 Algorithm
    const card = dueCards[currentIndex];
    const newCards = cards.filter(c => c.id !== card.id);
    
    let interval = 1;
    if (quality < 3) {
      interval = 1; // Reset
    } else {
      interval = Math.ceil(card.interval * card.easeFactor);
    }
    
    // Update card
    const updatedCard: Flashcard = {
        ...card,
        interval,
        nextReview: Date.now() + (interval * 24 * 60 * 60 * 1000),
        easeFactor: Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    };

    setCards([...newCards, updatedCard]);
    setIsFlipped(false);
    
    // Move to next if available
    if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
    }
  };

  if (cards.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-96 text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Repeat size={32} className="text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">No Flashcards Yet</h3>
           <p className="text-slate-500 mt-2 max-w-md">
               Practice modules like Reading or KNM to find words you don't know and add them here automatically!
           </p>
        </div>
     );
  }

  if (dueCards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center p-8 bg-green-50 rounded-2xl border border-green-100">
           <h3 className="text-2xl font-bold text-green-800 mb-2">All Caught Up!</h3>
           <p className="text-green-600">You have reviewed all your cards for today.</p>
           <button onClick={() => setCurrentIndex(0)} className="mt-6 text-green-700 underline text-sm">
               Review all cards anyway
           </button>
        </div>
      );
  }

  const currentCard = dueCards[currentIndex];

  if (!currentCard) return null; // Safety

  return (
    <div className="max-w-md mx-auto perspective-1000">
       <div className="mb-6 flex justify-between items-center text-slate-500 text-sm font-medium">
          <span>Reviewing {currentIndex + 1} / {dueCards.length}</span>
          <span>Streak: {Math.round(currentCard.interval)} days</span>
       </div>

       <div 
         className="relative h-80 w-full cursor-pointer group perspective-1000"
         onClick={() => setIsFlipped(!isFlipped)}
       >
          <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
             {/* Front */}
             <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-md border-2 border-slate-100 flex items-center justify-center p-8 text-center">
                 <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dutch</span>
                    <h2 className="text-3xl font-bold text-slate-800">{currentCard.front}</h2>
                 </div>
                 <span className="absolute bottom-4 text-xs text-slate-400">Tap to flip</span>
             </div>

             {/* Back */}
             <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-800 rounded-2xl shadow-md flex items-center justify-center p-8 text-center text-white">
                 <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Answer</span>
                    <h2 className="text-2xl font-medium">{currentCard.back}</h2>
                 </div>
             </div>
          </div>
       </div>

       {isFlipped && (
           <div className="mt-8 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                className="flex flex-col items-center p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                  <X size={20} className="mb-1" />
                  <span className="text-xs font-bold">Hard</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRate(3); }}
                className="flex flex-col items-center p-3 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
              >
                  <RotateCcw size={20} className="mb-1" />
                  <span className="text-xs font-bold">Okay</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRate(5); }}
                className="flex flex-col items-center p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                  <Check size={20} className="mb-1" />
                  <span className="text-xs font-bold">Easy</span>
              </button>
           </div>
       )}
    </div>
  );
};

export default Flashcards;
