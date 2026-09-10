import React from 'react';
import {
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Home,
  Sparkles,
} from 'lucide-react';
import { AppUser, ActivityGrade } from '../types';
import { signOutUser } from '../services/auth';
import montessoriLogo from '../assets/images/colegio_montessori_logo.svg';

interface NavbarProps {
  user: AppUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeView: 'student' | 'teacher';
  setActiveView: (view: 'student' | 'teacher') => void;
  onOpenProfile: () => void;
  selectedGrade?: ActivityGrade;
  onChangeGrade?: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  activeView,
  setActiveView,
  onOpenProfile,
  selectedGrade,
  onChangeGrade,
  onGoHome,
}) => {
  const isTeacher = user.role === 'teacher';

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Emblem & Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Colegio Montessori School Emblem */}
            <img
              src={montessoriLogo}
              alt="Colegio Montessori"
              className="h-10 sm:h-11 w-auto object-contain hidden sm:block"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/colegio_montessori_logo.svg';
              }}
              referrerPolicy="no-referrer"
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div
              onClick={onGoHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 sm:w-11 h-10 sm:h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:bg-indigo-700 transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-indigo-950 leading-tight">
                    Mr Checho&apos;s Social Studies Lab
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-indigo-100/80 text-indigo-800">
                    2.0
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Montessori Elementary Lab
                </p>
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {activeView === 'teacher' && isTeacher ? (
              <>
                <button
                  id="teacher-nav-dashboard"
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`text-sm font-semibold transition-colors pb-1 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  id="teacher-nav-students"
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`text-sm font-semibold transition-colors pb-1 cursor-pointer ${
                    activeTab === 'students'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  Students
                </button>
                <button
                  id="teacher-nav-activities"
                  type="button"
                  onClick={() => setActiveTab('activities')}
                  className={`text-sm font-semibold transition-colors pb-1 cursor-pointer ${
                    activeTab === 'activities'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  Curriculum
                </button>
                <button
                  id="teacher-nav-results"
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className={`text-sm font-semibold transition-colors pb-1 cursor-pointer ${
                    activeTab === 'results'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  Results
                </button>
              </>
            ) : (
              <>
                <button
                  id="student-nav-home"
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className={`text-sm font-semibold transition-colors pb-1 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'home'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <button
                  id="student-nav-activities"
                  type="button"
                  onClick={() => setActiveTab('activities')}
                  className={`text-sm font-semibold transition-colors pb-1 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'activities'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Lab Activities</span>
                </button>
                <button
                  id="student-nav-progress"
                  type="button"
                  onClick={() => setActiveTab('progress')}
                  className={`text-sm font-semibold transition-colors pb-1 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'progress'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>My Progress</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Area: Grade Badge & View Switcher & Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Student Grade Pill */}
            {activeView === 'student' && selectedGrade && (
              isTeacher ? (
                <button
                  type="button"
                  onClick={onChangeGrade}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors text-xs font-bold text-slate-700 hover:text-indigo-700 cursor-pointer"
                  title="Click to switch grade level (Teacher preview)"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {selectedGrade === 'both' ? 'Grade 4 & 5' : `Grade ${selectedGrade}`}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold underline ml-1">
                    Change
                  </span>
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                  title={user.studentGroup ? `Estudiante asignado al Grupo ${user.studentGroup}` : `Grado ${selectedGrade}`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {user.studentGroup ? `Grupo ${user.studentGroup}` : `Grado ${selectedGrade}`}
                  </span>
                </div>
              )
            )}

            {/* View Switcher for Teacher */}
            {isTeacher && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  id="switch-to-student-view"
                  type="button"
                  onClick={() => {
                    setActiveView('student');
                    setActiveTab('activities');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'student'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student Lab
                </button>
                <button
                  id="switch-to-teacher-view"
                  type="button"
                  onClick={() => {
                    setActiveView('teacher');
                    setActiveTab('dashboard');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teacher View
                </button>
              </div>
            )}

            {/* User Profile Button */}
            <button
              id="navbar-profile-btn"
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
            </button>

            {/* Sign Out Button */}
            <button
              id="navbar-signout-btn"
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Profile & Switcher Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {activeView === 'student' && selectedGrade && (
              <button
                type="button"
                onClick={onChangeGrade}
                className="px-2 py-1 rounded-md bg-indigo-50 text-[11px] font-bold text-indigo-700"
              >
                G{selectedGrade === 'both' ? '4/5' : selectedGrade}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center p-1 rounded-full border border-slate-200"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Links Row */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2 md:hidden overflow-x-auto no-scrollbar gap-2">
          <nav className="flex items-center space-x-2 text-xs font-semibold">
            {activeView === 'teacher' && isTeacher ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-2.5 py-1 rounded-md ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`px-2.5 py-1 rounded-md ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activities')}
                  className={`px-2.5 py-1 rounded-md ${
                    activeTab === 'activities'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className={`px-2.5 py-1 rounded-md ${
                    activeTab === 'results'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Results
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-1 rounded-md ${
                    activeTab === 'home'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activities')}
                  className={`px-3 py-1 rounded-md ${
                    activeTab === 'activities'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Activities
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('progress')}
                  className={`px-3 py-1 rounded-md ${
                    activeTab === 'progress'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Progress
                </button>
              </>
            )}
          </nav>

          {isTeacher && (
            <div className="flex items-center bg-slate-200/60 p-0.5 rounded-md text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveView('student');
                  setActiveTab('activities');
                }}
                className={`px-2 py-0.5 rounded ${
                  activeView === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Lab
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('teacher');
                  setActiveTab('dashboard');
                }}
                className={`px-2 py-0.5 rounded ${
                  activeView === 'teacher' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Teacher
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
