import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

export function PetNotification() {
  const { tasks, profile, setProfile } = useAppContext();
  const [activeNotification, setActiveNotification] = useState<{ task: Task, pet: any } | null>(null);
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      for (const task of tasks) {
        if (task.status === 'completed') continue;
        if (!task.deadline) continue;

        const deadlineTime = new Date(task.deadline).getTime();
        const timeDiff = deadlineTime - now;
        
        // Approaching deadline: less than 2 hours (7200000 ms) and hasn't been notified yet
        if (timeDiff > 0 && timeDiff < 7200000 && !notifiedTasks.current.has(task.id)) {
          notifiedTasks.current.add(task.id);
          
          const petId = task.petId || profile.activePetId;
          const pet = profile.pets?.find(p => p.id === petId);
          
          if (pet) {
            setActiveNotification({ task, pet });
            
            // Reduce XP / trust
            const updatedPets = profile.pets?.map(p => {
              if (p.id === pet.id) {
                const newBond = Math.max(0, p.bond - 5);
                // Also drop level if bond drops below certain thresholds? Or just reduce bond.
                // We'll just drop bond.
                return { ...p, bond: newBond };
              }
              return p;
            }) || [];
            
            setProfile({
              ...profile,
              pets: updatedPets
            });
            
            // Trigger native browser notification if permitted
            const notificationTitle = `Deadline Approaching: ${task.title}`;
            const notificationBody = `Due soon! Your companion ${pet.name} is worried. (-5 Trust)`;
            
            try {
              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  try { new Notification(notificationTitle, { body: notificationBody }); } catch(e) {}
                } else if (Notification.permission !== 'denied') {
                  const permPromise = Notification.requestPermission();
                  if (permPromise && typeof permPromise.then === 'function') {
                    permPromise.then(permission => {
                      if (permission === 'granted') {
                        try { new Notification(notificationTitle, { body: notificationBody }); } catch(e) {}
                      }
                    }).catch(e => {
                      // Ignore notification errors
                    });
                  }
                }
              }
            } catch (error) {
              // Ignore native notification errors
            }
            
            // Auto dismiss after 10 seconds
            setTimeout(() => {
              setActiveNotification(null);
            }, 10000);
            
            // Only trigger one notification at a time
            break;
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, profile, setProfile]);

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-6 right-6 z-50 max-w-sm w-full"
        >
          <div className="bg-white border-2 border-red-200 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-800 text-sm">Deadline Approaching!</span>
            </div>
            <div className="p-4 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-3xl shadow-inner border border-slate-200 flex-shrink-0">
                {activeNotification.pet.type}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 mb-1">
                  "Hey! Don't forget about <span className="font-bold">'{activeNotification.task.title}'</span>! Time is running out."
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Due in {(!activeNotification.task.deadline || isNaN(new Date(activeNotification.task.deadline).getTime())) ? 'a bit' : Math.round((new Date(activeNotification.task.deadline).getTime() - Date.now()) / 60000)} minutes.
                </p>
                <div className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded inline-block mt-2">
                  -5 Trust points 😢
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setActiveNotification(null)}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
