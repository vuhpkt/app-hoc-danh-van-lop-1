import { useState } from 'react';
import { SlidersHorizontal, BookOpen } from 'lucide-react';
import { Playground } from './pages/Playground';
import { KidLearningPage } from './pages/KidLearningPage';

export function App() {
  const [viewMode, setViewMode] = useState<'kid' | 'lab'>('kid');

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Switcher */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-sm">
            TV1
          </div>
          <span className="font-black text-slate-800 text-sm tracking-tight hidden sm:inline">
            Đánh Vần Tiếng Việt Lớp 1
          </span>
        </div>

        {/* Nút chuyển đổi Màn hình Bé học & Lab kiểm thử */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setViewMode('kid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'kid'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Màn Hình Bé Học</span>
          </button>

          <button
            onClick={() => setViewMode('lab')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'lab'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Phòng Thử Nghiệm (Lab)</span>
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
