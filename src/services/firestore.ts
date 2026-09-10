import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ActivityAttempt,
  StudentAnswer,
  AttemptStatus,
  AppUser,
  ActivityGrade,
  StudentGroup,
} from '../types';

export const DEPRECATED_TEST_ACTIVITY_IDS = [
  'continents-and-oceans-explorer',
  'ancient-egypt-nile-valley',
];

/**
 * Safely removes any legacy test activity attempts from Firestore.
 * Can be safely called when teacher logs in or directly from teacher views.
 */
export async function cleanTestActivityAttempts(): Promise<{ deletedCount: number }> {
  let deletedCount = 0;
  try {
    const attemptsRef = collection(db, 'activity_attempts');
    for (const testActivityId of DEPRECATED_TEST_ACTIVITY_IDS) {
      const q = query(attemptsRef, where('activityId', '==', testActivityId));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(docSnap.ref);
          deletedCount++;
        } catch (e) {
          console.warn('Could not delete test attempt doc:', docSnap.id, e);
        }
      }
    }
  } catch (err) {
    console.warn('Error querying or cleaning test activity attempts:', err);
  }
  return { deletedCount };
}

export function getAttemptDocId(studentUid: string, activityId: string): string {
  return `${studentUid}_${activityId}`;
}

/**
 * Retrieves an existing activity attempt or null if not yet started.
 */
export async function getStudentAttempt(
  studentUid: string,
  activityId: string
): Promise<ActivityAttempt | null> {
  const docId = getAttemptDocId(studentUid, activityId);
  try {
    const docRef = doc(db, 'activity_attempts', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ActivityAttempt;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(data));
        } catch {
          // ignore quota
        }
      }
      return data;
    }
  } catch (error) {
    console.warn('Student attempt query returned error or offline:', error);
  }

  // Fallback to local cached attempt if available
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`mrchecho_attempt_${docId}`);
    if (local) {
      try {
        return JSON.parse(local) as ActivityAttempt;
      } catch {
        // ignore parse error
      }
    }
  }
  return null;
}

/**
 * Initializes or retrieves an activity attempt. Ensures deterministic ID.
 */
export async function initializeAttempt(
  student: AppUser,
  activityId: string,
  activityTitle: string,
  totalQuestions: number
): Promise<ActivityAttempt> {
  const docId = getAttemptDocId(student.uid, activityId);
  const docRef = doc(db, 'activity_attempts', docId);
  const now = new Date().toISOString();

  const newAttempt: ActivityAttempt = {
    id: docId,
    studentUid: student.uid,
    studentName: student.name || 'Montessori Student',
    studentEmail: student.email || '',
    ...(student.studentGroup ? { studentGroup: student.studentGroup } : {}),
    activityId,
    activityTitle,
    answers: {},
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions,
    percentage: 0,
    status: 'IN PROGRESS',
    startedAt: now,
    lastUpdatedAt: now,
    completedAt: null,
  };

  // Cache locally
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(newAttempt));
    } catch {
      // ignore
    }
  }

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const data = existing.data() as ActivityAttempt;
      // Patch student metadata if it was missing or incomplete
      if (!data.studentName || !data.studentEmail || !data.activityTitle) {
        const patch: Partial<ActivityAttempt> = {
          studentName: data.studentName || student.name || 'Montessori Student',
          studentEmail: data.studentEmail || student.email || '',
          activityTitle: data.activityTitle || activityTitle,
        };
        await setDoc(docRef, patch, { merge: true });
        return { ...data, ...patch };
      }
      return data;
    }

    await setDoc(docRef, newAttempt, { merge: true });
    return newAttempt;
  } catch (error) {
    console.warn('Could not initialize attempt directly in Firestore, using memory/local state:', error);
    return newAttempt;
  }
}

/**
 * Resets an activity attempt for a student so they can practice again.
 */
