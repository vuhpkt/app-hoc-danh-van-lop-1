import { useState } from 'react';
import { SlidersHorizontal, BookOpen } from 'lucide-react';
import { Playground } from './pages/Playground';
import { KidLearningPage } from './pages/KidLearningPage';

export function App() {
  const [viewMode, setViewMode] = useState<'kid' | 'lab'>('kid');

  return (
    <div className="w-full min-h-screen bg-[#F8F6F1] flex flex-col font-sans text-stone-900">
      {/* Top Bar Switcher: Thanh lịch, dịu nhẹ */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200/70 px-4 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xs shadow-2xs">
            TV1
          </div>
          <span className="font-extrabold text-stone-800 text-xs sm:text-sm tracking-tight hidden sm:inline">
            Đánh Vần Tiếng Việt 1
          </span>
        </div>

        {/* Nút chuyển đổi Màn hình Bé học & Lab kiểm thử */}
        <div className="flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200/70 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('kid')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'kid'
                ? 'bg-white text-stone-900 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Bé Học</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lab')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'lab'
                ? 'bg-white text-blue-700 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phòng Thử Nghiệm</span>
            <span className="sm:hidden">Lab</span>
          </button>
        </div>
      </nav>

      {/* Main View */}
      <main className="flex-1">
        {viewMode === 'kid' ? <KidLearningPage /> : <Playground />}
      </main>
    </div>
  );
}

export default App;
