import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModuleType, UserStats, Flashcard } from './types';
import Dashboard from './components/Dashboard';
import QuizModule from './components/QuizModule';
import WritingModule from './components/WritingModule';
import SpeakingModule from './components/SpeakingModule';
import LiveTutor from './components/LiveTutor';
import Flashcards from './components/Flashcards';
import { Home, BookOpen, PenTool, Mic, MessageCircle, Layers, Settings, Menu, X } from 'lucide-react';

// --- Default State ---
const initialStats: UserStats = {
  streak: 0,
  lastLogin: '',
  totalPoints: 0,
  level: 'A2',
  moduleProgress: {
    [ModuleType.KNM]: 0,
    [ModuleType.ONA]: 0,
    [ModuleType.READING]: 0,
    [ModuleType.LISTENING]: 0,
    [ModuleType.WRITING]: 0,
    [ModuleType.SPEAKING]: 0,
    [ModuleType.TUTOR]: 0,
  },
  weakTopics: [],
};

// --- Layout Component ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Layers, label: 'KNM & ONA', path: '/knm' },
    { icon: BookOpen, label: 'Reading', path: '/reading' },
    { icon: PenTool, label: 'Writing', path: '/writing' },
    { icon: Mic, label: 'Speaking', path: '/speaking' },
    { icon: MessageCircle, label: 'AI Tutor', path: '/tutor' },
    { icon: Layers, label: 'Flashcards', path: '/flashcards' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-dutch-blue">
            <div className="w-8 h-8 bg-dutch-orange rounded-lg flex items-center justify-center text-white font-bold text-xl">4</div>
            <span className="text-xl font-bold tracking-tight">Study4</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  window.location.hash = item.path;
                  closeSidebar();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              JS
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">John Student</p>
              <p className="text-xs text-slate-500">A2 Level</p>
            </div>
            <Settings size={16} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 px-4">
             {/* Breadcrumb or Title placeholder */}
             <h1 className="text-lg font-semibold text-slate-800 capitalize">
               {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '')}
             </h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* Gamification bits */}
             <div className="flex items-center text-orange-500 font-bold text-sm bg-orange-50 px-3 py-1 rounded-full">
               🔥 12 Days
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- App Component ---
export default function App() {
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('study4_stats');
    return saved ? JSON.parse(saved) : initialStats;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('study4_flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('study4_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('study4_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const updateProgress = (module: ModuleType, score: number) => {
    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + score,
      moduleProgress: {
        ...prev.moduleProgress,
        [module]: Math.min(100, prev.moduleProgress[module] + (score > 5 ? 5 : 1))
      }
    }));
  };

  const addFlashcard = (front: string, back: string) => {
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front,
      back,
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5
    };
    setFlashcards(prev => [...prev, newCard]);
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard stats={userStats} />} />
          <Route path="/knm" element={<QuizModule type={ModuleType.KNM} onComplete={updateProgress} onAddFlashcard={addFlashcard} />} />
          <Route path="/reading" element={<QuizModule type={ModuleType.READING} onComplete={updateProgress} onAddFlashcard={addFlashcard} />} />
          <Route path="/writing" element={<WritingModule onComplete={updateProgress} />} />
          <Route path="/speaking" element={<SpeakingModule onComplete={updateProgress} />} />
          <Route path="/tutor" element={<LiveTutor />} />
          <Route path="/flashcards" element={<Flashcards cards={flashcards} setCards={setFlashcards} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}