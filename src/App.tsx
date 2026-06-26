import React, { useState } from 'react';
import { LayoutDashboard, FileText, CheckCircle2, UserCircle, Settings, ListTodo } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TaskManagement } from './components/TaskManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './context/AppContext';
import { PersonalityTest } from './components/PersonalityTest';
import { AvatarSelector } from './components/AvatarSelector';
import { PetNotification } from './components/PetNotification';
import { PomodoroTimer } from './components/PomodoroTimer';
import { CompanionDisplay } from './components/CompanionDisplay';

import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { profile, panicMode, setPanicMode, mood } = useAppContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);

  if (!profile) {
    return <PersonalityTest />;
  }

  let statusTitle = 'Secure';
  let statusDesc = `Ready for operations. Companion bond at ${profile.pets?.find(p => p.id === profile.activePetId)?.bond || 0}%.`;
  let statusColor = 'bg-brut-green';
  let statusTextColor = 'text-white';

  if (mood === 'High Energy & Focused') {
    statusTitle = 'READY';
    statusDesc = 'Companion is energized.';
    statusColor = 'bg-green-400';
  } else if (mood === 'Medium Energy') {
    statusTitle = 'STABLE';
    statusDesc = 'Progress is steady.';
    statusColor = 'bg-blue-400';
  } else if (mood === 'Easily Distracted') {
    statusTitle = 'FOCUS NEEDED';
    statusDesc = 'Distractions detected.';
    statusColor = 'bg-orange-400';
  } else if (mood === 'Overwhelmed & Low') {
    statusTitle = 'SUPPORT MODE';
    statusDesc = 'Small steps recommended.';
    statusColor = 'bg-purple-400';
  }

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 gap-8 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Nav Header */}
      <header className="flex justify-between items-center bg-brut-surface border-4 border-brut-border p-4 md:px-8 shadow-[8px_8px_0_var(--color-brut-border)] shrink-0">
        <div className="font-display text-4xl flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
          PANIC PROOF
        </div>
        <nav className="flex gap-4 md:gap-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`font-mono uppercase text-xs md:text-sm font-extrabold underline underline-offset-4 ${
              activeTab === 'dashboard' ? 'text-brut-accent' : 'text-brut-ink hover:text-brut-accent'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`font-mono uppercase text-xs md:text-sm font-extrabold underline underline-offset-4 ${
              activeTab === 'tasks' ? 'text-brut-accent' : 'text-brut-ink hover:text-brut-accent'
            }`}
          >
            Task Queue
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 min-h-0">
        <main className="flex flex-col gap-10 overflow-y-auto pr-4 pb-10">
          <ErrorBoundary>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'tasks' && <TaskManagement />}
          </ErrorBoundary>
        </main>

        <aside className="hidden lg:flex flex-col gap-8 shrink-0 overflow-y-auto pb-10">
          <motion.div 
            className={`brut-box ${statusColor} ${statusTextColor} p-6 md:p-8 transition-colors duration-500`}
            layout
          >
            <span className={`font-mono ${statusTextColor === 'text-white' ? 'bg-white text-black' : 'bg-black text-white'} px-3 py-1 text-xs inline-block mb-4 uppercase transition-colors duration-500`}>System Status</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={statusTitle}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-extrabold my-2 uppercase">{statusTitle}</div>
                <p className="text-sm font-semibold">{statusDesc}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <CompanionDisplay onOpenSelector={() => setIsAvatarSelectorOpen(true)} />

          <PomodoroTimer />

          <button 
            onClick={() => { setPanicMode(!panicMode); setActiveTab('dashboard'); }}
            className={`text-white text-2xl p-8 text-center font-mono border-4 border-brut-border cursor-pointer hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_var(--color-brut-border)] transition-all uppercase font-extrabold active:translate-y-2 active:translate-x-2 active:shadow-none ${panicMode ? 'bg-red-600 shadow-[4px_4px_0_var(--color-brut-border)] translate-x-1 translate-y-1' : 'bg-brut-accent shadow-[8px_8px_0_var(--color-brut-border)]'}`}
          >
            {panicMode ? 'DEACTIVATE PANIC' : 'PANIC BUTTON'}
          </button>
        </aside>
      </div>

      <AvatarSelector 
        isOpen={isAvatarSelectorOpen} 
        onClose={() => setIsAvatarSelectorOpen(false)} 
      />
      <ErrorBoundary>
        <PetNotification />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
