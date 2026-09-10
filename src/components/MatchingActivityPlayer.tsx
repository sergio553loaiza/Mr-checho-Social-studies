import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Scale,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Activity, AppUser, ActivityAttempt, StudentAnswer } from '../types';
import {
  getStudentAttempt,
  initializeAttempt,
  saveQuestionProgress,
  resetStudentAttempt,
} from '../services/firestore';

interface MatchingActivityPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

interface ConceptItem {
  id: string; // Question ID (e.g. 'civics-match-1')
  concept: string; // e.g. 'DEMOCRACY'
  questionIndex: number; // 0..9
  correctDefinitionIndex: number; // 0..9
  explanation: string;
}

interface DefinitionItem {
  id: string; // e.g. 'def-0'
  definitionIndex: number; // 0..9
  text: string;
}

// Fisher-Yates independent shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const MatchingActivityPlayer: React.FC<MatchingActivityPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  const [attempt, setAttempt] = useState<ActivityAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Shuffled columns
  const [shuffledConcepts, setShuffledConcepts] = useState<ConceptItem[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<DefinitionItem[]>([]);

  // Selection states
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);

  // Feedback states
  const [mismatchedPair, setMismatchedPair] = useState<{
    conceptId: string;
    defId: string;
  } | null>(null);
  const [justMatchedPair, setJustMatchedPair] = useState<{
    conceptId: string;
    defId: string;
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Review toggle for completed view
  const [showCompletedReview, setShowCompletedReview] = useState<boolean>(true);

  // Prepare base concept and definition items from activity.questions
  const baseConcepts: ConceptItem[] = useMemo(() => {
    return activity.questions.map((q, idx) => ({
      id: q.id,
      concept: q.questionText,
      questionIndex: idx,
      correctDefinitionIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    }));
  }, [activity.questions]);

  const baseDefinitions: DefinitionItem[] = useMemo(() => {
    if (activity.questions.length === 0) return [];
    // The first question has all 10 options, or each has its matching option
    const sampleOptions = activity.questions[0].options;
    return sampleOptions.map((text, idx) => ({
      id: `def-${idx}`,
      definitionIndex: idx,
      text,
    }));
  }, [activity.questions]);

  // Function to perform independent shuffle
  const reShuffleColumns = () => {
    setShuffledConcepts(shuffleArray(baseConcepts));
    setShuffledDefinitions(shuffleArray(baseDefinitions));
    setSelectedConceptId(null);
    setSelectedDefId(null);
    setMismatchedPair(null);
    setJustMatchedPair(null);
  };

  // 1. Initialize or load Firestore attempt on mount
  useEffect(() => {
    let isMounted = true;

    async function loadOrCreateAttempt() {
      setLoading(true);
      try {
        let loaded = await getStudentAttempt(user.uid, activity.id);
        if (!loaded) {
          loaded = await initializeAttempt(
            user,
            activity.id,
            activity.title,
            activity.questions.length
          );
        }

        if (isMounted) {
          setAttempt(loaded);
          reShuffleColumns();
        }
      } catch (err) {
        console.error('Error loading matching activity attempt:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrCreateAttempt();

    return () => {
      isMounted = false;
    };
  }, [user, activity]);

  // Matched IDs set derived from attempt answers
  const matchedQuestionIds = useMemo(() => {
    const set = new Set<string>();
    if (!attempt?.answers) return set;
    (Object.values(attempt.answers) as StudentAnswer[]).forEach((ans) => {
      if (ans.isCorrect) {
        set.add(ans.questionId);
      }
    });
    return set;
  }, [attempt?.answers]);

  const matchedDefIndices = useMemo(() => {
    const set = new Set<number>();
    if (!attempt?.answers) return set;
    (Object.values(attempt.answers) as StudentAnswer[]).forEach((ans) => {
      if (ans.isCorrect && ans.selectedOptionIndex !== undefined) {
        set.add(ans.selectedOptionIndex);
      }
    });
    return set;
  }, [attempt?.answers]);

  const totalPairs = activity.questions.length || 10;
  const matchedCount = matchedQuestionIds.size;
  const isCompleted = matchedCount >= totalPairs || attempt?.status === 'COMPLETED';
  const progressPercent = Math.round((matchedCount / totalPairs) * 100);

  // Handle checking a concept and definition pair
  const evaluatePair = async (conceptId: string, defId: string) => {
    const conceptObj = baseConcepts.find((c) => c.id === conceptId);
    const defObj = baseDefinitions.find((d) => d.id === defId);

    if (!conceptObj || !defObj || !attempt) return;

    const isMatch = conceptObj.correctDefinitionIndex === defObj.definitionIndex;

    if (isMatch) {
      // Successful match
      setJustMatchedPair({ conceptId, defId });
      setFeedbackMessage({
        type: 'success',
        text: `Excellent! "${conceptObj.concept}" correctly matched with its definition.`,
      });
      setSelectedConceptId(null);
      setSelectedDefId(null);

      // Create student answer record
      const studentAnswer: StudentAnswer = {
        questionId: conceptId,
        selectedOptionIndex: defObj.definitionIndex,
        isCorrect: true,
        answeredAt: new Date().toISOString(),
      };

      const updatedAnswers: Record<string, StudentAnswer> = {
        ...attempt.answers,
        [conceptId]: studentAnswer,
      };

      const newScore = (Object.values(updatedAnswers) as StudentAnswer[]).filter((a) => a.isCorrect).length;
      const willBeCompleted = newScore >= totalPairs;

      setSaving(true);
      try {
        const updatedAttempt = await saveQuestionProgress(
          user,
          activity.id,
          conceptId,
          studentAnswer,
          newScore,
          updatedAnswers,
          totalPairs,
          willBeCompleted,
          activity.title
        );
        setAttempt(updatedAttempt);
      } catch (err) {
        console.error('Failed to save matching progress:', err);
      } finally {
        setSaving(false);
      }

      // Clear the celebratory highlight after a brief moment
      setTimeout(() => {
        setJustMatchedPair(null);
      }, 1500);
    } else {
      // Mismatch
      setMismatchedPair({ conceptId, defId });
      setFeedbackMessage({
        type: 'error',
        text: `Not quite a match. Read the definition carefully and try pairing "${conceptObj.concept}" with another description!`,
      });

      // Clear mismatch highlight and selections after 900ms so student can retry
      setTimeout(() => {
        setMismatchedPair(null);
        setSelectedConceptId(null);
        setSelectedDefId(null);
      }, 950);
    }
  };

  // Click handler for Concept cards
  const handleConceptClick = (conceptId: string) => {
    // If already matched or during mismatch animation, ignore
    if (matchedQuestionIds.has(conceptId) || mismatchedPair) return;

    if (selectedConceptId === conceptId) {
      // Deselect if already active
      setSelectedConceptId(null);
      setFeedbackMessage(null);
      return;
    }

    const concept = baseConcepts.find((c) => c.id === conceptId);

    if (selectedDefId) {
      // We already have a definition selected! Evaluate the pair
      evaluatePair(conceptId, selectedDefId);
    } else {
      // Just select this concept
      setSelectedConceptId(conceptId);
      if (concept) {
        setFeedbackMessage({
          type: 'info',
          text: `Concept "${concept.concept}" selected. Now choose its matching definition on the right.`,
        });
      }
    }
  };

  // Click handler for Definition cards
  const handleDefinitionClick = (defId: string) => {
    const def = baseDefinitions.find((d) => d.id === defId);
    if (!def) return;

    // If already matched or during mismatch animation, ignore
    if (matchedDefIndices.has(def.definitionIndex) || mismatchedPair) return;

    if (selectedDefId === defId) {
      // Deselect if already active
      setSelectedDefId(null);
      setFeedbackMessage(null);
      return;
    }

    if (selectedConceptId) {
      // We already have a concept selected! Evaluate the pair
      evaluatePair(selectedConceptId, defId);
    } else {
      // Just select this definition
      setSelectedDefId(defId);
      setFeedbackMessage({
        type: 'info',
        text: `Definition selected. Now choose the matching concept on the left.`,
      });
    }
  };

  // Restart / Practice Again handler
  const handlePracticeAgain = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const reset = await resetStudentAttempt(
        user,
        activity.id,
        activity.title,
        totalPairs
      );
      setAttempt(reset);
      reShuffleColumns();
      setFeedbackMessage({
        type: 'info',
        text: 'Cards reshuffled! Start matching concepts with their definitions.',
      });
    } catch (err) {
      console.error('Error resetting practice attempt:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">
          Preparing Democracy & Citizenship Match...
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Loading learning material from Firestore
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="matching-back-btn"
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Return to activities"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {activity.topic}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {activity.gradeLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {activity.title}
            </h1>
          </div>
        </div>

        {/* Live Score and Cloud Indicator */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Matched Pairs
            </span>
            <span className="text-lg font-bold text-slate-800">
              <span className="text-indigo-600">{matchedCount}</span> / {totalPairs}
            </span>
          </div>

          <button
            id="matching-restart-btn"
            type="button"
            onClick={handlePracticeAgain}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Reshuffle and practice again"
          >
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Reshuffle</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Instructions Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-700 font-medium">
              <strong className="text-indigo-950">Instructions:</strong> Click a{' '}
              <strong className="text-indigo-700">Concept</strong> on the left, then click its
              matching <strong className="text-purple-700">Definition</strong> on the right.
            </p>
          </div>
          <div className="flex items-center gap-3 font-semibold text-slate-500">
            <span>Accuracy: {progressPercent}%</span>
            {saving && <span className="text-indigo-600 animate-pulse">Saving...</span>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Dynamic Status & Feedback Notice */}
        <div
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
            feedbackMessage?.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : feedbackMessage?.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200 animate-shake'
              : selectedConceptId || selectedDefId
              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          {feedbackMessage?.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : feedbackMessage?.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : selectedConceptId || selectedDefId ? (
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          ) : (
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          )}

          <span className="flex-grow">
            {feedbackMessage
              ? feedbackMessage.text
              : 'Select any Concept on the left or Definition on the right to start matching.'}
          </span>
        </div>
      </div>

      {/* When All 10 Pairs are Completed: Display Victory State Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-lg relative overflow-hidden text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400 text-amber-950 shadow-md mb-3">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mastery Achieved!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-xl mx-auto mt-1">
            Outstanding work! You have successfully matched all 10 democracy and citizenship
            concepts with their correct definitions.
          </p>

          <div className="mt-5 inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-white border border-indigo-100 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Final Score
              </span>
              <span className="text-2xl font-black text-indigo-700">10 / 10</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Percentage
              </span>
              <span className="text-2xl font-black text-emerald-600">100%</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <span className="text-xs font-black uppercase text-emerald-700 px-2.5 py-1 rounded-full bg-emerald-50">
                Completed
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="victory-review-btn"
              type="button"
              onClick={() => setShowCompletedReview(!showCompletedReview)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <span>{showCompletedReview ? 'Hide Concepts' : 'Review 10 Concepts'}</span>
              {showCompletedReview ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <button
              id="victory-practice-again-btn"
              type="button"
              onClick={handlePracticeAgain}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>

            <button
              id="victory-back-btn"
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Activities</span>
            </button>
          </div>

          {/* Collapsible Complete Review Grid */}
          {showCompletedReview && (
            <div className="mt-8 text-left border-t border-indigo-100 pt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Curriculum Mastery Reference:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {baseConcepts.map((item) => {
                  const correctDef = baseDefinitions.find(
                    (d) => d.definitionIndex === item.correctDefinitionIndex
                  );
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-black tracking-wider text-indigo-700">
                            {item.concept}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {correctDef?.text}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <strong className="text-indigo-900">Montessori Note:</strong>{' '}
                        {item.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Matching Columns: Left Concepts / Right Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: CONCEPTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Concepts ({baseConcepts.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Click to select
            </span>
          </div>

          <div className="space-y-2.5">
            {shuffledConcepts.map((item) => {
              const isMatched = matchedQuestionIds.has(item.id);
              const isSelected = selectedConceptId === item.id;
              const isMismatched =
                mismatchedPair?.conceptId === item.id;
              const isJustMatched =
                justMatchedPair?.conceptId === item.id;

              let cardStyle =
                'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-xs';

              if (isMatched || isJustMatched) {
                cardStyle =
                  'bg-emerald-50/80 border-emerald-300 text-emerald-950 opacity-90 cursor-default';
              } else if (isMismatched) {
                cardStyle =
                  'bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-md';
              } else if (isSelected) {
                cardStyle =
                  'bg-indigo-50/90 border-2 border-indigo-600 text-indigo-950 shadow-md ring-2 ring-indigo-200';
              }

              return (
                <button
                  key={item.id}
                  id={`concept-btn-${item.concept.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleConceptClick(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 select-none ${cardStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isMatched || isJustMatched
                          ? 'bg-emerald-200 text-emerald-800'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.concept.charAt(0)}
                    </span>
                    <span className="text-sm font-black tracking-wide">
                      {item.concept}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isMatched || isJustMatched ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                      </span>
                    ) : isMismatched ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" /> Try Again
                      </span>
                    ) : isSelected ? (
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DEFINITIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Definitions ({baseDefinitions.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Click to match
            </span>
          </div>

          <div className="space-y-2.5">
            {shuffledDefinitions.map((item) => {
              const isMatched = matchedDefIndices.has(item.definitionIndex);
              const isSelected = selectedDefId === item.id;
              const isMismatched = mismatchedPair?.defId === item.id;
              const isJustMatched = justMatchedPair?.defId === item.id;

              let cardStyle =
                'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-xs';

              if (isMatched || isJustMatched) {
                cardStyle =
                  'bg-emerald-50/80 border-emerald-300 text-emerald-950 opacity-90 cursor-default';
              } else if (isMismatched) {
                cardStyle =
                  'bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-md';
              } else if (isSelected) {
                cardStyle =
                  'bg-purple-50/90 border-2 border-purple-600 text-purple-950 shadow-md ring-2 ring-purple-200';
              }

              return (
                <button
                  key={item.id}
                  id={`definition-btn-${item.definitionIndex}`}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleDefinitionClick(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 select-none ${cardStyle}`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    {item.text}
                  </p>

                  <div className="shrink-0 mt-0.5">
                    {isMatched || isJustMatched ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                      </span>
                    ) : isMismatched ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" /> Try Again
                      </span>
                    ) : isSelected ? (
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-100/80 px-2 py-0.5 rounded-md">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