export async function resetStudentAttempt(
  student: AppUser,
  activityId: string,
  activityTitle: string,
  totalQuestions: number
): Promise<ActivityAttempt> {
  const docId = getAttemptDocId(student.uid, activityId);
  const docRef = doc(db, 'activity_attempts', docId);
  const now = new Date().toISOString();

  const resetAttempt: ActivityAttempt = {
    id: docId,
    studentUid: student.uid,
    studentName: student.name || 'Montessori Student',
    studentEmail: student.email || '',
    ...(student.studentGroup ? { studentGroup: student.studentGroup } : {}),
    activityId,
    activityTitle,
    answers: {},
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions,
    percentage: 0,
    status: 'IN PROGRESS',
    startedAt: now,
    lastUpdatedAt: now,
    completedAt: null,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(resetAttempt));
    } catch {
      // ignore
    }
  }

  try {
    await setDoc(docRef, resetAttempt);
    return resetAttempt;
  } catch (error) {
    console.warn('Could not reset attempt directly in Firestore, using memory state:', error);
    return resetAttempt;
  }
}

/**
 * Saves answer progress to Firestore immediately.
 */
export async function saveQuestionProgress(
  student: AppUser | string,
  activityId: string,
  questionId: string,
  answer: StudentAnswer,
  currentQuestionIndex: number,
  allAnswers: Record<string, StudentAnswer>,
  totalQuestions: number,
  isCompleted: boolean = false,
  activityTitle?: string
): Promise<ActivityAttempt> {
  const studentUid = typeof student === 'string' ? student : student.uid;
  const studentName = typeof student === 'object' ? student.name : undefined;
  const studentEmail = typeof student === 'object' ? student.email : undefined;
  const studentGroup = typeof student === 'object' ? student.studentGroup : undefined;

  const docId = getAttemptDocId(studentUid, activityId);
  const docRef = doc(db, 'activity_attempts', docId);
  const now = new Date().toISOString();

  // Calculate score & percentage
  const updatedAnswers = {
    ...allAnswers,
    [questionId]: answer,
  };

  const answeredCount = Object.keys(updatedAnswers).length;
  const score = Object.values(updatedAnswers).filter((a) => a.isCorrect).length;
  const percentage = Math.round((score / totalQuestions) * 100);

  const status: AttemptStatus = isCompleted || answeredCount >= totalQuestions ? 'COMPLETED' : 'IN PROGRESS';
  const computedFinalScore = Number((1 + (score / totalQuestions) * 9).toFixed(1));

  const updateData: Partial<ActivityAttempt> = {
    id: docId,
    studentUid,
    ...(studentName ? { studentName } : {}),
    ...(studentEmail ? { studentEmail } : {}),
    ...(studentGroup ? { studentGroup } : {}),
    ...(activityTitle ? { activityTitle } : {}),
    activityId,
    answers: updatedAnswers,
    currentQuestionIndex,
    score,
    totalQuestions,
    percentage,
    finalScore: computedFinalScore,
    passed: computedFinalScore >= 7.0,
    status,
    lastUpdatedAt: now,
    ...(status === 'COMPLETED' ? { completedAt: now } : {}),
  };

  // Cache locally
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(updateData));
    } catch {
      // ignore
    }
  }

  try {
    await setDoc(docRef, updateData, { merge: true });

    // Fetch and return the updated attempt document
    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      return updatedSnap.data() as ActivityAttempt;
    }
    return {
      id: docId,
      studentUid,
      studentName: studentName || 'Montessori Student',
      studentEmail: studentEmail || '',
      activityId,
      activityTitle: activityTitle || '',
      ...updateData,
    } as ActivityAttempt;
  } catch (error) {
    console.error('Firestore save failed for attempt:', docId, error);
    return {
      id: docId,
      studentUid,
      studentName: studentName || 'Montessori Student',
      studentEmail: studentEmail || '',
      activityId,
      activityTitle: activityTitle || '',
      ...updateData,
    } as ActivityAttempt;
  }
}

/**
 * Saves word search discovery progress directly to Firestore.
 * Ensures that when all 12 words are found, the attempt records:
 * - status: 'COMPLETED'
 * - score: 10
 * - totalQuestions: 10
 * - percentage: 100
 */
