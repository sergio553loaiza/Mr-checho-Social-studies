import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Activity, ActivityAttempt, AppUser, StudentAnswer } from '../types';
import {
  getStudentAttempt,
  initializeAttempt,
  saveQuestionProgress,
} from '../services/firestore';
import { ActivityResults } from './ActivityResults';
import { MatchingActivityPlayer } from './MatchingActivityPlayer';
import { WordSearchPlayer } from './WordSearchPlayer';
import { ColombianSymbolsPlayer } from './ColombianSymbolsPlayer';
import { FollowUpPlayer } from './FollowUpPlayer';
import { ColombianSymbolsTestPlayer } from './ColombianSymbolsTestPlayer';

interface ActivityPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

export const ActivityPlayer: React.FC<ActivityPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  // If activity is Colombian Symbols Comprehension Challenge, route to ColombianSymbolsTestPlayer
  if (
    activity.activityType === 'symbols-challenge' ||
    activity.id === 'colombian-symbols-comprehension-test'
  ) {
    return (
      <ColombianSymbolsTestPlayer
        user={user}
        activity={activity}
        onBack={onBack}
      />
    );
  }

  // If activity is Follow Up 1, route to FollowUpPlayer
  if (activity.activityType === 'follow-up' || activity.id === 'follow-up-1-democracy-challenge') {
    return (
      <FollowUpPlayer
        user={user}
        activity={activity}
        onBack={onBack}
      />
    );
  }

  // If activity is Colombian Symbols Mind Maps, route to ColombianSymbolsPlayer
  if (activity.activityType === 'colombian-symbols' || activity.id === 'colombian-symbols-mind-maps') {
    return (
      <ColombianSymbolsPlayer
        user={user}
        activity={activity}
        onBack={onBack}
      />
    );
  }

  // If activity is an interactive matching game, route to MatchingActivityPlayer
  if (activity.activityType === 'matching') {
    return (
      <MatchingActivityPlayer
        user={user}
        activity={activity}
        onBack={onBack}
      />
    );
  }

  // If activity is an interactive word search, route to WordSearchPlayer
  if (activity.activityType === 'word-search') {
    return (
      <WordSearchPlayer
        user={user}
        activity={activity}
        onBack={onBack}
      />
    );
  }

  const [attempt, setAttempt] = useState<ActivityAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompletedView, setIsCompletedView] = useState<boolean>(false);

  // Current question's selected answer state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);

  // Initialize or restore attempt from Firestore on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAttempt() {
      setLoading(true);
      setSaveError(null);
      try {
        let existing = await getStudentAttempt(user.uid, activity.id);
        if (!existing) {
          existing = await initializeAttempt(
            user,
            activity.id,
            activity.title,
            activity.questions.length
          );
        }

        if (!isMounted) return;

        setAttempt(existing);

        if (existing.status === 'COMPLETED') {
          setIsCompletedView(true);
        } else {
          // Restore exact question position
          // If the question stored in existing.currentQuestionIndex is already answered,
          // find the first unanswered question, or use existing.currentQuestionIndex
          let targetIndex = existing.currentQuestionIndex || 0;
          if (targetIndex >= activity.questions.length) {
            targetIndex = 0;
          }

          // If targetIndex is already answered, see if there is an unanswered question
          const currentQ = activity.questions[targetIndex];
          if (existing.answers && existing.answers[currentQ.id]) {
            const firstUnanswered = activity.questions.findIndex(
              (q) => !existing.answers[q.id]
            );
            if (firstUnanswered !== -1) {
              targetIndex = firstUnanswered;
            }
          }

          setCurrentIndex(targetIndex);

          // If this question has an existing answer recorded, display it!
          const qAtTarget = activity.questions[targetIndex];
          if (existing.answers && existing.answers[qAtTarget.id]) {
            const prevAns = existing.answers[qAtTarget.id];
            setSelectedOption(prevAns.selectedOptionIndex);
            setHasAnsweredCurrent(true);
          } else {
            setSelectedOption(null);
            setHasAnsweredCurrent(false);
          }
        }
      } catch (err) {
        console.error('Failed to load or restore student attempt:', err);
        if (isMounted) {
          const fallbackAttempt: ActivityAttempt = {
            id: `${user.uid}_${activity.id}`,
            studentUid: user.uid,
            studentName: user.name,
            studentEmail: user.email,
            activityId: activity.id,
            activityTitle: activity.title,
            answers: {},
            currentQuestionIndex: 0,
            score: 0,
            totalQuestions: activity.questions.length,
            percentage: 0,
            status: 'NOT STARTED',
            startedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            completedAt: null,
          };
          setAttempt(fallbackAttempt);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAttempt();

    return () => {
      isMounted = false;
    };
  }, [user, activity]);

  // Handle when student clicks an option
  const handleSelectOption = useCallback(
    async (optionIndex: number) => {
      const currentQ = activity.questions[currentIndex];
      if (!currentQ) return;

      // If student already answered this question in this session, don't re-trigger
      if (hasAnsweredCurrent && attempt?.answers?.[currentQ.id]) {
        return;
      }

      // 1. Immediately reflect the student's answer in visual state
      setSelectedOption(optionIndex);
      setHasAnsweredCurrent(true);
      setSaveError(null);

      const isCorrect = optionIndex === currentQ.correctAnswerIndex;
      const answer: StudentAnswer = {
        questionId: currentQ.id,
        selectedOptionIndex: optionIndex,
        isCorrect,
        answeredAt: new Date().toISOString(),
      };

      // 2. Prepare the updated attempt
      const baseAttempt: ActivityAttempt = attempt || {
        id: `${user.uid}_${activity.id}`,
        studentUid: user.uid,
        studentName: user.name,
        studentEmail: user.email,
        activityId: activity.id,
        activityTitle: activity.title,
        answers: {},
        currentQuestionIndex: currentIndex,
        score: 0,
        totalQuestions: activity.questions.length,
        percentage: 0,
        status: 'IN PROGRESS',
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        completedAt: null,
      };

      const nextAnswers: Record<string, StudentAnswer> = {
        ...(baseAttempt.answers || {}),
        [currentQ.id]: answer,
      };

      const totalQ = activity.questions.length;
      const answeredCount = Object.keys(nextAnswers).length;
      const score = Object.values(nextAnswers).filter((a) => a.isCorrect).length;
      const percentage = Math.round((score / totalQ) * 100);
      const isAllAnswered = answeredCount >= totalQ;

      const updatedAttempt: ActivityAttempt = {
        ...baseAttempt,
        answers: nextAnswers,
        currentQuestionIndex: currentIndex,
        score,
        totalQuestions: totalQ,
        percentage,
        status: isAllAnswered ? 'COMPLETED' : 'IN PROGRESS',
        lastUpdatedAt: new Date().toISOString(),
        ...(isAllAnswered ? { completedAt: new Date().toISOString() } : {}),
      };

      // Update local attempt immediately so UI feedback is instantaneous
      setAttempt(updatedAttempt);

      // 3. Save progress asynchronously to Firestore in background
      setSaving(true);
      try {
        const savedAttempt = await saveQuestionProgress(
          user,
          activity.id,
          currentQ.id,
          answer,
          currentIndex,
          baseAttempt.answers || {},
          totalQ,
          isAllAnswered,
          activity.title
        );

        if (savedAttempt) {
          setAttempt(savedAttempt);
        }
      } catch (err: unknown) {
        console.error('Firestore save failed:', err);
        const error = err as Error;
        setSaveError(
          error.message || 'Progress saved locally. Cloud synchronization will retry.'
        );
      } finally {
        setSaving(false);
      }
    },
    [activity, currentIndex, hasAnsweredCurrent, attempt, user]
  );

  // Navigate to next question
  const handleNextQuestion = () => {
    setSaveError(null);
    if (!attempt) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex < activity.questions.length) {
      setCurrentIndex(nextIndex);
      const nextQ = activity.questions[nextIndex];
      if (attempt.answers && attempt.answers[nextQ.id]) {
        setSelectedOption(attempt.answers[nextQ.id].selectedOptionIndex);
        setHasAnsweredCurrent(true);
      } else {
        setSelectedOption(null);
        setHasAnsweredCurrent(false);
      }
    } else {
      // Completed all questions
      setIsCompletedView(true);
    }
  };

  // Jump to specific question (from the question pill bar)
  const handleJumpToQuestion = (index: number) => {
    if (!attempt) return;
    setCurrentIndex(index);
    const targetQ = activity.questions[index];
    if (attempt.answers && attempt.answers[targetQ.id]) {
      setSelectedOption(attempt.answers[targetQ.id].selectedOptionIndex);
      setHasAnsweredCurrent(true);
    } else {
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
    }
  };

  // Restart / practice again
  const handleRetake = () => {
    setIsCompletedView(false);
    setCurrentIndex(0);
    const firstQ = activity.questions[0];
    if (attempt?.answers && attempt.answers[firstQ.id]) {
      setSelectedOption(attempt.answers[firstQ.id].selectedOptionIndex);
      setHasAnsweredCurrent(true);
    } else {
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-bounce">
          <Compass className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Preparing your Social Studies Lab...
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Recovering your saved Firestore progress and question states.
        </p>
      </div>
    );
  }

  if (isCompletedView && attempt) {
    return (
      <ActivityResults
        activity={activity}
        attempt={attempt}
        onBackToActivities={onBack}
        onRetake={handleRetake}
      />
    );
  }

  const currentQ = activity.questions[currentIndex];
  const answeredCount = attempt?.answers ? Object.keys(attempt.answers).length : 0;
  const progressPercent = Math.round((answeredCount / activity.questions.length) * 100);
  const recordedAnswer = attempt?.answers ? attempt.answers[currentQ.id] : undefined;
  const isQuestionAnswered = !!recordedAnswer || (hasAnsweredCurrent && selectedOption !== null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Navigation & Status Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="activity-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Activities</span>
        </button>

        {/* Live Cloud Save Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {saving ? (
            <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full animate-pulse">
              <Save className="w-3.5 h-3.5 animate-spin" />
              Saving to Firestore...
            </span>
          ) : saveError ? (
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Cloud Sync Error
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Saved to Firestore
            </span>
          )}
        </div>
      </div>

      {/* Save Error Notice */}
      {saveError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <p className="font-semibold">{saveError}</p>
          </div>
          {selectedOption !== null && (
            <button
              type="button"
              onClick={() => handleSelectOption(selectedOption)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors whitespace-nowrap"
            >
              Retry Saving
            </button>
          )}
        </div>
      )}

      {/* Main Activity Board */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/30 overflow-hidden">
        {/* Activity Title & Progress Header */}
        <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {activity.topic}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {activity.title}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Question {currentIndex + 1} of {activity.questions.length}
              </div>
              <div className="text-base font-extrabold text-indigo-700">
                {progressPercent}% Complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Navigation Bubbles */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {activity.questions.map((q, idx) => {
              const ans = attempt?.answers ? attempt.answers[q.id] : undefined;
              const isCurrent = idx === currentIndex;
              const isCorrect = ans?.isCorrect;
              const hasAns = !!ans;

              let btnStyle = 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300';
              if (isCurrent) {
                btnStyle = 'ring-2 ring-indigo-600 border-indigo-600 font-bold text-indigo-700';
              } else if (hasAns && isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold';
              } else if (hasAns && !isCorrect) {
                btnStyle = 'bg-rose-50 border-rose-300 text-rose-700 font-semibold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`w-8 h-8 rounded-lg text-xs border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${btnStyle}`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6 sm:p-8">
          {/* Question Text */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Montessori Geography Inquiry</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correctAnswerIndex;

              // Visual feedback styling
              let optionClass =
                'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/20';

              if (isQuestionAnswered) {
                if (isCorrectAnswer) {
                  optionClass =
                    'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                } else if (isSelected && !isCorrectAnswer) {
                  optionClass =
                    'bg-rose-50/80 border-rose-400 text-rose-950 font-semibold ring-1 ring-rose-400';
                } else {
                  optionClass = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  id={`question-option-${idx}`}
                  type="button"
                  disabled={isQuestionAnswered && selectedOption !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${optionClass}`}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                        isQuestionAnswered && isCorrectAnswer
                          ? 'bg-emerald-600 text-white'
                          : isQuestionAnswered && isSelected && !isCorrectAnswer
                          ? 'bg-rose-600 text-white'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm sm:text-base">{option}</span>
                  </div>

                  {/* Immediate Feedback Icons */}
                  {isQuestionAnswered && (
                    <div>
                      {isCorrectAnswer && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      )}
                      {isSelected && !isCorrectAnswer && (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Montessori Explanation Card */}
          {isQuestionAnswered && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border border-indigo-100 shadow-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">
                    Montessori Concept Insight
                  </h4>
                  <p className="text-xs sm:text-sm text-indigo-900 mt-1 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              {isQuestionAnswered
                ? 'Answer recorded. Ready to continue.'
                : 'Select an option to record your answer.'}
            </div>

            {isQuestionAnswered && (
              <button
                id="activity-next-question-btn"
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {currentIndex + 1 < activity.questions.length
                    ? 'Next Question'
                    : 'Complete Activity'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
