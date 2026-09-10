export type UserRole = 'teacher' | 'student';
export type ActivityGrade = '4' | '5' | 'both';
export type StudentGroup = '4A' | '4B' | '4C' | '5A' | '5B' | '5C';

export const STUDENT_GROUPS: StudentGroup[] = ['4A', '4B', '4C', '5A', '5B', '5C'];

export function getGradeFromGroup(group: StudentGroup): ActivityGrade {
  return group.startsWith('4') ? '4' : '5';
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  selectedGrade?: ActivityGrade;
  studentGroup?: StudentGroup;
  createdAt: string;
  lastLoginAt: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  optionalImage?: string;
  points: number;
  type?: 'MC' | 'DROP' | 'MATCH' | 'TF' | 'MULTI' | 'FILL' | 'ORDER';
  concept?: string;
  tag?: string;
  pairs?: { term: string; options: string[]; correct: string }[];
  matchPairs?: [string, string][];
  correctAnswerText?: string;
  multiCorrectAnswers?: number[];
  orderItems?: string[];
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  iconName: string;
  topic: string;
  category?: string;
  gradeLevel: string;
  grade?: ActivityGrade;
  estimatedMinutes: number;
  activityType?: 'quiz' | 'matching' | 'word-search' | 'colombian-symbols' | 'follow-up' | 'symbols-challenge';
  questions: Question[];
  wordSearchWords?: string[];
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  answeredAt: string;
  userAnswerText?: string;
}

export interface ColombianRubricBreakdown {
  accuracyAndUnderstanding: number; // max 3.0
  completeness: number; // max 2.0
  explanationAndReasoning: number; // max 2.0
  vocabulary: number; // max 1.0
  connectionToIdentity: number; // max 1.0
  reflection: number; // max 1.0
  strengths: string[];
  improvements: string[];
}

export type AttemptStatus = 'NOT STARTED' | 'IN PROGRESS' | 'COMPLETED';

export interface ActivityAttempt {
  id: string; // studentUid + "_" + activityId
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentGroup?: StudentGroup;
  activityId: string;
  activityTitle: string;
  answers: Record<string, StudentAnswer>;
  currentQuestionIndex: number;
  score: number; // Count of correct answers or points
  totalQuestions: number;
  percentage: number;
  status: AttemptStatus;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt: string | null;

  // Colombian Symbols Mind Maps integration fields:
  responses?: Record<string, string>;
  completedSections?: number[];
  finalScore?: number; // 1-10
  passed?: boolean; // finalScore >= 7.0
  feedback?: string;
  evaluationCriteria?: ColombianRubricBreakdown;
}
