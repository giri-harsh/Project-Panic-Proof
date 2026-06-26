import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Plus, Clock, TrendingUp, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

export function TaskManagement() {
  const { tasks, addTask, updateTask, deleteTask, completeTask, profile } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleComplete = (id: string) => {
    // Brutalist confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#000000', '#ffffff', '#22c55e', '#f43f5e', '#3b82f6'],
      shapes: ['square'],
      ticks: 200,
      gravity: 1.2,
      scalar: 1.5,
      disableForReducedMotion: true
    });

    // Screen shake
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    completeTask(id);
  };

  const getLocalDatetimeLocal = (date: Date) => {
    if (isNaN(date.getTime())) {
      const now = new Date();
      return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    title: '',
    estTime: 30,
    type: 'General',
    petId: profile?.activePetId || '',
    deadline: getLocalDatetimeLocal(new Date(Date.now() + 86400000))
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending')
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    let validDeadline = new Date().toISOString();
    try {
      if (formData.deadline) {
        validDeadline = new Date(formData.deadline).toISOString();
      }
    } catch (err) {}

    addTask({
      title: formData.title,
      estTime: formData.estTime,
      type: formData.type,
      deadline: validDeadline,
      petId: formData.petId || profile?.activePetId
    });
    
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId || !formData.title.trim()) return;

    let validDeadline = new Date().toISOString();
    try {
      if (formData.deadline) {
        validDeadline = new Date(formData.deadline).toISOString();
      }
    } catch (err) {}

    updateTask(editingTaskId, {
      title: formData.title,
      estTime: formData.estTime,
      type: formData.type,
      deadline: validDeadline,
      petId: formData.petId
    });

    setEditingTaskId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      estTime: 30,
      type: 'General',
      petId: profile?.activePetId || '',
      deadline: getLocalDatetimeLocal(new Date(Date.now() + 86400000))
    });
  };

  const startEdit = (task: Task) => {
    setFormData({
      title: task.title,
      estTime: task.estTime,
      type: task.type,
      petId: task.petId || profile?.activePetId || '',
      deadline: task.deadline ? getLocalDatetimeLocal(new Date(task.deadline)) : getLocalDatetimeLocal(new Date(Date.now() + 86400000))
    });
    setEditingTaskId(task.id);
    setIsAdding(false);
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

  return (
    <motion.div 
      className="space-y-12 animate-in fade-in duration-700"
      animate={isShaking ? {
        x: [0, -15, 15, -15, 15, -8, 8, -4, 4, 0],
        y: [0, 15, -15, 15, -15, 8, -8, 4, -4, 0],
        rotate: [0, -3, 3, -3, 3, -1, 1, 0],
      } : {}}
      transition={{ duration: 0.4, ease: "linear" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-4xl md:text-5xl">Task Management</h2>
          <p className="font-semibold text-lg mt-2">Manage your tasks, priorities, and companion assignments.</p>
        </div>
        <button onClick={() => { setIsAdding(true); setEditingTaskId(null); resetForm(); }} className="brut-btn px-6 py-4 flex items-center justify-center bg-brut-accent text-white">
          <Plus className="w-5 h-5 mr-2" /> New Task
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || editingTaskId) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="brut-box bg-white p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-3xl">
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingTaskId(null); }} className="brut-btn px-3 py-1 flex items-center bg-white text-xs hover:bg-brut-border hover:text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4 mr-1" /> CLOSE
                </button>
              </div>
              <form onSubmit={editingTaskId ? handleUpdate : handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-mono text-sm font-bold uppercase">Task Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                      placeholder="What needs to be done?" 
                      className="w-full bg-white border-4 border-brut-border p-4 text-lg focus:outline-none focus:ring-4 focus:ring-brut-accent/30"
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-mono text-sm font-bold uppercase">Est. Minutes</label>
                    <input 
                      type="number" 
                      value={formData.estTime}
                      onChange={e => setFormData(f => ({ ...f, estTime: Number(e.target.value) }))}
                      className="w-full bg-white border-4 border-brut-border p-4 text-lg focus:outline-none focus:ring-4 focus:ring-brut-accent/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-sm font-bold uppercase">Category</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-white border-4 border-brut-border p-4 text-lg focus:outline-none focus:ring-4 focus:ring-brut-accent/30 appearance-none"
                    >
                      <option value="General">General</option>
                      <option value="Development">Development</option>
                      <option value="Creative">Creative</option>
                      <option value="Analytical">Analytical</option>
                      <option value="Communication">Communication</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="font-mono text-sm font-bold uppercase">Deadline</label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <input 
                        type="datetime-local" 
                        value={formData.deadline}
                        onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))}
                        className="flex-1 bg-white border-4 border-brut-border p-4 text-lg focus:outline-none focus:ring-4 focus:ring-brut-accent/30"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData(f => ({ ...f, deadline: getLocalDatetimeLocal(new Date(Date.now() + 86400000)) }))} className="border-4 border-brut-border px-4 py-2 font-mono font-bold hover:bg-brut-border hover:text-white transition-colors flex-1">+1d</button>
                        <button type="button" onClick={() => setFormData(f => ({ ...f, deadline: getLocalDatetimeLocal(new Date(Date.now() + 86400000 * 3)) }))} className="border-4 border-brut-border px-4 py-2 font-mono font-bold hover:bg-brut-border hover:text-white transition-colors flex-1">+3d</button>
                        <button type="button" onClick={() => setFormData(f => ({ ...f, deadline: getLocalDatetimeLocal(new Date(Date.now() + 86400000 * 7)) }))} className="border-4 border-brut-border px-4 py-2 font-mono font-bold hover:bg-brut-border hover:text-white transition-colors flex-1">+1w</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="font-mono text-sm font-bold uppercase">Assign to Companion</label>
                    <select 
                      value={formData.petId}
                      onChange={e => setFormData(f => ({ ...f, petId: e.target.value }))}
                      className="w-full bg-white border-4 border-brut-border p-4 text-lg focus:outline-none focus:ring-4 focus:ring-brut-accent/30 appearance-none"
                    >
                      {profile?.pets?.map(p => (
                        <option key={p.id} value={p.id}>{p.type} {p.name} ({p.trait})</option>
                      ))}
                    </select>
                    <p className="text-sm font-semibold mt-2">
                      Completing this task will award XP to the assigned companion. If the task matches the companion's trait, it receives a priority boost.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap justify-end gap-4">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingTaskId(null); }} className="border-4 border-brut-border px-6 py-4 font-mono font-bold uppercase hover:bg-brut-border hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="brut-btn px-6 py-4 bg-brut-green text-white">
                    {editingTaskId ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-6">
        <h3 className="font-display text-4xl mb-6">
          Pending Queue
        </h3>
        
        {pendingTasks.length === 0 ? (
          <div className="p-12 border-4 border-dashed border-brut-border font-mono text-center bg-white/50 font-extrabold text-lg">
            No pending tasks. Time to relax! 🦊
            <div className="mt-4">
              <button onClick={() => setIsAdding(true)} className="underline underline-offset-4 cursor-pointer text-brut-blue">Add your first task</button>
            </div>
          </div>
        ) : (
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
                  <div className="brut-box p-4 md:p-6 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="font-extrabold text-xl md:text-2xl truncate">
                            {task.title}
                          </h4>
                          {task.petId && profile?.pets?.find(p => p.id === task.petId) && (
                            <span className="font-mono text-[0.65rem] uppercase bg-brut-bg px-2 py-1 border-2 border-brut-border whitespace-nowrap">
                              {profile.pets?.find(p => p.id === task.petId)?.type} {profile.pets?.find(p => p.id === task.petId)?.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 font-mono text-[0.7rem] md:text-xs font-bold uppercase">
                          {task.deadline && (() => {
                            const deadlineInfo = getDeadlineDisplay(task.deadline);
                            if (!deadlineInfo) return null;
                            return (
                              <span className={`flex items-center gap-1 border-2 border-brut-border px-2 py-1 ${deadlineInfo.color}`}>
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
                          <span className="flex items-center gap-1 border-2 border-brut-border px-2 py-1 bg-brut-ink text-white">
                            Score: {task.priorityScore}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:flex-shrink-0">
                        <button onClick={() => startEdit(task)} className="brut-btn h-12 px-4 flex items-center bg-white text-sm">
                          <Edit2 className="w-4 h-4 mr-2" /> EDIT
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="brut-btn h-12 px-4 flex items-center bg-white hover:bg-rose-500 hover:text-white text-sm">
                          <Trash2 className="w-4 h-4 mr-2" /> DELETE
                        </button>
                        <button 
                          onClick={() => handleComplete(task.id)}
                          className="brut-btn h-12 px-6 flex items-center bg-brut-green text-white text-sm"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" /> DONE
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {completedTasks.length > 0 && (
        <section className="space-y-4 pt-8 mt-8 border-t-4 border-dashed border-brut-border">
          <h3 className="font-display text-3xl mb-6 flex items-center gap-3 opacity-70">
            <CheckCircle2 className="w-8 h-8 text-brut-green" /> Completed Tasks
          </h3>
          <div className="grid gap-3 opacity-70">
            {completedTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border-4 border-brut-border">
                <span className="line-through font-bold text-lg">{task.title}</span>
                <button onClick={() => deleteTask(task.id)} className="brut-btn px-4 py-2 bg-white hover:bg-rose-500 hover:text-white flex items-center text-sm w-fit">
                  <Trash2 className="w-4 h-4 mr-2" /> DELETE
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
