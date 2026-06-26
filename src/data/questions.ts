import { PersonalityType } from '../types';

export interface AnswerChoice {
  text: string;
  points: { type: PersonalityType; value: number }[];
}

export interface Question {
  id: number;
  question: string;
  choices: AnswerChoice[];
}

export const personalityQuestions: Question[] = [
  {
    id: 1,
    question: 'You receive a task due in 7 days. What do you usually do?',
    choices: [
      { text: 'Start immediately and finish most of it today.', points: [{ type: 'Immediate Executor', value: 3 }] },
      { text: 'Create a plan and schedule when to work on it.', points: [{ type: 'Structured Planner', value: 3 }] },
      { text: 'Think about it but start after a few days.', points: [{ type: 'Overthinker', value: 2 }] },
      { text: 'Ignore it until the deadline feels close.', points: [{ type: 'Pressure Performer', value: 3 }] },
    ]
  },
  {
    id: 2,
    question: 'A task feels difficult and confusing. Your first reaction?',
    choices: [
      { text: 'Break it into smaller steps.', points: [{ type: 'Structured Planner', value: 3 }] },
      { text: 'Research everything before starting.', points: [{ type: 'Overthinker', value: 3 }] },
      { text: 'Do an easier task instead.', points: [{ type: 'Selective Performer', value: 2 }] },
      { text: 'Wait until I feel motivated.', points: [{ type: 'Mood-Driven Worker', value: 3 }] },
    ]
  },
  {
    id: 3,
    question: 'When are you most productive? Choose the closest answer.',
    choices: [
      { text: 'Immediately after receiving work.', points: [{ type: 'Immediate Executor', value: 3 }] },
      { text: 'During planned work sessions.', points: [{ type: 'Structured Planner', value: 3 }] },
      { text: 'A few hours before the deadline.', points: [{ type: 'Pressure Performer', value: 3 }] },
      { text: 'Only when I suddenly get motivated.', points: [{ type: 'Mood-Driven Worker', value: 3 }] },
    ]
  },
  {
    id: 4,
    question: 'Your task is due tomorrow and still unfinished. What happens?',
    choices: [
      { text: 'Mostly done already.', points: [{ type: 'Immediate Executor', value: 3 }] },
      { text: 'Following my plan and catching up.', points: [{ type: 'Structured Planner', value: 3 }] },
      { text: 'Panic mode activates and I work nonstop.', points: [{ type: 'Pressure Performer', value: 3 }] },
      { text: 'Feel stressed and avoid it even more.', points: [{ type: 'Chronic Procrastinator', value: 4 }] },
    ]
  },
  {
    id: 5,
    question: 'Which statement describes you best?',
    choices: [
      { text: 'Action creates motivation.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'Planning creates motivation.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'Deadlines create motivation.', points: [{ type: 'Pressure Performer', value: 2 }] },
      { text: 'Mood creates motivation.', points: [{ type: 'Mood-Driven Worker', value: 2 }] },
    ]
  },
  {
    id: 6,
    question: 'How accurate are your time estimates?',
    choices: [
      { text: 'Usually accurate.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'I overestimate and start early.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'I underestimate and rush later.', points: [{ type: 'Pressure Performer', value: 2 }] },
      { text: 'I don\'t estimate at all.', points: [{ type: 'Chronic Procrastinator', value: 3 }] },
    ]
  },
  {
    id: 7,
    question: 'You have 5 tasks. Which do you choose first?',
    choices: [
      { text: 'Most important.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'Highest impact.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'Easiest.', points: [{ type: 'Chronic Procrastinator', value: 2 }] },
      { text: 'Most interesting.', points: [{ type: 'Selective Performer', value: 3 }] },
    ]
  },
  {
    id: 8,
    question: 'What usually delays you?',
    choices: [
      { text: 'Nothing. I just start.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'Too much planning.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'Fear of doing it wrong.', points: [{ type: 'Overthinker', value: 3 }] },
      { text: 'Lack of motivation.', points: [{ type: 'Mood-Driven Worker', value: 3 }] },
    ]
  },
  {
    id: 9,
    question: 'A project suddenly becomes exciting. What happens?',
    choices: [
      { text: 'I immediately dive into it.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'I reorganize my schedule for it.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'I become obsessed and work for hours.', points: [{ type: 'Hyperfocused Sprinter', value: 4 }] },
      { text: 'Depends on my mood.', points: [{ type: 'Mood-Driven Worker', value: 3 }] },
    ]
  },
  {
    id: 10,
    question: 'Which statement sounds most like you?',
    choices: [
      { text: 'Done is better than perfect.', points: [{ type: 'Immediate Executor', value: 2 }] },
      { text: 'A good plan prevents problems.', points: [{ type: 'Structured Planner', value: 2 }] },
      { text: 'I work best under pressure.', points: [{ type: 'Pressure Performer', value: 2 }] },
      { text: 'I\'ll do it when I feel ready.', points: [{ type: 'Mood-Driven Worker', value: 2 }] },
    ]
  }
];
