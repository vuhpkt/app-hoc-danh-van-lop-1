import { useState } from 'react';
import { SlidersHorizontal, BookOpen, Sparkles } from 'lucide-react';
import { Playground } from './pages/Playground';
import { KidLearningPage } from './pages/KidLearningPage';
import { AlphabetLearningPage } from './pages/AlphabetLearningPage';

export function App() {
  const [viewMode, setViewMode] = useState<'reader' | 'alphabet' | 'lab'>('reader');

  return (
    <div className="w-full min-h-screen bg-[#F8F6F1] flex flex-col font-sans text-stone-900">
      {/* Top Bar Switcher: Thanh lịch, dịu nhẹ */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200/70 px-3 sm:px-4 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xs shadow-2xs">
            TV1
          </div>
          <span className="font-extrabold text-stone-800 text-xs sm:text-sm tracking-tight hidden md:inline">
            Đánh Vần Tiếng Việt 1
          </span>
        </div>

        {/* Nút chuyển đổi 3 Chế Độ: Bé Đọc SGK | Bảng Chữ Cái & Âm | Phòng Thử Nghiệm */}
        <div className="flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200/70 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('reader')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'reader'
                ? 'bg-white text-stone-900 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Bé Đọc</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('alphabet')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'alphabet'
                ? 'bg-white text-emerald-800 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảng Chữ Cái</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lab')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'lab'
                ? 'bg-white text-blue-700 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thử Nghiệm</span>
            <span className="sm:hidden">Lab</span>
          </button>
        </div>
      </nav>

      {/* Main View */}
      <main className="flex-1">
        {viewMode === 'reader' && <KidLearningPage />}
        {viewMode === 'alphabet' && <AlphabetLearningPage />}
        {viewMode === 'lab' && <Playground />}
      </main>
    </div>
  );
}

export default App;
