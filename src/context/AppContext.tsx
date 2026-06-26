import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, Task } from '../types';

export type Mood = 'High Energy & Focused' | 'Medium Energy' | 'Easily Distracted' | 'Overwhelmed & Low';

interface AppContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'status' | 'priorityScore' | 'risk'>) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  panicMode: boolean;
  setPanicMode: (mode: boolean) => void;
  mood: Mood | null;
  setMood: (mood: Mood | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ls_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.pets) {
          // Migrate old profile
          return {
            primaryType: parsed.primaryType,
            secondaryType: parsed.secondaryType,
            pets: [{
              id: 'pet-1',
              name: 'My Companion',
              type: parsed.petType || '🦊',
              level: parsed.petLevel || 1,
              bond: parsed.petBond || 50,
              trait: 'General Helper'
            }],
            activePetId: 'pet-1'
          } as UserProfile;
        } else if (parsed && parsed.pets) {
          // Add default trait to existing pets
          parsed.pets = parsed.pets.map((p: any) => ({
            ...p,
            trait: p.trait || 'General Helper'
          }));
        }
        return parsed;
      }
    } catch(e) {}
    return null;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('ls_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [
      { id: '1', title: 'Finalize Q3 Marketing Budget', deadline: new Date(Date.now() + 86400000).toISOString(), estTime: 90, risk: 'High', type: 'Analytical', status: 'pending', priorityScore: 90 },
      { id: '2', title: 'Review PR #442', deadline: new Date(Date.now() + 172800000).toISOString(), estTime: 20, risk: 'Medium', type: 'Development', status: 'pending', priorityScore: 50 },
      { id: '3', title: 'Email Sarah regarding designs', deadline: new Date(Date.now() + 259200000).toISOString(), estTime: 5, risk: 'Low', type: 'Communication', status: 'pending', priorityScore: 10 },
    ];
  });

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    try {
      localStorage.setItem('ls_profile', JSON.stringify(newProfile));
    } catch(e) {
      console.warn('localStorage not available', e);
    }
  };

  // Sync tasks
  React.useEffect(() => {
    try {
      localStorage.setItem('ls_tasks', JSON.stringify(tasks));
    } catch(e) {
      console.warn('localStorage not available', e);
    }
  }, [tasks]);

  const calculatePriority = (taskInput: Partial<Task>) => {
    let score = 50;
    
    // Urgency based on deadline
    if (taskInput.deadline) {
      const timeDiff = new Date(taskInput.deadline).getTime() - Date.now();
      if (!isNaN(timeDiff)) {
        const daysUntil = timeDiff / (1000 * 3600 * 24);
        if (daysUntil < 1) score += 40;
        else if (daysUntil < 3) score += 20;
      }
    }
    
    // Personality based adjustment
    if (profile) {
      const activePet = profile.pets?.find(p => p.id === (taskInput.petId || profile.activePetId));
      if (activePet) {
        const isCoding = activePet.trait === 'Prioritize Coding' && taskInput.type === 'Development';
        const isCreative = activePet.trait === 'Prioritize Creative Skills' && taskInput.type === 'Creative';
        const isAdmin = activePet.trait === 'Prioritize Admin/Emails' && taskInput.type === 'Communication';
        
        if (isCoding || isCreative || isAdmin) {
          score += 25;
        }
      }
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const addTask = (taskInput: Omit<Task, 'id' | 'status' | 'priorityScore' | 'risk'>) => {
    const priorityScore = calculatePriority(taskInput);
    const risk = priorityScore > 80 ? 'High' : priorityScore > 50 ? 'Medium' : 'Low';
    
    const newTask: Task = {
      ...taskInput,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      priorityScore,
      risk
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, ...updates };
        updatedTask.priorityScore = calculatePriority(updatedTask);
        updatedTask.risk = updatedTask.priorityScore > 80 ? 'High' : updatedTask.priorityScore > 50 ? 'Medium' : 'Low';
        return updatedTask;
      }
      return t;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t));
    
    if (profile) {
      const targetPetId = task.petId || profile.activePetId;
      setProfile({
        ...profile,
        pets: profile.pets?.map(pet => {
          if (pet.id === targetPetId) {
            const newBond = Math.min(100, pet.bond + 5);
            const newLevel = newBond >= 90 ? pet.level + 1 : pet.level;
            return { ...pet, bond: newBond, level: newLevel };
          }
          return pet;
        }) || []
      });
    }
  };

const [panicMode, setPanicMode] = useState(false);
const [mood, setMood] = useState<Mood | null>(null);

  return (
    <AppContext.Provider value={{ profile, setProfile, tasks, setTasks, addTask, updateTask, deleteTask, completeTask, panicMode, setPanicMode, mood, setMood }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
