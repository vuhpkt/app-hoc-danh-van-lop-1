import { useState } from 'react';
import { BookOpen, LayoutGrid } from 'lucide-react';
import { KidLearningPage } from './pages/KidLearningPage';
import { AlphabetLearningPage } from './pages/AlphabetLearningPage';

export function App() {
  const [viewMode, setViewMode] = useState<'reader' | 'alphabet'>('reader');

  return (
    <div className="w-full min-h-screen bg-[#F8F6F1] flex flex-col font-sans text-stone-900">
      {/* Top Bar Switcher: Thanh lịch, dịu nhẹ */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200/70 px-3 sm:px-4 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}app-icon.jpg`}
            alt="Logo Đánh Vần Tiếng Việt 1"
            className="w-8 h-8 rounded-xl object-cover shadow-2xs border border-amber-200"
          />
          <span className="font-extrabold text-stone-800 text-xs sm:text-sm tracking-tight hidden md:inline">
            Đánh Vần Tiếng Việt 1
          </span>
        </div>

        {/* Nút chuyển đổi Chế Độ: Bé Đọc SGK | Bảng Chữ Cái & Âm */}
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
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảng Chữ Cái</span>
          </button>
        </div>
      </nav>

      {/* Main View */}
      <main className="flex-1">
        {viewMode === 'reader' && <KidLearningPage />}
        {viewMode === 'alphabet' && <AlphabetLearningPage />}
      </main>
    </div>
  );
}

export default App;
