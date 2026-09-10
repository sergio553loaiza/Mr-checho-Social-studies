import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';
import { AppUser, Activity, ActivityGrade, StudentGroup, getGradeFromGroup } from './types';
import { subscribeToAuth, updateUserGrade, updateUserGroup } from './services/auth';
import { ACTIVITIES, getActivityById } from './data/activities';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { GradeSelectionView } from './components/GradeSelectionView';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentProgressView } from './components/StudentProgressView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentGroupSelectModal } from './components/StudentGroupSelectModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherStudentsView } from './components/TeacherStudentsView';
import { TeacherActivitiesView } from './components/TeacherActivitiesView';
import { TeacherResultsView } from './components/TeacherResultsView';
import { ActivityPlayer } from './components/ActivityPlayer';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Active view: 'student' or 'teacher'
  const [activeView, setActiveView] = useState<'student' | 'teacher'>('student');
  // Navigation tabs:
  // Student: 'home' | 'choose-grade' | 'activities' | 'progress'
  // Teacher: 'dashboard' | 'students' | 'activities' | 'results'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Selected Grade for the student (4, 5, or both)
  const [selectedGrade, setSelectedGrade] = useState<ActivityGrade | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);

  // Currently opened activity
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Profile modal toggle
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Read URL search params on mount to preserve state on browser refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activityParam = params.get('activity') || localStorage.getItem('active_activity_id');
    if (activityParam) {
      const act = getActivityById(activityParam);
      if (act) {
        setSelectedActivity(act);
      }
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser, loading) => {
      setUser(currentUser);
      setAuthLoading(loading);

      if (currentUser) {
        // Read persisted grade if available
        const localGrade = typeof window !== 'undefined'
          ? (localStorage.getItem(`mrchecho_grade_${currentUser.uid}`) as ActivityGrade | null)
          : null;
        
        // Auto-infer grade if student group is already assigned
        const groupGrade = currentUser.studentGroup ? getGradeFromGroup(currentUser.studentGroup) : null;
        let initialGrade: ActivityGrade | null = null;
        if (currentUser.role === 'student') {
          initialGrade = groupGrade || currentUser.selectedGrade || localGrade || '4';
        } else {
          initialGrade = currentUser.selectedGrade || groupGrade || localGrade || 'both';
        }
        if (initialGrade) {
          setSelectedGrade(initialGrade);
        }

        if (currentUser.role === 'teacher') {
          setActiveView('teacher');
          setActiveTab('dashboard');
        } else {
          setActiveView('student');
          // If student has no group assigned, prompt them with group modal
          if (!currentUser.studentGroup) {
            setIsGroupModalOpen(true);
          }
          // Start on 'home' unless student already has active activity
          const params = new URLSearchParams(window.location.search);
          if (!params.get('activity') && !localStorage.getItem('active_activity_id')) {
            setActiveTab('home');
          } else {
            setActiveTab('activities');
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Check whether a student has permission to access an activity
  const checkActivityPermission = (activity: Activity, targetUser: AppUser): boolean => {
    if (targetUser.role !== 'student') return true;
    const studentGrade = targetUser.studentGroup
      ? getGradeFromGroup(targetUser.studentGroup)
      : (selectedGrade || '4');
    const actGrade = activity.grade || 'both';
    return actGrade === 'both' || actGrade === studentGrade;
  };

  // Guard against students accessing unpermitted activities via URL or cached state
  useEffect(() => {
    if (user && user.role === 'student' && selectedActivity) {
      if (!checkActivityPermission(selectedActivity, user)) {
        setSelectedActivity(null);
        localStorage.removeItem('active_activity_id');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('activity');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [user, selectedActivity, selectedGrade]);

  // Handle student group selection
  const handleStudentGroupSelect = async (group: StudentGroup) => {
    const inferredGrade = getGradeFromGroup(group);
    setSelectedGrade(inferredGrade);
    setIsGroupModalOpen(false);

    if (user) {
      await updateUserGroup(user.uid, group);
      await updateUserGrade(user.uid, inferredGrade);
      setUser((prev) => (prev ? { ...prev, studentGroup: group, selectedGrade: inferredGrade } : null));
    }
  };

  // Handle grade selection
  const handleGradeSelect = async (grade: ActivityGrade) => {
    setSelectedGrade(grade);
    setIsGradeModalOpen(false);
    setActiveTab('activities');

    if (user) {
      await updateUserGrade(user.uid, grade);
      setUser((prev) => (prev ? { ...prev, selectedGrade: grade } : null));
    }
  };

  // Flow from Home: "ENTER THE LAB"
  const handleEnterLab = () => {
    if (user?.role === 'student') {
      if (user.studentGroup) {
        const grade = getGradeFromGroup(user.studentGroup);
        setSelectedGrade(grade);
        setActiveTab('activities');
      } else {
        setIsGroupModalOpen(true);
      }
    } else {
      if (selectedGrade) {
        setActiveTab('activities');
      } else {
        setActiveTab('choose-grade');
      }
    }
  };

  // Set active activity with URL & local session cache sync
  const handleSelectActivity = (activity: Activity) => {
    if (user && user.role === 'student' && !checkActivityPermission(activity, user)) {
      const studentGrade = user.studentGroup ? getGradeFromGroup(user.studentGroup) : (selectedGrade || '4');
      const actGrade = activity.grade || 'both';
      const targetGradeText = actGrade === '4' ? '4to Grado' : '5to Grado';
      alert(`Esta actividad es exclusiva para estudiantes de ${targetGradeText}. Tu nivel actual es ${studentGrade === '4' ? '4to Grado' : '5to Grado'}.`);
      return;
    }
    setSelectedActivity(activity);
    localStorage.setItem('active_activity_id', activity.id);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('activity', activity.id);
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleBackFromActivity = () => {
    setSelectedActivity(null);
    localStorage.removeItem('active_activity_id');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('activity');
    window.history.replaceState({}, '', newUrl.toString());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-4 animate-pulse">
          <Compass className="w-9 h-9 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Mr Checho&apos;s Social Studies Lab 2.0
        </h2>
        <p className="text-xs text-indigo-700 font-semibold tracking-wide uppercase mt-1">
          Connecting to Montessori Learning Cloud...
        </p>
      </div>
    );
  }

  // If not logged in, render LoginPage
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header & Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenProfile={() => setIsProfileOpen(true)}
        selectedGrade={selectedGrade || undefined}
        onChangeGrade={() => setIsGradeModalOpen(true)}
        onGoHome={() => {
          setSelectedActivity(null);
          setActiveTab('home');
        }}
      />

      {/* Main Body */}
      <main className="flex-1">
        {/* If an activity is currently active (e.g. student playing an activity) */}
        {selectedActivity ? (
          <ActivityPlayer
            user={user}
            activity={selectedActivity}
            onBack={handleBackFromActivity}
          />
        ) : activeView === 'teacher' && user.role === 'teacher' ? (
          <>
            {activeTab === 'dashboard' && <TeacherDashboard />}
            {activeTab === 'students' && <TeacherStudentsView />}
            {activeTab === 'activities' && <TeacherActivitiesView />}
            {activeTab === 'results' && <TeacherResultsView />}
          </>
        ) : (
          <>
            {/* Student View Routing */}
            {activeTab === 'home' && (
              <HomePage
                user={user}
                onEnterLab={handleEnterLab}
                onOpenGradeSelector={() => setActiveTab('choose-grade')}
              />
            )}

            {activeTab === 'choose-grade' && (
              <GradeSelectionView
                currentGrade={selectedGrade || undefined}
                onSelectGrade={handleGradeSelect}
                onCancel={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'activities' && (
              <StudentDashboard
                user={user}
                selectedGrade={
                  user.role === 'student' && user.studentGroup
                    ? getGradeFromGroup(user.studentGroup)
                    : selectedGrade || '5'
                }
                onChangeGrade={() => setIsGradeModalOpen(true)}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {activeTab === 'progress' && (
              <StudentProgressView
                user={user}
                onSelectActivityId={(id) => {
                  const act = getActivityById(id);
                  if (act) handleSelectActivity(act);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Professional Polish Footer */}
      <footer className="bg-slate-900 text-white px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium shrink-0 gap-3 border-t border-slate-800">
        <div className="flex items-center gap-4 text-slate-400">
          <span>© {new Date().getFullYear()} Mr Checho&apos;s Lab</span>
          <span>•</span>
          <span>Colegio Montessori Medellín</span>
          <span>•</span>
          <span>Institutional Access</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-300">Connected to Firestore Real-time</span>
        </div>
      </footer>

      {/* Grade Switcher Modal */}
      {isGradeModalOpen && (
        <GradeSelectionView
          isModal
          currentGrade={selectedGrade || undefined}
          onSelectGrade={handleGradeSelect}
          onCancel={() => setIsGradeModalOpen(false)}
        />
      )}

      {/* Profile Modal */}
      <StudentProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onGroupUpdated={handleStudentGroupSelect}
      />

      {/* Student Group Selection Modal (prompts student to pick their group 4A-C, 5A-C) */}
      {user && user.role === 'student' && (isGroupModalOpen || !user.studentGroup) && (
        <StudentGroupSelectModal
          user={user}
          isOpen={isGroupModalOpen || !user.studentGroup}
          onGroupSelected={handleStudentGroupSelect}
          canDismiss={Boolean(user.studentGroup)}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}
    </div>
  );
}
