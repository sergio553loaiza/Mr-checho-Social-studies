import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { AppUser, UserRole, ActivityGrade, StudentGroup, getGradeFromGroup } from '../types';

const STUDENT_DOMAIN = '@s.montessori.edu.co';
const TEACHER_DOMAIN = '@montessori.edu.co';
const TEACHER_EMAIL = 'sergio553.loaiza@montessori.edu.co';

export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();

  return (
    normalizedEmail.endsWith(STUDENT_DOMAIN) ||
    normalizedEmail.endsWith(TEACHER_DOMAIN)
  );
}

export function determineUserRole(email: string | null | undefined): UserRole {
  if (!email) return 'student';

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail.endsWith(TEACHER_DOMAIN)) {
    return 'teacher';
  }

  if (normalizedEmail.endsWith(STUDENT_DOMAIN)) {
    return 'student';
  }

  return 'student';
}

export async function signInWithGoogle(): Promise<AppUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Only Montessori institutional accounts are allowed.
  if (!isAuthorizedEmail(fbUser.email)) {
    await firebaseSignOut(auth);

    throw new Error(
      'Acceso no autorizado. Debes utilizar una cuenta institucional Montessori.'
    );
  }

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
    await setDoc(
      userRef,
      { studentGroup: group, selectedGrade: grade },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not update user studentGroup in firestore:', err);
  }
}

