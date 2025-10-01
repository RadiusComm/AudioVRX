import { Persona } from './index';

export interface RolePlayScenario {
  id: string;
  title: string;
  description: string;
  type: RolePlayType;
  difficulty: ScenarioDifficulty;
  objectives: string[];
  successCriteria: string[];
  intents: UserIntent[];
  branches: ConversationBranch[];
  personaId: string;
}

export enum RolePlayType {
  DISCOVERY_CALL = 'discovery_call',
  COLD_CALL = 'cold_call',
  OBJECTION_HANDLING = 'objection_handling',
  NEGOTIATION = 'negotiation',
  HR_INTERVIEW = 'hr_interview',
  PERFORMANCE_REVIEW = 'performance_review'
}

export interface UserIntent {
  id: string;
  name: string;
  examples: string[];
  responses: string[];
}

export interface ConversationBranch {
  id: string;
  trigger: string;
  response: string;
  nextBranches?: string[];
}

export interface RolePlaySession {
  id: string;
  scenarioId: string;
  personaId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  transcript: RolePlayMessage[];
  score?: number;
  feedback?: RolePlayFeedback[];
}

export interface RolePlayMessage {
  id: string;
  content: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
  intent?: string;
  confidence?: number;
}

export interface RolePlayFeedback {
  type: 'positive' | 'negative' | 'suggestion';
  message: string;
  timestamp: Date;
  category?: string;
}