export async function saveWordSearchProgress(
  student: AppUser,
  activityId: string,
  activityTitle: string,
  word: string,
  allFoundAnswers: Record<string, StudentAnswer>,
  totalWords: number = 12
): Promise<ActivityAttempt> {
  const docId = getAttemptDocId(student.uid, activityId);
  const docRef = doc(db, 'activity_attempts', docId);
  const now = new Date().toISOString();

  const wordAnswer: StudentAnswer = {
    questionId: word,
    selectedOptionIndex: 0,
    isCorrect: true,
    answeredAt: now,
  };

  const updatedAnswers = {
    ...allFoundAnswers,
    [word]: wordAnswer,
  };

  const foundCount = Object.keys(updatedAnswers).length;
  const isCompleted = foundCount >= totalWords;

  // Final score is 10/10 (100%) when all words are found; proportional when in progress
  const totalQuestions = 10;
  const score = isCompleted ? 10 : Math.round((foundCount / totalWords) * 10);
  const percentage = isCompleted ? 100 : Math.round((foundCount / totalWords) * 100);
  const status: AttemptStatus = isCompleted ? 'COMPLETED' : 'IN PROGRESS';

  const updateData: Partial<ActivityAttempt> = {
    id: docId,
    studentUid: student.uid,
    studentName: student.name,
    studentEmail: student.email,
    activityId,
    activityTitle,
    answers: updatedAnswers,
    currentQuestionIndex: foundCount,
    score,
    totalQuestions,
    percentage,
    status,
    lastUpdatedAt: now,
    ...(isCompleted ? { completedAt: now } : {}),
  };

  // Cache locally
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(updateData));
    } catch {
      // ignore
    }
  }

  try {
    await setDoc(docRef, updateData, { merge: true });
    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      return updatedSnap.data() as ActivityAttempt;
    }
    return {
      ...updateData,
      startedAt: now,
      completedAt: isCompleted ? now : null,
    } as ActivityAttempt;
  } catch (error) {
    console.error('Failed to save word search progress to Firestore:', error);
    return {
      ...updateData,
      startedAt: now,
      completedAt: isCompleted ? now : null,
    } as ActivityAttempt;
  }
}

/**
 * Listens to all attempts of a specific student in real-time.
 */