export async function syncUserProfile(fbUser: FirebaseUser): Promise<AppUser> {
  // Security check also happens here in case an authenticated
  // Firebase session already exists.
  if (!isAuthorizedEmail(fbUser.email)) {
    await firebaseSignOut(auth);

    throw new Error(
      'Acceso no autorizado. Debes utilizar una cuenta institucional Montessori.'
    );
  }

  const normalizedEmail = (fbUser.email || '').toLowerCase().trim();
  const role = determineUserRole(normalizedEmail);
  const now = new Date().toISOString();

  // The teacher account is authorized by institutional teacher domain.
  // Student accounts are authorized by the official student roster.
  let rosterGroup: StudentGroup | null = null;
  let rosterGrade: ActivityGrade | null = null;

  if (role === 'student') {
    const rosterRef = doc(db, 'student_roster', normalizedEmail);
    const rosterSnap = await getDoc(rosterRef);

    if (!rosterSnap.exists()) {
      await firebaseSignOut(auth);
      throw new Error(
        'Tu cuenta no está en el roster activo de Montessori.'
      );
    }

    const rosterData = rosterSnap.data();

    if (rosterData.active !== true) {
      await firebaseSignOut(auth);
      throw new Error(
        'Tu cuenta no está en el roster activo de Montessori.'
      );
    }

    rosterGroup = (rosterData.group || null) as StudentGroup | null;
    rosterGrade = (rosterData.grade || null) as ActivityGrade | null;

    // If the roster has a group but no grade, derive the grade from the group.
    if (!rosterGrade && rosterGroup) {
      rosterGrade = getGradeFromGroup(rosterGroup);
    }
  }

  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  const storedLocalGroup = typeof window !== 'undefined'
    ? (
        localStorage.getItem(`mrchecho_group_${fbUser.uid}`) ||
        localStorage.getItem('mrchecho_pending_group')
      ) as StudentGroup | null
    : null;

  const storedLocalGrade = typeof window !== 'undefined'
    ? (localStorage.getItem(`mrchecho_grade_${fbUser.uid}`) as ActivityGrade | null)
    : null;

  if (userSnap.exists()) {
    const data = userSnap.data();

    // For students, the roster is authoritative.
    // Old users/localStorage values are used only when the roster
    // does not provide a value.
    const effectiveGroup: StudentGroup | undefined =
      role === 'student'
        ? (rosterGroup || storedLocalGroup || undefined)
        : (data.studentGroup || storedLocalGroup || undefined);

    const effectiveGrade: ActivityGrade | undefined =
      role === 'student'
        ? (
            rosterGrade ||
            (effectiveGroup ? getGradeFromGroup(effectiveGroup) : undefined) ||
            storedLocalGrade ||
            undefined
          )
        : (
            data.selectedGrade ||
            (effectiveGroup ? getGradeFromGroup(effectiveGroup) : undefined) ||
            storedLocalGrade ||
            undefined
          );

    const updatedUser: AppUser = {
      uid: fbUser.uid,
      name:
        fbUser.displayName ||
        data.name ||
        (role === 'teacher' ? 'Teacher' : 'Student'),
      email: fbUser.email || data.email || '',
      photoURL: fbUser.photoURL || data.photoURL || null,

      // The role is determined from the institutional email domain.
      // We do not trust a previously stored role from Firestore.
      role,

      selectedGrade: effectiveGrade,
      studentGroup: effectiveGroup,
      createdAt: data.createdAt || now,
      lastLoginAt: now,
    };

    if (effectiveGrade && typeof window !== 'undefined') {
      localStorage.setItem(
        `mrchecho_grade_${fbUser.uid}`,
        effectiveGrade
      );
    }

    if (effectiveGroup && typeof window !== 'undefined') {
      localStorage.setItem(
        `mrchecho_group_${fbUser.uid}`,
        effectiveGroup
      );

      localStorage.removeItem('mrchecho_pending_group');
    }

    await setDoc(
      userRef,
      {
        lastLoginAt: now,
        name: updatedUser.name,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
        role: updatedUser.role,
        ...(effectiveGrade ? { selectedGrade: effectiveGrade } : {}),
        ...(effectiveGroup ? { studentGroup: effectiveGroup } : {}),
      },
      { merge: true }
    ).catch((err) => {
      console.warn(
        'Could not update user profile in firestore:',
        err
      );
    });

    return updatedUser;
  } else {
    // At this point, a student has already passed the roster check above.
    // For students, only roster values may establish the initial group/grade.
    const effectiveGroup =
      role === 'student'
        ? (rosterGroup || undefined)
        : (storedLocalGroup || undefined);

    const effectiveGrade =
      role === 'student'
        ? (
            rosterGrade ||
            (effectiveGroup ? getGradeFromGroup(effectiveGroup) : undefined)
          )
        : (
            (effectiveGroup
              ? getGradeFromGroup(effectiveGroup)
              : undefined) ||
            storedLocalGrade ||
            undefined
          );

    const newUser: AppUser = {
      uid: fbUser.uid,
      name:
        fbUser.displayName ||
        (role === 'teacher' ? 'Teacher' : 'Student'),
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || null,
      role,
      ...(effectiveGrade ? { selectedGrade: effectiveGrade } : {}),
      ...(effectiveGroup ? { studentGroup: effectiveGroup } : {}),
      createdAt: now,
      lastLoginAt: now,
    };

    if (effectiveGroup && typeof window !== 'undefined') {
      localStorage.setItem(
        `mrchecho_group_${fbUser.uid}`,
        effectiveGroup
      );

      localStorage.removeItem('mrchecho_pending_group');
    }

    if (effectiveGrade && typeof window !== 'undefined') {
      localStorage.setItem(
        `mrchecho_grade_${fbUser.uid}`,
        effectiveGrade
      );
    }

    await setDoc(userRef, newUser, { merge: true });

    return newUser;
  }
}

export function subscribeToAuth(
  callback: (user: AppUser | null, loading: boolean) => void
) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        // Security check for existing Firebase sessions.
        if (!isAuthorizedEmail(fbUser.email)) {
          await firebaseSignOut(auth);
          callback(null, false);
          return;
        }

        const user = await syncUserProfile(fbUser);
        callback(user, false);
      } catch (err) {
        console.error(
          'Error syncing user profile on auth state change:',
          err
        );

        // Never create a fallback user after an authentication/roster error.
        // This is important because an old users/{uid} document must not
        // bypass the official student roster.
        await firebaseSignOut(auth).catch(() => undefined);
        callback(null, false);
      }
    } else {
      callback(null, false);
    }
  });
}
