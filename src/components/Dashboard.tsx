import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, Clock, TrendingUp, CheckCircle2, ChevronRight, Activity, CalendarDays, BrainCircuit, Plus, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { startOfWeek, subWeeks, isSameWeek, getDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useAppContext } from '../context/AppContext';

export function Dashboard() {
  const { profile, setProfile, tasks, completeTask, panicMode, setPanicMode, mood, setMood, updateTask } = useAppContext();
  const [aiScheduleData, setAiScheduleData] = useState<{ orderedTaskIds: string[], explanation: string } | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  
  // Time Window State
  const [timeWindowInput, setTimeWindowInput] = useState<string>('');
  const [matchedTimeTask, setMatchedTimeTask] = useState<any | 'NONE' | null>(null);

  const handleTimeMatch = () => {
    const mins = parseInt(timeWindowInput, 10);
    if (isNaN(mins) || mins <= 0) {
      alert("Please enter a valid number of minutes.");
      return;
    }
    const fitting = pendingTasks.filter(t => (t.estTime || 0) > 0 && t.estTime <= mins);
    if (fitting.length > 0) {
      // Pick highest priority task that fits the time window
      const sorted = [...fitting].sort((a, b) => b.priorityScore - a.priorityScore);
      setMatchedTimeTask(sorted[0]);
    } else {
      setMatchedTimeTask('NONE');
    }
  };

  const getDeadlineDisplay = (deadline: string | undefined) => {
    if (!deadline) return null;
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (isNaN(diffMs)) return null;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    if (diffMs < 0) return { text: "Overdue", color: "bg-red-500 text-white" };
    if (diffDays === 0) return { text: `Due in ${Math.max(0, diffHours)}h`, color: "bg-amber-400 text-black" };
    return { text: `Due in ${diffDays}d`, color: "bg-brut-bg text-black" };
  };

  const pendingTasks = useMemo(() => {
    let list = tasks.filter(t => t.status === 'pending');
    
    // Dynamic sorting based on profile
    if (panicMode) {
      // In panic mode, only show the absolute most important/high risk
      list = list.filter(t => t.risk === 'High' || t.priorityScore > 80);
    } else if (aiScheduleData) {
      list.sort((a, b) => {
        const indexA = aiScheduleData.orderedTaskIds.indexOf(a.id);
        const indexB = aiScheduleData.orderedTaskIds.indexOf(b.id);
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;
        return posA - posB;
      });
    } else if (profile) {
      list.sort((a, b) => {
        // Simple logic: Structured Planner -> Sort by deadline/risk
        // Immediate Executor -> Sort by shortest time first
        // Overthinker -> Sort by easiest (shortest) first
        if (profile.primaryType === 'Immediate Executor' || profile.primaryType === 'Overthinker') {
          return (a.estTime || 0) - (b.estTime || 0);
        }
        if (profile.primaryType === 'Pressure Performer' || profile.primaryType === 'Chronic Procrastinator') {
           // Sort by highest risk first
           const riskWeight: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
           return (riskWeight[b.risk || 'Low'] || 0) - (riskWeight[a.risk || 'Low'] || 0);
        }
        // Default sort by priority score
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      });
    }
    return list;
  }, [tasks, panicMode, profile, aiScheduleData]);

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const nextAction = pendingTasks.length > 0 ? pendingTasks[0] : null;

  const weeklyChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const previousWeekStart = startOfWeek(subWeeks(now, 1));

    const data = days.map((day, index) => ({
      name: day,
      currentWeek: 0,
      previousWeek: 0
    }));

    tasks.filter(t => t.status === 'completed' && t.completedAt).forEach(task => {
      const completedDate = new Date(task.completedAt!);
      const dayIndex = getDay(completedDate);
      
      if (isSameWeek(completedDate, currentWeekStart)) {
        data[dayIndex].currentWeek += 1;
      } else if (isSameWeek(completedDate, previousWeekStart)) {
        data[dayIndex].previousWeek += 1;
      }
    });

    // Mock some data if no tasks are completed yet so the chart isn't completely empty
    const hasData = data.some(d => d.currentWeek > 0 || d.previousWeek > 0);
    if (!hasData) {
      return [
        { name: 'Sun', currentWeek: 0, previousWeek: 2 },
        { name: 'Mon', currentWeek: 3, previousWeek: 4 },
        { name: 'Tue', currentWeek: 1, previousWeek: 3 },
        { name: 'Wed', currentWeek: 5, previousWeek: 2 },
        { name: 'Thu', currentWeek: 2, previousWeek: 5 },
        { name: 'Fri', currentWeek: 4, previousWeek: 1 },
        { name: 'Sat', currentWeek: 0, previousWeek: 0 },
      ];
    }

    return data;
  }, [tasks]);

  const handleAISchedule = async () => {
    if (pendingTasks.length === 0) return;
    setIsAILoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/tasks/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: pendingTasks, profile, mood })
      });
      if (!res.ok) throw new Error("Failed to get AI schedule. Please try again.");
      const data = await res.json();
      setAiScheduleData(data);
    } catch (error: any) {
      setAiError(error.message || "Something went wrong.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!nextAction) return;
    setIsBreakdownLoading(true);
    setBreakdownError(null);
    try {
      const res = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: nextAction })
      });
      if (!res.ok) throw new Error("Failed to break down task.");
      const data = await res.json();
      const subtasks = data.subtasks.map((st: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: st.title,
        completed: false
      }));
      updateTask(nextAction.id, { subtasks });
    } catch (error: any) {
      setBreakdownError(error.message || "Something went wrong.");
    } finally {
      setIsBreakdownLoading(false);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const newSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask(taskId, { subtasks: newSubtasks });
  };

  const handleAddSubtask = (taskId: string) => {
    const title = prompt("Enter new step:");
    if (!title) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSubtasks = [...(task.subtasks || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }];
    updateTask(taskId, { subtasks: newSubtasks });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Mood Entry Section */}
      <section>
        <span className="font-mono bg-brut-ink text-white px-3 py-1 text-xs inline-block mb-4 uppercase">01 // MOOD_ENGINE</span>
        <h1 className="font-display text-5xl md:text-7xl leading-none mb-8 -rotate-1">How are you feeling right now?</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['High Energy & Focused', 'Medium Energy', 'Easily Distracted', 'Overwhelmed & Low'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`brut-box p-6 font-extrabold text-center cursor-pointer transition-all ${
                mood === m 
                  ? 'bg-brut-ink text-white translate-x-[2px] translate-y-[2px] shadow-[4px_4px_0_var(--color-brut-border)]' 
                  : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_var(--color-brut-border)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Main Action Area */}
      <section className="bg-white border-4 border-brut-border p-6 md:p-12 shadow-[12px_12px_0_var(--color-brut-accent)]">
        <span className="font-mono bg-brut-accent text-white px-3 py-1 text-xs inline-block mb-4 uppercase">Recommended Action</span>
        <h2 className="font-display text-4xl md:text-6xl mb-4">
          {nextAction ? nextAction.title : 'Take a deep breath. You are caught up.'}
        </h2>
        <p className="font-semibold text-lg md:text-xl mb-8">
          {mood === 'Overwhelmed & Low'
            ? 'You are feeling overwhelmed. Let\'s ignore the rest of the list for now. Just focus on this one piece.'
            : 'You have good energy. Let\'s tackle this task before it drains you.'}
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            className="brut-btn px-6 py-4 md:px-10 md:py-6 bg-brut-accent text-white text-sm md:text-base"
            onClick={() => nextAction && completeTask(nextAction.id)}
            disabled={!nextAction}
          >
            Mark Completed
          </button>
          {!nextAction?.subtasks || nextAction.subtasks.length === 0 ? (
            <button 
              className="brut-btn bg-white text-brut-ink px-6 py-4 md:px-10 md:py-6 text-sm md:text-base flex items-center gap-2" 
              disabled={!nextAction || isBreakdownLoading}
              onClick={handleBreakdown}
            >
              {isBreakdownLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />} Break it down
            </button>
          ) : null}
        </div>
        {breakdownError && <p className="text-red-500 font-bold mt-4">Error: {breakdownError}</p>}
        
        {nextAction?.subtasks && nextAction.subtasks.length > 0 && (
          <div className="mt-8 border-t-4 border-brut-border pt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-2xl">Smaller Steps</h3>
              <div className="font-mono text-sm font-bold bg-brut-bg px-2 py-1">
                {nextAction.subtasks.filter(s => s.completed).length} / {nextAction.subtasks.length}
              </div>
            </div>
            
            <div className="w-full bg-brut-bg h-4 mb-6 border-2 border-brut-border">
              <div 
                className="bg-brut-green h-full transition-all duration-500"
                style={{ width: `${(nextAction.subtasks.filter(s => s.completed).length / nextAction.subtasks.length) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {nextAction.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 bg-white p-3 border-2 border-brut-border">
                  <button 
                    onClick={() => handleToggleSubtask(nextAction.id, st.id)}
                    className={`w-6 h-6 flex-shrink-0 border-2 border-brut-border flex items-center justify-center cursor-pointer transition-colors ${st.completed ? 'bg-brut-green' : 'bg-white hover:bg-slate-100'}`}
                  >
                    {st.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`font-semibold ${st.completed ? 'line-through text-slate-400' : ''}`}>{st.title}</span>
                </div>
              ))}
              <button 
                onClick={() => handleAddSubtask(nextAction.id)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-brut-border text-slate-500 hover:text-brut-ink hover:border-brut-ink hover:bg-slate-50 transition-colors font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Dynamic Queue - Panic Mode */}
      <AnimatePresence>
        {panicMode && (
          <motion.section 
            key="panic"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="brut-box border-rose-500 shadow-[8px_8px_0_#f43f5e] bg-rose-50 p-6 md:p-8 mt-4">
              <div className="flex items-center gap-2 text-rose-600 mb-2 font-mono uppercase font-bold text-xl">
                <ShieldAlert className="w-6 h-6" />
                Emergency Rescue Protocol
              </div>
              <p className="font-semibold text-rose-800">
                We've temporarily hidden all non-essential tasks. Focus only on the absolute minimum.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Time Window Matcher */}
      <section className="bg-brut-accent text-white border-4 border-brut-border p-6 md:p-8 shadow-[8px_8px_0_var(--color-brut-border)]">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-1/2">
            <span className="font-mono bg-brut-ink text-white px-3 py-1 text-xs inline-block mb-2 uppercase">Time Window Matcher</span>
            <h2 className="font-display text-3xl md:text-4xl mb-2 text-white">Got a few minutes?</h2>
            <p className="font-semibold text-white/90 mb-4">Tell us how much free time you have, and we'll find a task you can knock out.</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                className="brut-input bg-white text-brut-ink flex-1" 
                placeholder="Minutes (e.g. 15)" 
                value={timeWindowInput}
                onChange={(e) => setTimeWindowInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTimeMatch()}
              />
              <button className="brut-btn bg-brut-ink text-white hover:bg-slate-800" onClick={handleTimeMatch}>
                Find Task
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 h-full min-h-[160px] flex">
            {matchedTimeTask === 'NONE' && (
              <div className="bg-brut-ink/20 border-2 border-brut-ink/40 p-4 w-full h-full flex flex-col items-center justify-center text-center text-white">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-bold text-lg">No tasks fit in this window!</p>
                <p className="text-sm opacity-80 mt-1">Maybe break a task down or take a break.</p>
              </div>
            )}
            
            {matchedTimeTask && matchedTimeTask !== 'NONE' && (
              <div className="bg-white text-brut-ink border-4 border-brut-border p-5 shadow-[4px_4px_0_var(--color-brut-border)] w-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-display text-xl font-bold line-clamp-1">{matchedTimeTask.title}</h3>
                    <span className="font-mono font-bold bg-brut-accent text-white px-2 py-0.5 text-xs whitespace-nowrap">{matchedTimeTask.estTime}m</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 line-clamp-2 mb-4">{matchedTimeTask.description || 'Quick win!'}</p>
                </div>
                <button 
                  className="w-full border-2 border-brut-border bg-brut-green text-white font-bold py-2 hover:bg-green-600 transition-colors uppercase text-sm"
                  onClick={() => {
                    completeTask(matchedTimeTask.id);
                    setMatchedTimeTask(null);
                    setTimeWindowInput('');
                  }}
                >
                  Mark Completed
                </button>
              </div>
            )}
            
            {!matchedTimeTask && (
              <div className="bg-brut-ink/10 border-2 border-dashed border-brut-ink/30 p-4 w-full h-full flex flex-col items-center justify-center text-center text-white/70">
                <Zap className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-bold">Your quick-win task will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Analytics Widget */}
      <section className="bg-white border-4 border-brut-border p-6 md:p-8 shadow-[8px_8px_0_var(--color-brut-border)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="font-mono bg-brut-green text-white px-3 py-1 text-xs inline-block mb-2 uppercase">Analytics</span>
            <h2 className="font-display text-3xl md:text-4xl flex items-center gap-2">
              <BarChart2 className="w-8 h-8 text-brut-green" />
              Weekly Velocity
            </h2>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 12, fill: '#0f172a'}} />
              <YAxis axisLine={true} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 12, fill: '#0f172a'}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ border: '2px solid #0f172a', borderRadius: '0', boxShadow: '4px 4px 0 #0f172a', fontFamily: 'monospace', fontWeight: 'bold' }} 
              />
              <Legend wrapperStyle={{fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', paddingTop: '10px'}} />
              <Bar dataKey="previousWeek" name="Last Week" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="currentWeek" name="This Week" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Task List */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="font-display text-4xl md:text-5xl">Pending Queue</h2>
          <button 
            onClick={handleAISchedule} 
            disabled={isAILoading || pendingTasks.length < 2}
            className="brut-btn px-6 py-4 bg-brut-blue text-white flex items-center justify-center gap-2"
          >
            {isAILoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isAILoading ? 'Optimizing...' : 'AI Schedule'}
          </button>
        </div>

        {aiError && (
          <div className="brut-box bg-red-50 text-red-600 p-4 mb-8 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> {aiError}
          </div>
        )}

        {aiScheduleData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="brut-box bg-blue-50 text-blue-900 p-6 mb-8"
          >
            <div className="flex gap-3">
              <Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-600" />
              <div>
                <span className="font-mono font-bold block mb-2 uppercase text-xs">AI Recommendation</span>
                <p className="font-semibold">{aiScheduleData.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {pendingTasks.map((task) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={task.id}
              >
                <div className={`brut-box p-4 md:p-6 flex items-center gap-4 md:gap-6 ${task.id === nextAction?.id ? 'border-brut-blue shadow-[8px_8px_0_var(--color-brut-blue)]' : ''}`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                    className="brut-btn px-3 py-2 md:px-4 md:py-3 border-4 border-brut-border flex items-center justify-center hover:bg-brut-accent hover:text-white transition-colors bg-white flex-shrink-0 cursor-pointer text-xs md:text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> DONE
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-extrabold text-lg md:text-xl truncate ${task.id === nextAction?.id ? 'text-brut-blue' : ''}`}>
                        {task.title}
                      </h4>
                      {task.petId && profile?.pets?.find(p => p.id === task.petId) && (
                        <span className="font-mono text-[0.65rem] uppercase bg-brut-bg px-2 py-1 border-2 border-brut-border whitespace-nowrap hidden sm:block">
                          {profile.pets?.find(p => p.id === task.petId)?.type} {profile.pets?.find(p => p.id === task.petId)?.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 font-mono text-[0.7rem] md:text-xs font-bold uppercase">
                      {task.deadline && (() => {
                        const deadlineInfo = getDeadlineDisplay(task.deadline);
                        if (!deadlineInfo) return null;
                        return (
                          <span className={`flex items-center gap-1 border-2 border-brut-border px-2 py-1 bg-white ${deadlineInfo.color}`}>
                            <CalendarDays className="w-3 h-3 md:w-4 md:h-4" /> {deadlineInfo.text}
                          </span>
                        );
                      })()}
                      <span className="flex items-center gap-1 border-2 border-brut-border px-2 py-1 bg-white">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" /> {task.estTime}m
                      </span>
                      <span className="flex items-center gap-1 border-2 border-brut-border px-2 py-1 bg-white">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> {task.type}
                      </span>
                      <span className="flex items-center gap-1 border-2 border-brut-border px-2 py-1" style={{ backgroundColor: task.risk === 'High' ? '#f43f5e' : task.risk === 'Medium' ? '#fbbf24' : '#60a5fa', color: task.risk === 'High' ? 'white' : 'black' }}>
                         Risk: {task.risk || 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingTasks.length === 0 && (
            <div className="p-12 border-4 border-dashed border-brut-border font-mono text-center bg-white/50 font-extrabold text-lg">
              No tasks left. Time to relax! 🦊
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
