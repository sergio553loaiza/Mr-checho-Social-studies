import React from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Sparkles,
  Search,
  BookOpen,
  Compass,
} from 'lucide-react';
import { ActivityAttempt } from '../types';
import { getActivityById } from '../data/activities';
import { NATIONAL_SYMBOLS_MAPS } from '../data/colombianSymbolsData';

interface AttemptDetailModalProps {
  attempt: ActivityAttempt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttemptDetailModal: React.FC<AttemptDetailModalProps> = ({
  attempt,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !attempt) return null;

  const activity = getActivityById(attempt.activityId);

  const formattedStarted = attempt.startedAt
    ? new Date(attempt.startedAt).toLocaleString()
    : '—';
  const formattedLastUpdated = attempt.lastUpdatedAt
    ? new Date(attempt.lastUpdatedAt).toLocaleString()
    : '—';
  const formattedCompleted = attempt.completedAt
    ? new Date(attempt.completedAt).toLocaleString()
    : 'In Progress';

  const answeredCount = attempt.answers ? Object.keys(attempt.answers).length : 0;
  const questionsList = activity ? activity.questions : [];
  const isWordSearch =
    activity?.activityType === 'word-search' ||
    attempt.activityId === 'democracy-vocabulary-search';
  const isColombianSymbols =
    activity?.activityType === 'colombian-symbols' ||
    attempt.activityId === 'colombian-symbols-mind-maps';
  const isFollowUp =
    activity?.activityType === 'follow-up' ||
    attempt.activityId === 'follow-up-1-democracy-challenge';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-5 sm:p-6 text-white flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
              Student Activity Attempt Detail
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {attempt.studentName}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {attempt.studentEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attempt Metadata Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Activity
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block mt-0.5">
                {attempt.activityTitle}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                  attempt.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {attempt.status}
              </span>
            </div>

            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-600 uppercase block">
                {isColombianSymbols || isFollowUp ? 'Final Grade' : 'Score'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-indigo-900 mt-0.5 block">
                {isColombianSymbols || isFollowUp
                  ? attempt.finalScore !== undefined
                    ? `${attempt.finalScore.toFixed(1)} / 10.0`
                    : attempt.status === 'COMPLETED'
                    ? `${(1 + (attempt.score / (attempt.totalQuestions || 20)) * 9).toFixed(1)} / 10.0`
                    : 'In Progress'
                  : attempt.status === 'COMPLETED'
                  ? `${attempt.score} / ${attempt.totalQuestions}`
                  : `${attempt.score} / ${answeredCount} answered`}
              </span>
            </div>

            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
              <span className="text-[11px] font-bold text-purple-600 uppercase block">
                {isColombianSymbols || isFollowUp ? 'Evaluation Status' : 'Percentage'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-purple-900 mt-0.5 block">
                {(isColombianSymbols || isFollowUp) && attempt.status === 'COMPLETED'
                  ? (attempt.finalScore !== undefined ? attempt.finalScore : (1 + (attempt.score / (attempt.totalQuestions || 20)) * 9)) >= 7.0
                    ? 'PASSED (≥ 7.0)'
                    : 'NEEDS REVIEW (< 7.0)'
                  : `${attempt.percentage}%`}
              </span>
            </div>
          </div>

          {/* Timestamps Row */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 font-semibold block">Started:</span>
              <span className="font-medium">{formattedStarted}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Last Updated:</span>
              <span className="font-medium">{formattedLastUpdated}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Completed:</span>
              <span className="font-medium">{formattedCompleted}</span>
            </div>
          </div>

          {/* Question Breakdown, Word Search, OR Colombian Symbols Mind Maps */}
          <div>
            {isColombianSymbols ? (
              <div className="space-y-6">
                {/* Rubric Breakdown & Feedback if available */}
                {attempt.evaluationCriteria && (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        Rubric Evaluation Breakdown (Scale 1.0 - 10.0)
                      </h4>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Passing: 7.0 / 10
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Accuracy &amp; Understanding (30%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.accuracyAndUnderstanding} / 3.0
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Completeness (20%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.completeness} / 2.0
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Explanation &amp; Reasoning (20%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.explanationAndReasoning} / 2.0
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Use of Vocabulary (10%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.vocabulary} / 1.0
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Connection to Identity (10%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.connectionToIdentity} / 1.0
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Reflection / Own Thinking (10%)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {attempt.evaluationCriteria.reflection} / 1.0
                        </span>
                      </div>
                    </div>

                    {attempt.feedback && (
                      <div className="p-4 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 space-y-1">
                        <span className="font-bold text-amber-900 block uppercase text-[10px] tracking-wider">
                          Evaluation Feedback &amp; Recommendations
                        </span>
                        <p className="leading-relaxed whitespace-pre-line font-medium">
                          {attempt.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mind Map Symbols and Student Responses */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Student Mind Map Branches &amp; Responses
                  </h4>

                  {NATIONAL_SYMBOLS_MAPS.map((symbolMap) => {
                    const studentResponses = attempt.responses || {};
                    const completedCount = symbolMap.branches.filter((b) => {
                      const text = (studentResponses[b.id] || '').trim();
                      return text.split(/\s+/).filter(Boolean).length >= b.minWords;
                    }).length;
                    const isSymbolDone = completedCount === symbolMap.branches.length;

                    // If student hasn't touched any branch of this symbol, only show if it's the primary (flag) or has answers
                    const hasAnyAnswer = symbolMap.branches.some(
                      (b) => (studentResponses[b.id] || '').trim().length > 0
                    );
                    if (!hasAnyAnswer && symbolMap.key !== 'flag') return null;

                    return (
                      <div
                        key={symbolMap.id}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs"
                      >
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                              🇨🇴
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              {symbolMap.title}
                            </span>
                            <span className="text-xs text-slate-500 hidden sm:inline">
                              ({symbolMap.spanishTitle})
                            </span>
                          </div>

                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              isSymbolDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {completedCount} / {symbolMap.branches.length} Branches Written
                          </span>
                        </div>

                        <div className="p-4 space-y-3 divide-y divide-slate-100">
                          {symbolMap.branches.map((b) => {
                            const ans = (studentResponses[b.id] || '').trim();
                            const words = ans.split(/\s+/).filter(Boolean).length;
                            const isBranchDone = words >= b.minWords;

                            return (
                              <div key={b.id} className="pt-3 first:pt-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: b.color }}
                                    />
                                    <span className="text-xs font-bold text-slate-800">
                                      {b.title}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                      isBranchDone
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : words > 0
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {words} words • {isBranchDone ? '✓ Completed' : words > 0 ? '◐ In progress' : '○ Not started'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 italic">
                                  &ldquo;{b.question}&rdquo;
                                </p>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
                                  {ans ? (
                                    ans
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      No response written for this branch yet.
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isWordSearch ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-600" />
                    Target Vocabulary Discovery ({answeredCount}/12 Words Found)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Live Word Search Record
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {questionsList.map((q, idx) => {
                    const word = q.questionText.toUpperCase();
                    const answer = attempt.answers
                      ? attempt.answers[word] || attempt.answers[q.id]
                      : undefined;
                    const isFound = !!answer && answer.isCorrect;
                    const foundTime = answer?.answeredAt
                      ? new Date(answer.answeredAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null;

                    return (
                      <div
                        key={q.id || word}
                        className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                          isFound
                            ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {idx + 1}.
                            </span>
                            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-wide">
                              {word}
                            </span>
                          </div>
                          {isFound ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                              <Clock className="w-3 h-3" /> In Progress
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {q.options[0] || q.explanation}
                        </p>

                        {isFound && foundTime && (
                          <div className="mt-2 pt-2 border-t border-emerald-100 text-[11px] text-emerald-700 font-medium">
                            Discovered at {foundTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Detailed Question Responses ({answeredCount}/{attempt.totalQuestions})
                  </h4>
                  <span className="text-xs text-slate-500">
                    Live Firestore Record
                  </span>
                </div>

                <div className="space-y-4">
                  {questionsList.map((q, idx) => {
                    const isMatching = activity?.activityType === 'matching';
                    const answer = attempt.answers ? attempt.answers[q.id] : undefined;
                    const isAnswered = !!answer;
                    const isCorrect = answer?.isCorrect;
                    const studentChoiceText =
                      isAnswered && answer.userAnswerText
                        ? answer.userAnswerText
                        : isAnswered && answer.selectedOptionIndex !== undefined && q.options[answer.selectedOptionIndex]
                        ? q.options[answer.selectedOptionIndex]
                        : 'Not yet answered';
                    const correctChoiceText =
                      q.correctAnswerText || q.options[q.correctAnswerIndex] || '—';

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          !isAnswered
                            ? 'bg-slate-50/60 border-slate-200 opacity-70'
                            : isCorrect
                            ? 'bg-emerald-50/30 border-emerald-200 shadow-xs'
                            : 'bg-rose-50/30 border-rose-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h5 className="font-semibold text-sm sm:text-base text-slate-900">
                              {isMatching ? `Concept: ${q.questionText}` : q.questionText}
                            </h5>
                          </div>

                          {isAnswered ? (
                            isCorrect ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        {/* Answers Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs sm:text-sm">
                          <div
                            className={`p-3 rounded-xl border ${
                              !isAnswered
                                ? 'bg-white border-slate-200 text-slate-400 italic'
                                : isCorrect
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50 border-rose-200 text-rose-950'
                            }`}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-0.5">
                              {isMatching ? 'Student Matched:' : 'Student Answer:'}
                            </span>
                            <span className="font-semibold">
                              {studentChoiceText}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border bg-emerald-50/50 border-emerald-200 text-emerald-950">
                            <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-700 mb-0.5">
                              {isMatching ? 'Correct Definition:' : 'Correct Answer:'}
                            </span>
                            <span className="font-semibold">
                              {correctChoiceText}
                            </span>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="mt-3 p-3 rounded-xl bg-slate-100 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            {activity?.topic ? `${activity.topic} Context:` : 'Montessori Context:'}
                          </span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Document ID: {attempt.id}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
