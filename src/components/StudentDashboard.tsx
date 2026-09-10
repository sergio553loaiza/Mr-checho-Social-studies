import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Compass,
  RotateCcw,
  Scale,
  Search,
  Shield,
  Heart,
  Users,
  Leaf,
  Layers,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { AppUser, Activity, ActivityAttempt, AttemptStatus, ActivityGrade, getGradeFromGroup } from '../types';
import { useActivities } from '../services/activityStorage';
import { subscribeToStudentAttempts } from '../services/firestore';

interface StudentDashboardProps {
  user: AppUser;
  selectedGrade: ActivityGrade;
  onChangeGrade: () => void;
  onSelectActivity: (activity: Activity) => void;
}

type FilterTab = 'ALL' | 'IN_PROGRESS' | 'COMPLETED';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  selectedGrade,
  onChangeGrade,
  onSelectActivity,
}) => {
  const allActivities = useActivities();
  const [attempts, setAttempts] = useState<Record<string, ActivityAttempt>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [showCharter, setShowCharter] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToStudentAttempts(
      user.uid,
      (attemptList) => {
        const attemptMap: Record<string, ActivityAttempt> = {};
        attemptList.forEach((att) => {
          attemptMap[att.activityId] = att;
        });
        setAttempts(attemptMap);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load student attempts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Determine student's effective grade:
  // If user is a student and has an assigned group (4A, 4B, 4C -> '4', 5A, 5B, 5C -> '5'), lock to their group grade.
  // Otherwise, use selectedGrade (for teachers previewing or students prior to selection).
  const effectiveGrade: ActivityGrade =
    user.role === 'student' && user.studentGroup
      ? getGradeFromGroup(user.studentGroup)
      : selectedGrade || '5';

  // Filter activities strictly by grade:
  // Grade 4 students -> only see 4th Grade activities + shared ('both')
  // Grade 5 students -> only see 5th Grade activities + shared ('both')
  // Shared ('both') -> visible in both 4th and 5th Grade views!
  const gradeActivities = allActivities.filter((act) => {
    const actGrade = act.grade || 'both';
    if (effectiveGrade === '4') {
      return actGrade === '4' || actGrade === 'both';
    }
    if (effectiveGrade === '5') {
      return actGrade === '5' || actGrade === 'both';
    }
    return true; // 'both' shows all (for teacher curriculum preview)
  });

  // Derived metrics for current grade activities
  const attemptsList = (Object.values(attempts) as ActivityAttempt[]).filter((a) =>
    gradeActivities.some((act) => act.id === a.activityId)
  );

  const completedCount = attemptsList.filter(
    (a) => a.status === 'COMPLETED'
  ).length;

  const inProgressCount = attemptsList.filter(
    (a) => a.status === 'IN PROGRESS'
  ).length;

  const completedAttempts = attemptsList.filter(
    (a) => a.status === 'COMPLETED'
  );

  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : 0;

  // Filter activities by tab (All, In Progress, Completed)
  const filteredActivities = gradeActivities.filter((act) => {
    const att = attempts[act.id];
    const status: AttemptStatus = att ? att.status : 'NOT STARTED';

    if (filterTab === 'IN_PROGRESS') {
      return status === 'IN PROGRESS';
    }
    if (filterTab === 'COMPLETED') {
      return status === 'COMPLETED';
    }
    return true;
  });

  const gradeTitle =
    effectiveGrade === '4'
      ? '4th Grade Social Studies'
      : effectiveGrade === '5'
      ? '5th Grade Social Studies'
      : '4th & 5th Grade Social Studies';

  const rankTitle =
    completedCount >= 3
      ? 'Master Cartographer'
      : completedCount >= 2
      ? 'Global Explorer'
      : completedCount >= 1
      ? 'Junior Explorer'
      : 'Montessori Scholar';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header & Grade Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>{gradeTitle}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs font-semibold text-slate-500">Colegio Montessori Medellín</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome, {user.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            {effectiveGrade === '4'
              ? 'Explore foundational democracy challenges, civics matching, rights, duties, and active citizenship investigations.'
              : 'Explore interactive curriculum missions, Colombian national symbols, democratic rights, and collaborative investigations.'}
          </p>
        </div>

        {/* Grade Display / Quick Switcher */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {user.role === 'student' && user.studentGroup ? 'Grupo Asignado' : 'Active Level'}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {user.role === 'student' && user.studentGroup
                ? `Grupo ${user.studentGroup} • Grado ${effectiveGrade}`
                : effectiveGrade === 'both'
                ? 'Grades 4 & 5'
                : `Grade ${effectiveGrade}`}
            </span>
          </div>
          {user.role === 'teacher' ? (
            <button
              id="change-grade-btn"
              type="button"
              onClick={onChangeGrade}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Cambiar Vista (Profesor)</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-2xs">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>{user.studentGroup ? `Grupo ${user.studentGroup}` : `Grado ${effectiveGrade}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* GRADE-SPECIFIC INTRODUCTION BANNER */}
      {effectiveGrade === '4' ? (
        <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-blue-200 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>4th Grade Civics &amp; Democracy Expedition</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-3">
              Hello Young Citizens and Explorers!
            </h3>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
              Welcome to our 4th Grade Social Studies digital lab! Here we uncover how democracy works, the power of community participation, free and fair elections, human rights, and our civic duties. Get ready to test your knowledge with the official Follow Up 1 challenge and interactive vocabulary activities!
            </p>
          </div>
        </div>
      ) : (effectiveGrade === '5' || effectiveGrade === 'both') && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>5th Grade Expedition Launch</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-3">
              Hello Historians and Explorers!
            </h3>

            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-normal">
              Welcome to our 5th Grade Social Studies digital hub. This year, we aren&apos;t just reading history—we are stepping into it! Together, we will travel back to the 19th century to uncover the mysteries of Colombia&apos;s independence, debate constitutional rights, explore our rich biodiversity, and discover how YOU can shape our world as an active global citizen.
            </p>
          </div>
        </div>
      )}

      {/* OUR EXPEDITION CHARTER (Visually attractive, elegant 3-principle grid) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                OUR EXPEDITION CHARTER
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Three core principles guiding our Montessori Social Studies Lab
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCharter(!showCharter)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer p-1"
            aria-label="Toggle Charter"
          >
            <span>{showCharter ? 'Hide' : 'View Charter'}</span>
            {showCharter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCharter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Principle 1: Respect Yourself */}
            <div className="bg-amber-50/40 rounded-2xl p-4 sm:p-5 border border-amber-100/80 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h5 className="text-xs sm:text-sm font-black text-amber-900 tracking-tight uppercase">
                  RESPECT YOURSELF
                </h5>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Express ideas fearlessly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Ask questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Do your best</span>
                </li>
              </ul>
            </div>

            {/* Principle 2: Respect Others */}
            <div className="bg-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-100/80 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h5 className="text-xs sm:text-sm font-black text-indigo-900 tracking-tight uppercase">
                  RESPECT OTHERS
                </h5>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Active listening</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Disagree with ideas, never with people</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Support teammates</span>
                </li>
              </ul>
            </div>

            {/* Principle 3: Respect the Environment */}
            <div className="bg-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-100/80 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h5 className="text-xs sm:text-sm font-black text-emerald-900 tracking-tight uppercase">
                  RESPECT THE ENVIRONMENT
                </h5>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Care for devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Keep our physical and digital spaces organized</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row (Professional 4-Card Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Completed
          </span>
          <span className="text-3xl font-black text-indigo-600">
            {String(completedCount).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            of {gradeActivities.length} grade activities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            In Progress
          </span>
          <span className="text-3xl font-black text-amber-500">
            {String(inProgressCount).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            saved automatically to cloud
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Avg. Score
          </span>
          <span className="text-3xl font-black text-emerald-500">
            {completedAttempts.length > 0 ? `${averageScore}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            {completedAttempts.length > 0 ? 'accuracy on completed' : 'start your first activity'}
          </span>
        </div>

        <div className="bg-indigo-600 p-5 rounded-2xl shadow-md flex flex-col justify-center items-center text-white text-center">
          <span className="text-xs font-medium opacity-80 uppercase tracking-wider">
            Rank
          </span>
          <span className="text-lg font-bold mt-0.5">
            {rankTitle}
          </span>
          <span className="text-[10px] text-indigo-200 mt-1 font-medium">
            Montessori Elementary
          </span>
        </div>
      </div>

      {/* Activities Section */}
      <div className="space-y-6">
        {/* Section Header & Three Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {gradeTitle} Activities
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select an activity below. Your progress saves automatically to Firestore at every question.
            </p>
          </div>

          <div className="flex gap-2 bg-slate-200/50 p-1 rounded-lg self-start sm:self-auto border border-slate-200">
            <button
              id="student-filter-all"
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ALL ({gradeActivities.length})
            </button>
            <button
              id="student-filter-inprogress"
              type="button"
              onClick={() => setFilterTab('IN_PROGRESS')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterTab === 'IN_PROGRESS'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              IN PROGRESS {inProgressCount > 0 && `(${inProgressCount})`}
            </button>
            <button
              id="student-filter-completed"
              type="button"
              onClick={() => setFilterTab('COMPLETED')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterTab === 'COMPLETED'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              COMPLETED {completedCount > 0 && `(${completedCount})`}
            </button>
          </div>
        </div>

        {/* Activity Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading activities from Firestore...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-700">No activities found</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no activities matching the &quot;{filterTab.replace('_', ' ')}&quot; filter for {gradeTitle}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((act) => {
              const attempt = attempts[act.id];
              const status: AttemptStatus = attempt ? attempt.status : 'NOT STARTED';
              
              // Accurate progress percentage calculation:
              let percent = 0;
              if (status === 'COMPLETED') {
                percent = 100;
              } else if (attempt) {
                if (act.activityType === 'colombian-symbols') {
                  const completedSymbols = attempt.completedSections?.length || 0;
                  percent = Math.min(100, Math.round((completedSymbols / 9) * 100));
                } else if (act.activityType === 'word-search') {
                  const answeredCount = attempt.answers ? Object.keys(attempt.answers).length : 0;
                  percent = Math.min(100, Math.round((answeredCount / 12) * 100));
                } else {
                  const answeredCount = attempt.answers ? Object.keys(attempt.answers).length : 0;
                  const totalQ = act.questions?.length || 10;
                  percent = Math.min(100, Math.round((answeredCount / totalQ) * 100));
                }
              }

              const isInProgress = status === 'IN PROGRESS';
              const isCompleted = status === 'COMPLETED';

              const gradeTag =
                act.grade === 'both'
                  ? 'Grade 4 & 5'
                  : act.grade === '4'
                  ? 'Grade 4'
                  : 'Grade 5';

              const category = act.category || act.topic || 'Social Studies';

              return (
                <div
                  key={act.id}
                  id={`activity-card-${act.id}`}
                  className={`bg-white rounded-2xl border p-6 flex flex-col shadow-xs relative overflow-hidden transition-all group hover:shadow-md ${
                    isInProgress
                      ? 'border-2 border-indigo-300'
                      : isCompleted
                      ? 'border-emerald-200'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {/* Top Badges: Grade & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {gradeTag}
                    </span>

                    {isInProgress ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        In Progress
                      </span>
                    ) : isCompleted ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Not Started
                      </span>
                    )}
                  </div>

                  {/* Icon Box & Category */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {act.iconName === 'Award' || act.activityType === 'follow-up' ? (
                        <Award className="w-6 h-6 text-amber-600" />
                      ) : act.iconName === 'Search' || act.activityType === 'word-search' ? (
                        <Search className="w-6 h-6" />
                      ) : act.iconName === 'Scale' ? (
                        <Scale className="w-6 h-6" />
                      ) : (
                        <Compass className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        {category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Est. {act.estimatedMinutes} mins
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-4 flex-grow">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                      {act.description}
                    </p>
                  </div>

                  {/* Score pill if completed */}
                  {isCompleted && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-800">Final Score:</span>
                      <span className="font-bold text-emerald-700">
                        {attempt?.finalScore !== undefined
                          ? `${attempt.finalScore} / 10 (${attempt.percentage}%)`
                          : `${attempt?.percentage || 100}%`}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-auto pt-3 space-y-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">Progress</span>
                      <span
                        className={`font-black ${
                          isCompleted
                            ? 'text-emerald-600'
                            : percent > 0
                            ? 'text-indigo-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Action Button: Start / Continue / Review */}
                    <button
                      id={`start-activity-btn-${act.id}`}
                      type="button"
                      onClick={() => onSelectActivity(act)}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                        isCompleted
                          ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                          : isInProgress
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                      }`}
                    >
                      {status === 'NOT STARTED' && (
                        <>
                          <span>Start Activity</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                      {status === 'IN PROGRESS' && (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                      {status === 'COMPLETED' && (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Review / Practice Again</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
