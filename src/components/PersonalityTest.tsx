import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { personalityQuestions } from '../data/questions';
import { PersonalityType } from '../types';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { BrainCircuit, ArrowRight } from 'lucide-react';

export function PersonalityTest() {
  const { setProfile } = useAppContext();
  const [currentStep, setCurrentStep] = useState(-1); // -1 is welcome
  const [scores, setScores] = useState<Record<PersonalityType, number>>({
    'Immediate Executor': 0,
    'Structured Planner': 0,
    'Pressure Performer': 0,
    'Overthinker': 0,
    'Chronic Procrastinator': 0,
    'Selective Performer': 0,
    'Hyperfocused Sprinter': 0,
    'Mood-Driven Worker': 0,
  });

  const handleAnswer = (points: { type: PersonalityType; value: number }[]) => {
    setScores(prev => {
      const next = { ...prev };
      points.forEach(p => {
        next[p.type] = (next[p.type] || 0) + p.value;
      });
      return next;
    });
    setCurrentStep(s => s + 1);
  };

  const [selectedPet, setSelectedPet] = useState('🦊');

  const finishTest = () => {
    // calculate primary and secondary
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0] as PersonalityType;
    const secondary = sorted[1][0] as PersonalityType;

    setProfile({
      primaryType: primary,
      secondaryType: secondary,
      pets: [{
        id: 'pet-1',
        name: 'My Companion',
        type: selectedPet,
        level: 1,
        bond: 50,
        trait: 'General Helper'
      }],
      activePetId: 'pet-1'
    });
  };

  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-brut-bg flex flex-col items-center justify-center p-4">
        <div className="brut-box max-w-2xl w-full p-8 md:p-12 text-center bg-white">
          <div className="font-display text-4xl flex items-center justify-center gap-3 mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
            LIFE SAVER
          </div>
          <h1 className="font-display text-5xl md:text-7xl mb-6 -rotate-1">Discover Your Execution Personality</h1>
          <p className="font-semibold text-lg md:text-xl mb-10 leading-relaxed text-brut-ink">
            Unlike other productivity tools, we adapt to *how* you work. 
            Take this short 10-question assessment to uncover your unique productivity profile so we can personalize your experience.
          </p>
          <button className="brut-btn w-full text-xl py-6 bg-brut-accent text-white flex items-center justify-center" onClick={() => setCurrentStep(0)}>
            Start Assessment <ArrowRight className="w-6 h-6 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (currentStep >= personalityQuestions.length) {
    // Show results briefly or just finish
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0];
    const secondary = sorted[1][0];

    return (
      <div className="min-h-screen bg-brut-bg flex items-center justify-center p-4">
        <div className="brut-box max-w-2xl w-full p-8 md:p-12 text-center bg-white">
          <h2 className="font-display text-5xl md:text-6xl mb-4">Analysis Complete</h2>
          <p className="font-semibold text-xl mb-10">Here is how you typically execute tasks.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="border-4 border-brut-border p-6 bg-brut-blue text-white shadow-[4px_4px_0_var(--color-brut-border)]">
              <p className="font-mono text-sm font-bold uppercase tracking-wider mb-2 bg-brut-ink inline-block px-2">Primary Profile</p>
              <h3 className="font-display text-4xl">{primary}</h3>
            </div>
            <div className="border-4 border-brut-border p-6 bg-brut-surface shadow-[4px_4px_0_var(--color-brut-border)]">
              <p className="font-mono text-sm font-bold uppercase tracking-wider mb-2 bg-brut-bg inline-block px-2 border-2 border-brut-border">Secondary Trait</p>
              <h3 className="font-display text-3xl">{secondary}</h3>
            </div>
          </div>

          <div className="mb-10">
            <p className="font-mono text-sm font-bold uppercase tracking-wider mb-4">Choose Your Companion</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['🦊', '🐼', '🐯', '🤖', '👻'].map(pet => (
                <button
                  key={pet}
                  onClick={() => setSelectedPet(pet)}
                  className={`w-20 h-20 text-4xl flex items-center justify-center border-4 transition-all cursor-pointer ${selectedPet === pet ? 'border-brut-border bg-brut-bg shadow-[4px_4px_0_var(--color-brut-border)] translate-x-[2px] translate-y-[2px]' : 'border-brut-border bg-white hover:bg-brut-bg/30 hover:shadow-[4px_4px_0_var(--color-brut-border)] hover:-translate-x-[2px] hover:-translate-y-[2px]'}`}
                >
                  {pet}
                </button>
              ))}
            </div>
          </div>

          <button className="brut-btn w-full text-xl py-6 bg-brut-green text-white flex items-center justify-center" onClick={finishTest}>
            Enter Dashboard <ArrowRight className="w-6 h-6 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const question = personalityQuestions[currentStep];

  return (
    <div className="min-h-screen bg-brut-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="mb-8 flex items-center justify-between font-mono font-bold uppercase bg-white border-4 border-brut-border p-4 shadow-[4px_4px_0_var(--color-brut-border)]">
          <span>Question {currentStep + 1} of 10</span>
          <div className="flex items-center gap-2">
            <span>Progress</span>
            <span className="bg-brut-accent text-white px-2">{Math.round(((currentStep) / 10) * 100)}%</span>
          </div>
        </div>

        <div className="brut-box bg-white overflow-hidden relative min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-8 md:p-12 flex flex-col"
            >
              <h2 className="font-display text-4xl md:text-5xl mb-10 leading-tight">
                {question.question}
              </h2>
              
              <div className="space-y-4 mt-auto">
                {question.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(choice.points)}
                    className="w-full text-left p-6 border-4 border-brut-border bg-white hover:bg-brut-bg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_var(--color-brut-border)] transition-all font-semibold text-lg cursor-pointer"
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
