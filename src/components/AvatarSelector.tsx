import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit2, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from './ui/card';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_PETS = ['🦊', '🐼', '🐯', '🤖', '👻', '🐶', '🐱', '🐰', '🐉', '🦖'];

export function AvatarSelector({ isOpen, onClose }: AvatarSelectorProps) {
  const { profile, setProfile } = useAppContext();
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  if (!profile || !profile.pets) return null;

  const activePet = profile.pets.find(p => p.id === profile.activePetId) || profile.pets[0];

  if (!activePet) return null;

  const handleAddPet = () => {
    if (profile.pets.length >= 3) return;
    const newPet = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Companion',
      type: AVAILABLE_PETS[Math.floor(Math.random() * AVAILABLE_PETS.length)],
      level: 1,
      bond: 0,
      trait: 'General Helper'
    };
    setProfile({
      ...profile,
      pets: [...profile.pets, newPet],
      activePetId: newPet.id
    });
  };

  const handleSaveName = () => {
    if (editingName && tempName.trim()) {
      setProfile({
        ...profile,
        pets: profile.pets.map(p => 
          p.id === editingName ? { ...p, name: tempName.trim() } : p
        )
      });
    }
    setEditingName(null);
  };

  const updateActivePetAppearance = (petType: string) => {
    setProfile({
      ...profile,
      pets: profile.pets.map(p => 
        p.id === profile.activePetId ? { ...p, type: petType } : p
      )
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md relative"
          >
            <Card className="bg-white/90 backdrop-blur-2xl border-white shadow-2xl overflow-hidden">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 flex items-center gap-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10 text-xs font-bold"
              >
                <X className="w-5 h-5" /> CLOSE
              </button>
              
              <CardContent className="p-8 pt-10">
                
                {/* Pet Selection List */}
                <div className="flex justify-center gap-3 mb-6">
                  {profile.pets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => setProfile({ ...profile, activePetId: pet.id })}
                      className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all border-2 ${
                        pet.id === profile.activePetId 
                          ? 'border-blue-500 bg-blue-50 scale-110 shadow-md' 
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {pet.type}
                    </button>
                  ))}
                  {profile.pets.length < 3 && (
                    <button
                      onClick={handleAddPet}
                      className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-slate-50"
                    >
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">ADD</span>
                    </button>
                  )}
                </div>

                <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-5xl mx-auto mb-4 border-4 border-white shadow-lg">
                    {activePet.type}
                  </div>
                  
                  {editingName === activePet.id ? (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="text-xl font-bold text-slate-800 text-center border-b-2 border-blue-500 focus:outline-none bg-transparent w-48 px-2"
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                        <Check className="w-4 h-4" /> SAVE
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 mb-2 group">
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-800">{activePet.name}</h2>
                        <button 
                          onClick={() => { setEditingName(activePet.id); setTempName(activePet.name); }}
                          className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-slate-200"
                        >
                          <Edit2 className="w-3 h-3" /> EDIT
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-slate-500 mb-4">Level {activePet.level} • Bond {activePet.bond}%</p>
                  
                  <div className="mt-2 text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block text-center">Character Trait</label>
                    <select 
                      value={activePet.trait}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          pets: profile.pets.map(p => 
                            p.id === activePet.id ? { ...p, trait: e.target.value } : p
                          )
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="General Helper">General Helper</option>
                      <option value="Prioritize Coding">Prioritize Coding</option>
                      <option value="Prioritize Creative Skills">Prioritize Creative Skills</option>
                      <option value="Prioritize Admin/Emails">Prioritize Admin/Emails</option>
                      <option value="Prioritize Fitness/Health">Prioritize Fitness/Health</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Change Appearance</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {AVAILABLE_PETS.map(pet => (
                        <button
                          key={pet}
                          onClick={() => updateActivePetAppearance(pet)}
                          className={`aspect-square text-2xl flex items-center justify-center rounded-xl border-2 transition-all ${
                            activePet.type === pet 
                              ? 'border-blue-500 bg-blue-50 shadow-sm scale-105' 
                              : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          {pet}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
