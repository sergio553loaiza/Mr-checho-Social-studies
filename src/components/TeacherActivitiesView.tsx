import React, { useState, useEffect } from 'react';
import { BookOpen, Users, CheckCircle2, Clock, HelpCircle, Plus, Sparkles, Check } from 'lucide-react';
import { Activity, ActivityAttempt } from '../types';
import { useActivities } from '../services/activityStorage';
import { subscribeToTeacherDashboard } from '../services/firestore';
import { AddActivityModal } from './AddActivityModal';

export const TeacherActivitiesView: React.FC = () => {
  const activities = useActivities();
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToTeacherDashboard((list) => {
      setAttempts(list);
    });
    return () => unsub();
  }, []);

  const handleActivityCreated = (newAct: Activity) => {
    setSuccessMessage(`Activity "${newAct.title}" was successfully added to the Curriculum and is now live for students!`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header with Add Activity Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Curriculum Management
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {activities.length} Active {activities.length === 1 ? 'Unit' : 'Units'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Social Studies Curriculum Activities
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage interactive Montessori units, inspect question banks, and create new 10-question activities.
          </p>
        </div>

        {/* Teacher-only "Add Activity" button */}
        <button
          id="btn-add-activity"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-2xl shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between gap-3 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-6">
        {activities.map((activity) => {
          const actAttempts = attempts.filter((a) => a.activityId === activity.id);
          const completed = actAttempts.filter((a) => a.status === 'COMPLETED');
          const avgScore =
            completed.length > 0
              ? Math.round(
                  completed.reduce((acc, a) => acc + (a.percentage || 0), 0) /
                    completed.length
                )
              : 0;

          const isCore = !activity.id.startsWith('act-');

          return (
            <div
              key={activity.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {activity.topic}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activity.gradeLevel}
                    </span>
                    {/* Grade Target Audience Badge */}
                    {activity.grade === '4' ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        Exclusivo 4to Grado
                      </span>
                    ) : activity.grade === '5' ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        Exclusivo 5to Grado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Compartido (4to y 5to)
                      </span>
                    )}
                    {isCore ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Core Unit
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Instructor Created
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center shrink-0 min-w-[280px]">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      Total Attempts
                    </span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                      {actAttempts.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase block">
                      Completed
                    </span>
                    <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                      {completed.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-purple-600 uppercase block">
                      Avg Score
                    </span>
                    <span className="text-lg font-bold text-purple-700 mt-0.5 block">
                      {completed.length > 0 ? `${avgScore}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions List preview */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {activity.activityType === 'word-search'
                    ? `Civics Vocabulary Words (${activity.wordSearchWords?.length || activity.questions.length} Words)`
                    : activity.activityType === 'matching'
                    ? `Concepts & Matching Definitions (${activity.questions.length} Pairs)`
                    : `Questions in this Activity (${activity.questions.length})`}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                  {activity.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2"
                    >
                      <span className="font-bold text-indigo-600 flex-shrink-0">
                        {activity.activityType === 'word-search'
                          ? `#${qIdx + 1}`
                          : activity.activityType === 'matching'
                          ? `Pair ${qIdx + 1}:`
                          : `Q${qIdx + 1}.`}
                      </span>
                      <span className="line-clamp-2">
                        {activity.activityType === 'word-search' ? (
                          <>
                            <strong className="text-slate-900 tracking-wider font-extrabold">
                              {q.questionText}
                            </strong>{' '}
                            <span className="text-slate-400">—</span>{' '}
                            <span>{q.options[0] || q.explanation}</span>
                          </>
                        ) : activity.activityType === 'matching' ? (
                          <>
                            <strong className="text-slate-900">{q.questionText}</strong>{' '}
                            <span className="text-slate-400">➔</span>{' '}
                            <span>{q.options[q.correctAnswerIndex]}</span>
                          </>
                        ) : (
                          q.questionText
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Activity Modal Form */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onActivityCreated={handleActivityCreated}
      />
    </div>
  );
};
