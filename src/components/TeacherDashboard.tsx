import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ActivityAttempt, StudentGroup, STUDENT_GROUPS } from '../types';
import { useActivities } from '../services/activityStorage';
import { subscribeToTeacherDashboard, cleanTestActivityAttempts } from '../services/firestore';
import { AttemptDetailModal } from './AttemptDetailModal';

type StatusFilter = 'ALL' | 'IN PROGRESS' | 'COMPLETED';
type GroupFilter = 'ALL' | StudentGroup | 'UNASSIGNED';

export const TeacherDashboard: React.FC = () => {
  const activities = useActivities();
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL');

  // Selected attempt for detailed modal view
  const [selectedAttempt, setSelectedAttempt] = useState<ActivityAttempt | null>(null);

  // Real-time Firestore listener for live updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Safely remove any legacy test attempt records from Firestore
    cleanTestActivityAttempts().catch((err) => {
      console.warn('Test activity cleanup notice:', err);
    });

    const unsubscribe = subscribeToTeacherDashboard(
      (data) => {
        setAttempts(data);
        setLoading(false);
      },
      (err) => {
        console.error('Teacher dashboard listener error:', err);
        setError('Failed to connect to real-time student attempt stream.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Summary Metrics
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');
  const inProgressAttempts = attempts.filter((a) => a.status === 'IN PROGRESS');

  const classAverage =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : 0;

  // Filtered List
  const filteredAttempts = attempts.filter((attempt) => {
    // Student search filter (name or email)
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const matchName = (attempt.studentName || '').toLowerCase().includes(q);
      const matchEmail = (attempt.studentEmail || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // Activity filter
    if (activityFilter !== 'ALL' && attempt.activityId !== activityFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && attempt.status !== statusFilter) {
      return false;
    }

    // Group filter
    if (groupFilter === 'UNASSIGNED') {
      if (attempt.studentGroup) return false;
    } else if (groupFilter !== 'ALL' && attempt.studentGroup !== groupFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Live Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Instructor Portal
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Real-Time Stream
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Mr Checho&apos;s Teacher Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time classroom monitoring of student activities, live progress, and question-level responses.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Required Metric Blocks (Professional Polish Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0">
        {/* TOTAL STUDENT ATTEMPTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Student Attempts
          </span>
          <span className="text-3xl font-black text-indigo-600">
            {String(totalAttempts).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">across all students</span>
        </div>

        {/* COMPLETED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Completed
          </span>
          <span className="text-3xl font-black text-emerald-500">
            {String(completedAttempts.length).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            {totalAttempts > 0
              ? `${Math.round((completedAttempts.length / totalAttempts) * 100)}% completion rate`
              : '0% completion'}
          </span>
        </div>

        {/* IN PROGRESS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            In Progress
          </span>
          <span className="text-3xl font-black text-amber-500">
            {String(inProgressAttempts.length).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">active student sessions</span>
        </div>

        {/* CLASS AVERAGE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Class Average
          </span>
          <span className="text-3xl font-black text-indigo-600">
            {completedAttempts.length > 0 ? `${classAverage}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">across completed attempts</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Classroom Filter Controls</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredAttempts.length} of {totalAttempts} attempts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Student Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Student Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="teacher-filter-student-input"
                type="text"
                placeholder="Search by student name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Group Filter
            </label>
            <select
              id="teacher-filter-group-select"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as GroupFilter)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
            >
              <option value="ALL">All Groups (4A-C, 5A-C)</option>
              <optgroup label="Grado 4°">
                <option value="4A">Grupo 4A</option>
                <option value="4B">Grupo 4B</option>
                <option value="4C">Grupo 4C</option>
              </optgroup>
              <optgroup label="Grado 5°">
                <option value="5A">Grupo 5A</option>
                <option value="5B">Grupo 5B</option>
                <option value="5C">Grupo 5C</option>
              </optgroup>
              <option value="UNASSIGNED">Sin Grupo Asignado</option>
            </select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Activity
            </label>
            <select
              id="teacher-filter-activity-select"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Activities</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (All, In Progress, Completed) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Status Filter
            </label>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('IN PROGRESS')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'IN PROGRESS'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Attempts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Student Activity Records
            </h3>
            <p className="text-xs text-slate-500">
              Updates automatically as students answer questions in their browser.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Connecting to Firestore real-time collection...
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="text-base font-bold text-slate-700">No student attempts found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {totalAttempts === 0
                ? 'When students sign in with their institutional Google accounts and begin an activity, their progress will appear here in real time.'
                : 'No attempts match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Activity
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((attempt) => {
                  const formattedLastUpdated = new Date(
                    attempt.lastUpdatedAt
                  ).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const answeredCount = attempt.answers
                    ? Object.keys(attempt.answers).length
                    : 0;

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {attempt.studentName}
                          </span>
                          {attempt.studentGroup && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${
                                attempt.studentGroup.startsWith('4')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {attempt.studentGroup}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {attempt.studentEmail}
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {attempt.activityTitle}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            attempt.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              attempt.status === 'COMPLETED'
                                ? 'bg-emerald-600'
                                : 'bg-amber-600 animate-pulse'
                            }`}
                          />
                          {attempt.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                attempt.status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{
                                width: `${
                                  attempt.status === 'COMPLETED'
                                    ? 100
                                    : attempt.percentage !== undefined
                                    ? attempt.percentage
                                    : Math.round(
                                        (answeredCount / (attempt.totalQuestions || 10)) * 100
                                      )
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {attempt.status === 'COMPLETED'
                              ? '100%'
                              : `${
                                  attempt.percentage !== undefined
                                    ? attempt.percentage
                                    : Math.round(
                                        (answeredCount / (attempt.totalQuestions || 10)) * 100
                                      )
                                }%`}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-6 py-4">
                        {attempt.status === 'COMPLETED' ? (
                          <span className="font-bold text-emerald-700 text-sm">
                            {attempt.score} / {attempt.totalQuestions} ({attempt.percentage}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">—</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {formattedLastUpdated}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAttempt(attempt);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AttemptDetailModal
        attempt={selectedAttempt}
        isOpen={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
      />
    </div>
  );
};
