import React, { useState, useEffect } from 'react';
import { useAppContext, Mood } from '../context/AppContext';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOOD_CONFIG = {
  'High Energy & Focused': {
    color: 'bg-green-100 border-green-400',
    accent: 'bg-green-400',
    expression: '😄',
    status: 'READY',
    messages: [
      "You're full of energy today! Let's finish the hardest task first.",
      "I'm keeping up with you today!",
      "Today's looking productive already.",
      "Let's keep this momentum going!"
    ],
    animation: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const } }
  },
  'Medium Energy': {
    color: 'bg-blue-100 border-blue-400',
    accent: 'bg-blue-400',
    expression: '🙂',
    status: 'BALANCED',
    messages: [
      "Steady progress beats perfection.",
      "Let's finish a few important tasks today.",
      "We've got a good pace.",
      "One task at a time."
    ],
    animation: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const } }
  },
  'Easily Distracted': {
    color: 'bg-orange-100 border-orange-400',
    accent: 'bg-orange-400',
    expression: '😵‍💫',
    status: 'DISTRACTED',
    messages: [
      "I'll help you stay focused.",
      "Let's avoid multitasking today.",
      "Maybe start a Pomodoro?",
      "One small task first."
    ],
    animation: { rotate: [-5, 5, -5], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const } }
  },
  'Overwhelmed & Low': {
    color: 'bg-purple-100 border-purple-400',
    accent: 'bg-purple-400',
    expression: '🥺',
    status: 'SUPPORT MODE',
    messages: [
      "It's okay to start small.",
      "You don't have to finish everything today.",
      "Let's complete just one task together.",
      "I'm staying with you."
    ],
    animation: { y: [0, -5, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const } }
  }
};

const petLines = [
  "You've got this! I believe in you!",
  "Take a deep breath. We are making progress.",
  "Woah, look at you go!",
  "I'm so proud to be your companion.",
  "Remember to drink some water!",
  "Focus mode: activated!",
  "Let's crush these tasks together.",
  "I'm here for you, no matter what.",
  "You're doing amazing, sweetie.",
  "We're a great team!",
  "Don't forget to blink!",
  "Take it one step at a time.",
  "You are unstoppable!",
  "I brought you some virtual snacks! 🍪",
  "Is it time for a break yet? Just kidding, keep going!",
  "You're a productivity machine!",
  "High five! 🖐️",
  "I'm cheering for you from the sidelines.",
  "Every small step counts.",
  "Wow, you're working really hard today.",
  "I'm so glad we're paired up.",
  "You have my full support.",
  "Let's tackle this task head-on!",
  "I'm ready when you are.",
  "You're doing better than you think.",
  "Keep that momentum going!",
  "I'm your biggest fan.",
  "You're a rockstar!",
  "Let's make today a great day.",
  "I'm always in your corner.",
  "You're making great progress.",
  "Keep up the fantastic work!",
  "I'm so impressed by your dedication.",
  "You're a true champion.",
  "Let's get this done!",
  "I'm here to cheer you on.",
  "You're doing brilliantly.",
  "Keep shining bright!",
  "I'm amazed by your focus.",
  "You're a productivity wizard!",
  "Let's conquer the world together.",
  "I'm so lucky to be your companion.",
  "You're absolutely crushing it.",
  "Keep that positive energy flowing!",
  "I'm right behind you.",
  "You're doing splendidly.",
  "Let's make some magic happen.",
  "I'm here to support you.",
  "You're a true inspiration.",
  "Keep up the awesome work!",
  "I'm so proud of your progress.",
  "You're a force to be reckoned with.",
  "Let's tackle the next challenge!",
  "I'm your loyal sidekick.",
  "You're doing exceptionally well.",
  "Keep pushing forward!",
  "I'm here to celebrate your wins.",
  "You're a productivity powerhouse!",
  "Let's make it a productive day.",
  "I'm always here for you.",
  "You're doing phenomenally.",
  "Keep up the great effort!",
  "I'm so inspired by you.",
  "You're a true go-getter.",
  "Let's achieve our goals together.",
  "I'm here to motivate you.",
  "You're doing magnificently.",
  "Keep reaching for the stars!",
  "I'm your dedicated companion.",
  "You're a productivity ninja!",
  "Let's make every moment count.",
  "I'm here to encourage you.",
  "You're doing wonderfully.",
  "Keep up the incredible work!",
  "I'm so proud of what you've accomplished.",
  "You're a true powerhouse.",
  "Let's overcome any obstacle!",
  "I'm your trusty partner.",
  "You're doing superbly.",
  "Keep striving for greatness!",
  "I'm here to boost your spirits.",
  "You're a productivity maestro!",
  "Let's make today unforgettable.",
  "I'm always on your side.",
  "You're doing outstandingly.",
  "Keep up the stellar work!",
  "I'm so impressed by your resilience.",
  "You're a true trailblazer.",
  "Let's reach new heights together.",
  "I'm here to support your journey.",
  "You're doing brilliantly.",
  "Keep up the fantastic effort!",
  "I'm your biggest cheerleader.",
  "You're a productivity legend!",
  "Let's make today a masterpiece.",
  "I'm always here to help.",
  "You're doing exceptionally.",
  "Keep up the amazing work!",
  "I'm so proud to be by your side.",
  "You're a true superhero."
];

