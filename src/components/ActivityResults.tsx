import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Activity, ActivityAttempt } from '../types';

interface ActivityResultsProps {
  activity: Activity;
  attempt: ActivityAttempt;
  onBackToActivities: () => void;
  onRetake?: () => void;
}

export const ActivityResults: React.FC<ActivityResultsProps> = ({
  activity,
  attempt,
  onBackToActivities,
  onRetake,
}) => {
  const [showReview, setShowReview] = useState(false);

  const total = attempt.totalQuestions || activity.questions.length;
  const score = attempt.score;
  const percentage = attempt.percentage;
  const correctCount = score;
  const incorrectCount = total - score;

  const isMastery = percentage >= 80;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/40 p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-2xl opacity-70 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-70 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200 mb-4">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Great job!
          </h2>
          <p className="text-slate-600 font-medium text-base mt-1">
            You completed <span className="font-semibold text-indigo-700">{activity.title}</span>
          </p>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Score
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {score} <span className="text-slate-400 text-lg">/ {total}</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Percentage
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-700 mt-1">
                {percentage}%
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Correct
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
                {correctCount}
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
              <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Incorrect
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-700 mt-1">
                {incorrectCount}
              </div>
            </div>
          </div>

          {/* Encouraging message */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {isMastery
              ? 'Outstanding mastery of global geography!'
              : 'Keep practicing to reinforce your continents and oceans knowledge!'}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="results-review-answers-btn"
              type="button"
              onClick={() => setShowReview(!showReview)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50/60 transition-colors flex items-center justify-center gap-2"
            >
              <span>{showReview ? 'Hide Answers' : 'Review Answers'}</span>
              {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              id="results-back-to-activities-btn"
              type="button"
              onClick={onBackToActivities}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Activities</span>
            </button>

            {onRetake && (
              <button
                id="results-retake-btn"
                type="button"
                onClick={onRetake}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Answers Accordion / Detailed Breakdown */}
      {showReview && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900">
              Detailed Question Review
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {total} Questions Total
            </span>
          </div>

          <div className="space-y-4">
            {activity.questions.map((q, index) => {
              const studentAnswer = attempt.answers[q.id];
              const isAnswered = !!studentAnswer;
              const isCorrect = studentAnswer?.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 transition-shadow ${
                    isCorrect
                      ? 'border-emerald-200 shadow-xs'
                      : isAnswered
                      ? 'border-rose-200 shadow-xs'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                        {q.questionText}
                      </h4>
                    </div>

                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs sm:text-sm">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = studentAnswer?.selectedOptionIndex === optIdx;
                      const isActualCorrect = optIdx === q.correctAnswerIndex;

                      let style = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isActualCorrect) {
                        style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                      } else if (isChosen && !isCorrect) {
                        style = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white/80 border text-[11px] font-bold flex items-center justify-center">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isChosen && (
                            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-white/90">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950">
                    <span className="font-bold block mb-0.5 text-indigo-900">
                      Montessori Learning Note:
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
