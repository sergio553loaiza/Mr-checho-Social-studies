import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, TEACHER_EMAIL } from './firebase';
import { AppUser, UserRole, ActivityGrade, StudentGroup, getGradeFromGroup } from '../types';

export function determineUserRole(email: string | null | undefined): UserRole {
  if (!email) return 'student';
  return email.toLowerCase().trim() === TEACHER_EMAIL.toLowerCase() ? 'teacher' : 'student';
}

export async function signInWithGoogle(): Promise<AppUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  return await syncUserProfile(fbUser);
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function updateUserGrade(uid: string, grade: ActivityGrade): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mrchecho_grade_${uid}`, grade);
  }
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { selectedGrade: grade }, { merge: true });
  } catch (err) {
    console.warn('Could not update user selectedGrade in firestore:', err);
  }
}

export async function updateUserGroup(uid: string, group: StudentGroup): Promise<void> {
  const grade = getGradeFromGroup(group);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mrchecho_group_${uid}`, group);
    localStorage.setItem(`mrchecho_grade_${uid}`, grade);
  }
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { studentGroup: group, selectedGrade: grade }, { merge: true });
  } catch (err) {
    console.warn('Could not update user studentGroup in firestore:', err);
  }
}

export async function syncUserProfile(fbUser: FirebaseUser): Promise<AppUser> {
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);
  const role = determineUserRole(fbUser.email);
  const now = new Date().toISOString();

  const storedLocalGroup = typeof window !== 'undefined'
    ? ((localStorage.getItem(`mrchecho_group_${fbUser.uid}`) ||
        localStorage.getItem('mrchecho_pending_group')) as StudentGroup | null)
    : null;

  const storedLocalGrade = typeof window !== 'undefined'
    ? (localStorage.getItem(`mrchecho_grade_${fbUser.uid}`) as ActivityGrade | null)
    : null;

  if (userSnap.exists()) {
    const data = userSnap.data();
    const effectiveGroup: StudentGroup | undefined =
      data.studentGroup || storedLocalGroup || undefined;
    const effectiveGrade: ActivityGrade | undefined =
      data.selectedGrade ||
      (effectiveGroup ? getGradeFromGroup(effectiveGroup) : undefined) ||
      storedLocalGrade ||
      undefined;

    const updatedUser: AppUser = {
      uid: fbUser.uid,
      name: fbUser.displayName || data.name || (role === 'teacher' ? 'Teacher' : 'Student'),
      email: fbUser.email || data.email || '',
      photoURL: fbUser.photoURL || data.photoURL || null,
      role: data.role || role,
      selectedGrade: effectiveGrade,
      studentGroup: effectiveGroup,
      createdAt: data.createdAt || now,
      lastLoginAt: now,
    };

    if (effectiveGrade && typeof window !== 'undefined') {
      localStorage.setItem(`mrchecho_grade_${fbUser.uid}`, effectiveGrade);
    }
    if (effectiveGroup && typeof window !== 'undefined') {
      localStorage.setItem(`mrchecho_group_${fbUser.uid}`, effectiveGroup);
      localStorage.removeItem('mrchecho_pending_group');
    }

    // Update last login and profile info
    await setDoc(
      userRef,
      {
        lastLoginAt: now,
        name: updatedUser.name,
        photoURL: updatedUser.photoURL,
        role: updatedUser.role,
        ...(effectiveGrade ? { selectedGrade: effectiveGrade } : {}),
        ...(effectiveGroup ? { studentGroup: effectiveGroup } : {}),
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Could not update user profile in firestore:', err);
    });

    return updatedUser;
  } else {
    const effectiveGroup = storedLocalGroup || undefined;
    const effectiveGrade =
      (effectiveGroup ? getGradeFromGroup(effectiveGroup) : undefined) ||
      storedLocalGrade ||
      undefined;

    const newUser: AppUser = {
      uid: fbUser.uid,
      name: fbUser.displayName || (role === 'teacher' ? 'Teacher' : 'Student'),
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || null,
      role,
      ...(effectiveGrade ? { selectedGrade: effectiveGrade } : {}),
      ...(effectiveGroup ? { studentGroup: effectiveGroup } : {}),
      createdAt: now,
      lastLoginAt: now,
    };

    if (effectiveGroup && typeof window !== 'undefined') {
      localStorage.setItem(`mrchecho_group_${fbUser.uid}`, effectiveGroup);
      localStorage.removeItem('mrchecho_pending_group');
    }

    await setDoc(userRef, newUser, { merge: true });
    return newUser;
  }
}

export function subscribeToAuth(callback: (user: AppUser | null, loading: boolean) => void) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const user = await syncUserProfile(fbUser);
        callback(user, false);
      } catch (err) {
        console.error('Error syncing user profile on auth state change:', err);
        // Fallback user object if firestore profile read fails
        const role = determineUserRole(fbUser.email);
        const fallbackUser: AppUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Montessori Student',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL,
          role,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        callback(fallbackUser, false);
      }
    } else {
      callback(null, false);
    }
  });
}
