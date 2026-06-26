export type PersonalityType =
  | 'Immediate Executor'
  | 'Structured Planner'
  | 'Pressure Performer'
  | 'Overthinker'
  | 'Chronic Procrastinator'
  | 'Selective Performer'
  | 'Hyperfocused Sprinter'
  | 'Mood-Driven Worker';

export interface Pet {
  id: string;
  name: string;
  type: string;
  level: number;
  bond: number;
  trait: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string
  estTime: number; // in mins
  type: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  risk: 'Low' | 'Medium' | 'High';
  priorityScore: number;
  petId?: string; // Associated pet for the task
  subtasks?: Subtask[]; // Added subtasks
}

export interface UserProfile {
  primaryType: PersonalityType | null;
  secondaryType: PersonalityType | null;
  pets: Pet[];
  activePetId: string;
}