interface CompanionDisplayProps {
  onOpenSelector: () => void;
}

export function CompanionDisplay({ onOpenSelector }: CompanionDisplayProps) {
  const { profile, mood } = useAppContext();
  const [speech, setSpeech] = useState<string | null>(null);
  
  const activePet = profile?.pets?.find(p => p.id === profile.activePetId);
  
  const currentMoodConfig = mood ? MOOD_CONFIG[mood] : null;

  const getRandomLine = (lines: string[], currentLine: string | null) => {
    let nextLine = lines[Math.floor(Math.random() * lines.length)];
    if (lines.length > 1 && nextLine === currentLine) {
      let nextIndex = lines.indexOf(nextLine) + 1;
      if (nextIndex >= lines.length) nextIndex = 0;
      nextLine = lines[nextIndex];
    }
    return nextLine;
  };

  // React to mood changes
  useEffect(() => {
    if (currentMoodConfig) {
      setSpeech(prev => getRandomLine(currentMoodConfig.messages, prev));
    }
  }, [mood]);

  useEffect(() => {
    if (!mood && activePet) {
      const timer = setTimeout(() => {
        setSpeech(prev => getRandomLine(petLines, prev));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activePet?.id, mood]);

  const handlePetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let lines = petLines;
    if (currentMoodConfig) {
      lines = currentMoodConfig.messages;
    }
    setSpeech(prev => getRandomLine(lines, prev));
  };

  useEffect(() => {
    if (speech) {
      const timer = setTimeout(() => setSpeech(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [speech]);

  if (!activePet) return null;

  const containerColor = currentMoodConfig ? currentMoodConfig.color : 'bg-brut-bg/20 border-brut-border';

  return (
    <div className={`brut-box p-6 md:p-8 relative transition-colors duration-300 ${currentMoodConfig ? currentMoodConfig.color.split(' ')[0] : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`font-mono text-white px-3 py-1 text-xs inline-block uppercase ${currentMoodConfig ? currentMoodConfig.accent : 'bg-brut-ink'}`}>
          Companions
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenSelector(); }}
          className="p-1 hover:bg-white/50 rounded-md transition-colors border border-transparent hover:border-brut-border"
        >
          <Settings className="w-4 h-4 text-slate-700" />
        </button>
      </div>
      
      <AnimatePresence>
        {speech && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[-30px] right-4 bg-white border-4 border-brut-border p-3 shadow-[4px_4px_0_var(--color-brut-border)] z-10 max-w-[200px]"
          >
            <p className="font-bold text-sm leading-tight">{speech}</p>
            <div className="absolute -bottom-[10px] right-6 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-brut-border border-r-[10px] border-r-transparent"></div>
            <div className="absolute -bottom-[6px] right-6 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[10px] border-r-transparent"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        onClick={handlePetClick}
        className={`flex items-center gap-6 p-4 border-2 border-dashed ${currentMoodConfig ? currentMoodConfig.color.split(' ')[1] : 'border-brut-border'} cursor-pointer hover:bg-white/20 transition-colors`}
      >
        <motion.span 
          animate={currentMoodConfig ? currentMoodConfig.animation : { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
          className="text-5xl origin-center inline-block"
        >
          {activePet.type || '🦊'}
          {currentMoodConfig && <span className="text-3xl ml-1 absolute -bottom-2 -right-2">{currentMoodConfig.expression}</span>}
        </motion.span>
        <div>
          <div className="font-extrabold flex items-center gap-2">
            {activePet.name || 'Companion'}
          </div>
          <div className="font-mono text-[0.7rem] uppercase mt-1">
            LVL {activePet.level || 1} | BOND {activePet.bond || 0}%
          </div>
          {currentMoodConfig && (
            <div className={`text-xs font-bold uppercase mt-1 px-1.5 py-0.5 rounded-sm inline-block text-white ${currentMoodConfig.accent}`}>
              {currentMoodConfig.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
