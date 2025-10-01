// User types
export interface User {
  id: string;
  email?: string;
  role: UserRole;
  mappedRoleName?: string; // Custom role name from account_role_names
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  lastActive: Date;
  status: 'active' | 'inactive';
  completedScenarios: number;
  averageScore: number;
  is_banned?: boolean;
  in_game_currency?: number;
  username?: string;
  storeId?: string;
  storeIds?: string[];
  stores?: Array<{id: string, storeId?: string, name?: string}>;
  accountId?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  SUPERVISOR = 'supervisor',
  GENERALMANAGER = 'general-manager',
  SUPERADMIN = 'super-admin'
}

// Scenario types
export interface Scenario {
  id: string;
  title: string;
  description: string;
  industry: string;
  difficulty: ScenarioDifficulty;
  tags: string[];
  createdAt: string;
  createdBy: string;
  isPublic: boolean;
  coverImageUrl?: string;
  persona?: Persona;
}

export enum ScenarioDifficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
}

// Persona types
export interface Persona {
  id: string;
  name: string;
  role: string;
  company?: string;
  industry?: string;
  background: string;
  personality: PersonalityTrait[];
  voiceType: VoiceType;
  avatarUrl?: string;
  createdAt: string;
  createdBy: string;
  isPublic: boolean;
  agentId?: string;
}

export enum PersonalityTrait {
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  ASSERTIVE = 'assertive',
  EMPATHETIC = 'empathetic',
  ANALYTICAL = 'analytical',
  CREATIVE = 'creative',
  DETAIL_ORIENTED = 'detail_oriented',
  PATIENT = 'patient',
}

export enum VoiceType {
  MALE_PROFESSIONAL_1 = 'male_professional_1',
  MALE_PROFESSIONAL_2 = 'male_professional_2',
  MALE_CASUAL_1 = 'male_casual_1',
  MALE_CASUAL_2 = 'male_casual_2',
  FEMALE_PROFESSIONAL_1 = 'female_professional_1',
  FEMALE_PROFESSIONAL_2 = 'female_professional_2',
  FEMALE_CASUAL_1 = 'female_casual_1',
  FEMALE_CASUAL_2 = 'female_casual_2',
}

// Conversation types
export interface ConversationNode {
  id: string;
  content: string;
  speakerType: SpeakerType;
  nextNodes?: string[];
  conditions?: NodeCondition[];
  metadata?: Record<string, any>;
}

export enum SpeakerType {
  AI = 'ai',
  USER = 'user',
  SYSTEM = 'system',
}

export interface NodeCondition {
  type: 'keyword' | 'sentiment' | 'intent';
  value: string;
  nextNodeId: string;
}

// Session types
export interface ConversationSession {
  id: string;
  userId: string;
  scenarioId: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  score?: number;
  feedback?: Feedback[];
  transcript: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  content: string;
  timestamp: string;
  speakerType: SpeakerType;
  nodeId?: string;
  analysis?: MessageAnalysis;
}

export interface MessageAnalysis {
  sentiment: number;
  keywords: string[];
  entities: Entity[];
}

export interface Entity {
  text: string;
  type: string;
  confidence: number;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  content: string;
  timestamp: string;
  messageId?: string;
  score?: number;
}

export enum FeedbackType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  SUGGESTION = 'suggestion',
  SYSTEM = 'system',
}

// Analytics types
export interface UserStats {
  userId: string;
  completedSessions: number;
  averageScore: number;
  totalDuration: number;
  strengths: string[];
  weaknesses: string[];
  improvementRate: number;
}

export interface TeamStats {
  teamId: string;
  members: number;
  averageScore: number;
  completedSessions: number;
  topPerformer: string;
  mostCompletedScenario: string;
}

// Role mapping types
export interface SystemRole {
  id: string;
  name: string;
  hierarchy_level: number;
  description?: string;
}

export interface AccountRoleName {
  id: string;
  account_id: string;
  system_role_id: string;
  custom_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  system_role?: SystemRole;
}