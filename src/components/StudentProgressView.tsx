import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AppUser, ActivityAttempt, getGradeFromGroup } from '../types';
import { useActivities } from '../services/activityStorage';
import { subscribeToStudentAttempts } from '../services/firestore';

interface StudentProgressViewProps {
  user: AppUser;
  onSelectActivityId: (activityId: string) => void;
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  user,
  onSelectActivityId,
}) => {
  const activities = useActivities();
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const studentGrade = user.studentGroup ? getGradeFromGroup(user.studentGroup) : user.selectedGrade;
  const gradeActivities = activities.filter((act) => {
    const actGrade = act.grade || 'both';
    if (studentGrade === '4') {
      return actGrade === '4' || actGrade === 'both';
    }
    if (studentGrade === '5') {
      return actGrade === '5' || actGrade === 'both';
    }
    return true;
  });

  useEffect(() => {
    const unsub = subscribeToStudentAttempts(
      user.uid,
      (list) => {
        setAttempts(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user.uid]);

  // Filter attempts relevant to student's grade
  const gradeAttempts = attempts.filter((att) =>
    gradeActivities.some((act) => act.id === att.activityId)
  );

  const completed = gradeAttempts.filter((a) => a.status === 'COMPLETED');
  const inProgress = gradeAttempts.filter((a) => a.status === 'IN PROGRESS');

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((acc, a) => acc + (a.percentage || 0), 0) / completed.length
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Learning Progress
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review your milestones, accuracy rates, and continuous growth across Social Studies topics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Completed Investigations
          </span>
          <span className="text-3xl font-black text-indigo-600">
            {String(completed.length).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            of {gradeActivities.length} total activities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            In Progress
          </span>
          <span className="text-3xl font-black text-amber-500">
            {String(inProgress.length).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            actively recording to cloud
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Average Score
          </span>
          <span className="text-3xl font-black text-emerald-500">
            {completed.length > 0 ? `${avgScore}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            accuracy across completed
          </span>
        </div>
      </div>

      {/* Detailed Attempt History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Activity Log & Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every answer is persistently recorded in Firebase Firestore
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Saved to Firestore
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading your progress records...
          </div>
        ) : gradeAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No activity attempts yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Start your first activity from the &quot;My Activities&quot; tab!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {gradeAttempts.map((att) => {
              const formattedLastUpdated = new Date(att.lastUpdatedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={att.id}
                  className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">
                        {att.activityTitle}
                      </h4>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          att.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Last active: {formattedLastUpdated}
                      </span>
                      <span>•</span>
                      <span>
                        {att.activityId === 'democracy-vocabulary-search'
                          ? `Words discovered: ${
                              att.answers ? Object.keys(att.answers).length : 0
                            } of 12`
                          : `Questions answered: ${
                              att.answers ? Object.keys(att.answers).length : 0
                            } of ${att.totalQuestions}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {att.status === 'COMPLETED' ? (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Final Score</span>
                        <span className="text-lg font-bold text-emerald-700">
                          {att.score} / {att.totalQuestions} ({att.percentage}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Current Progress</span>
                        <span className="text-lg font-bold text-indigo-700">
                          {att.percentage}%
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectActivityId(att.activityId)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                      title="Open Activity"
                    >
                      <ChevronRight className="w-5 h-5" />
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
