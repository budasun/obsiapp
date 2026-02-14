export interface UserProfile {
  name: string;
  birthDate: string;
  lastPeriodDate: string;
  cycleLength: number;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
}


export interface DreamEntry {
  id: string;
  date: string;
  content: string;
  interpretation?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  obsidianPerspective: string;
  wikiUrl: string;
  keywords?: string[]; // Added for smart search
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  content: string;
  tags: string[];
  likes: number;
  timestamp: string;
  comments: Comment[];
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  DREAMS = 'DREAMS',
  CHATBOT = 'CHATBOT',
  COMMUNITY = 'COMMUNITY',
  GLOSSARY = 'GLOSSARY',
  PROFILE = 'PROFILE',
  AGENDA = 'AGENDA',
}

export interface MiracleQuestion {
  question: string;
  theme: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'ritual' | 'medical' | 'practice' | 'other';
  reminderEnabled: boolean;
}