export function subscribeToStudentAttempts(
  studentUid: string,
  callback: (attempts: ActivityAttempt[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const attemptsRef = collection(db, 'activity_attempts');
  const q = query(attemptsRef, where('studentUid', '==', studentUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const attempts = snapshot.docs
        .map((doc) => doc.data() as ActivityAttempt)
        .filter((a) => !DEPRECATED_TEST_ACTIVITY_IDS.includes(a.activityId));
      callback(attempts);
    },
    (error) => {
      console.error('Error in student attempts listener:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listens to all student attempts for the teacher dashboard in real-time.
 */
export function subscribeToTeacherDashboard(
  callback: (attempts: ActivityAttempt[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const attemptsRef = collection(db, 'activity_attempts');

  return onSnapshot(
    attemptsRef,
    (snapshot) => {
      const attempts = snapshot.docs
        .map((doc) => doc.data() as ActivityAttempt)
        .filter((a) => !DEPRECATED_TEST_ACTIVITY_IDS.includes(a.activityId));
      // Sort by lastUpdatedAt descending in memory
      attempts.sort(
        (a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
      );
      callback(attempts);
    },
    (error) => {
      console.error('Error in teacher dashboard listener:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Official student roster entry.
 * The document ID is the student's normalized institutional email.
 */
export type StudentRosterEntry = {
  email: string;
  name: string;
  group: StudentGroup;
  grade: ActivityGrade;
  active: boolean;
};

/**
 * Creates or updates the official student roster in Firestore.
 * This function is teacher-only through Firestore Security Rules.
 */
export async function seedStudentRoster(
  roster: StudentRosterEntry[]
): Promise<number> {
  const rosterRef = collection(db, 'student_roster');
  const batch = writeBatch(db);

  for (const student of roster) {
    const email = student.email.toLowerCase().trim();

    batch.set(
      doc(rosterRef, email),
      {
        email,
        name: student.name,
        group: student.group,
        grade: student.grade,
        active: student.active,
      },
      { merge: true }
    );
  }

  await batch.commit();
  return roster.length;
}

/**
 * Updates one student's official group/grade.
 * Student history in activity_attempts is preserved.
 */
export async function updateStudentRosterEntry(
  email: string,
  group: StudentGroup,
  grade: ActivityGrade
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  await setDoc(
    doc(db, 'student_roster', normalizedEmail),
    {
      email: normalizedEmail,
      group,
      grade,
      active: true,
    },
    { merge: true }
  );
}

/**
 * Activates or deactivates a student without deleting academic history.
 */
export async function setStudentRosterActive(
  email: string,
  active: boolean
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  await setDoc(
    doc(db, 'student_roster', normalizedEmail),
    { active },
    { merge: true }
  );
}

/**
 * Listens to the official student roster for Teacher View.
 */
export function subscribeToStudentRoster(
  callback: (students: StudentRosterEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const rosterRef = collection(db, 'student_roster');

  return onSnapshot(
    rosterRef,
    (snapshot) => {
      const students = snapshot.docs
        .map((snapshotDoc) => snapshotDoc.data() as StudentRosterEntry)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      callback(students);
    },
    (error) => {
      console.error('Error in student roster listener:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listens to all users for the teacher dashboard.
 */
export function subscribeToUsers(
  callback: (users: AppUser[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const usersRef = collection(db, 'users');

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data() as AppUser);
      users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(users);
    },
    (error) => {
      console.error('Error in users listener:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves real-time or debounced progress for the Colombian Symbols Mind Maps activity.
 * Persists all student responses, current section, completed sections list,
 * and upon final submission saves rubric evaluation metrics, final grade (1-10), and feedback.
 */
export async function saveColombianSymbolsProgress(
  student: AppUser,
  activityId: string,
  activityTitle: string,
  currentSectionIndex: number,
  responses: Record<string, string>,
  completedSections: number[],
  isCompleted: boolean = false,
  evaluationData?: {
    finalScore: number;
    percentage: number;
    passed: boolean;
    feedback: string;
    rubricBreakdown: any;
  }
): Promise<ActivityAttempt> {
  const docId = getAttemptDocId(student.uid, activityId);
  const docRef = doc(db, 'activity_attempts', docId);
  const now = new Date().toISOString();

  const status: AttemptStatus = isCompleted ? 'COMPLETED' : 'IN PROGRESS';

  const updateData: Partial<ActivityAttempt> = {
    id: docId,
    studentUid: student.uid,
    studentName: student.name,
    studentEmail: student.email,
    activityId,
    activityTitle,
    responses,
    completedSections,
    currentQuestionIndex: currentSectionIndex,
    status,
    lastUpdatedAt: now,
    ...(isCompleted && evaluationData
      ? {
          score: evaluationData.finalScore,
          finalScore: evaluationData.finalScore,
          totalQuestions: 10,
          percentage: evaluationData.percentage,
          passed: evaluationData.passed,
          feedback: evaluationData.feedback,
          evaluationCriteria: evaluationData.rubricBreakdown,
          completedAt: now,
        }
      : {}),
  };

  // Cache locally
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`mrchecho_attempt_${docId}`, JSON.stringify(updateData));
    } catch {
      // ignore
    }
  }

  try {
    await setDoc(docRef, updateData, { merge: true });
    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      return updatedSnap.data() as ActivityAttempt;
    }
    return {
      startedAt: now,
      answers: {},
      totalQuestions: 10,
      score: 0,
      percentage: 0,
      ...updateData,
    } as ActivityAttempt;
  } catch (error) {
    console.error('Failed to save Colombian symbols progress to Firestore:', error);
    return {
      startedAt: now,
      answers: {},
      totalQuestions: 10,
      score: 0,
      percentage: 0,
      ...updateData,
    } as ActivityAttempt;
  }
}
      percentage: 0,
      ...updateData,
    } as ActivityAttempt;
  }
}
