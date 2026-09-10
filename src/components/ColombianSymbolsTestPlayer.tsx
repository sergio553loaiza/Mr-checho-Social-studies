import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Activity, ActivityAttempt, AppUser, StudentAnswer } from '../types';
import {
  getStudentAttempt,
  initializeAttempt,
  saveQuestionProgress,
  resetStudentAttempt,
} from '../services/firestore';

interface ColombianSymbolsTestPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

function normalizeAnswer(v: string): string {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const ColombianSymbolsTestPlayer: React.FC<ColombianSymbolsTestPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  const questions = activity.questions || [];
  const totalQuestions = questions.length;

  const [attempt, setAttempt] = useState<ActivityAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [started, setStarted] = useState<boolean>(false);
  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showReview, setShowReview] = useState<boolean>(false);

  // Current question interactive state
  const [locked, setLocked] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Question specific inputs
  const [selectedMcIndex, setSelectedMcIndex] = useState<number | null>(null);
  const [selectedMultiIndices, setSelectedMultiIndices] = useState<number[]>([]);
  const [fillInput, setFillInput] = useState<string>('');
  const [matchSelections, setMatchSelections] = useState<Record<number, string>>({});
  const [orderState, setOrderState] = useState<number[]>([]);
  const [swapFirstIndex, setSwapFirstIndex] = useState<number | null>(null);

  // Initialize or resume attempt from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadAttempt() {
      setLoading(true);
      try {
        let existing = await getStudentAttempt(user.uid, activity.id);
        if (!existing) {
          existing = await initializeAttempt(
            user,
            activity.id,
            activity.title,
            totalQuestions
          );
        }

        if (isMounted && existing) {
          setAttempt(existing);
          if (existing.answers) {
            setAnswers(existing.answers);
          }
          if (existing.status === 'COMPLETED') {
            setIsFinished(true);
            setStarted(true);
          } else if (existing.currentQuestionIndex > 0) {
            setCurrent(Math.min(existing.currentQuestionIndex, totalQuestions - 1));
            setStarted(true);
          }
        }
      } catch (err) {
        console.warn('Could not load attempt from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAttempt();
    return () => {
      isMounted = false;
    };
  }, [user.uid, activity.id, activity.title, totalQuestions]);

  const currentQ = questions[current];

  // Set up question state whenever current index changes
  useEffect(() => {
    if (!currentQ) return;
    setLocked(false);
    setFeedback(null);
    setSelectedMcIndex(null);
    setSelectedMultiIndices([]);
    setFillInput('');
    setMatchSelections({});
    setSwapFirstIndex(null);

    // Initialize ordering array if question is ORDER
    if (currentQ.type === 'ORDER' && currentQ.orderItems) {
      setOrderState(currentQ.orderItems.map((_, i) => i));
    }

    // Restore if already answered previously
    const prevAnswer = answers[currentQ.id];
    if (prevAnswer) {
      setLocked(true);
      setFeedback({
        isCorrect: prevAnswer.isCorrect,
        text: currentQ.explanation,
      });
      if (currentQ.type === 'MC' || currentQ.type === 'TF') {
        setSelectedMcIndex(prevAnswer.selectedOptionIndex);
      } else if (currentQ.type === 'FILL') {
        setFillInput(prevAnswer.userAnswerText || '');
      }
    }
  }, [current, currentQ, answers]);

  // Handle MC / TF answer selection
  const handleSelectOption = (index: number) => {
    if (locked || !currentQ) return;
    setLocked(true);
    setSelectedMcIndex(index);

    const isCorrect = index === currentQ.correctAnswerIndex;
    const feedbackMsg = currentQ.explanation || (isCorrect ? 'Correct!' : 'Review the lesson and try again.');
    setFeedback({ isCorrect, text: feedbackMsg });

    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: index,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText: currentQ.options[index],
    };

    commitAnswer(currentQ.id, newAnswer);
  };

  // Handle Multi Checkbox change
  const toggleMultiOption = (index: number) => {
    if (locked) return;
    setSelectedMultiIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Confirm Multi Checkboxes
  const handleCheckMulti = () => {
    if (locked || !currentQ || selectedMultiIndices.length === 0) return;
    setLocked(true);

    const correctIndices = currentQ.multiCorrectAnswers || [];
    const isCorrect =
      [...selectedMultiIndices].sort().join(',') === [...correctIndices].sort().join(',');

    const feedbackMsg = currentQ.explanation;
    setFeedback({ isCorrect, text: feedbackMsg });

    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: isCorrect ? 1 : 0,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText: selectedMultiIndices.map((i) => currentQ.options[i]).join(', '),
    };

    commitAnswer(currentQ.id, newAnswer);
  };

  // Confirm Fill in the Blank
  const handleCheckFill = () => {
    if (locked || !currentQ || !fillInput.trim()) return;
    setLocked(true);

    const userVal = normalizeAnswer(fillInput);
    const targetVal = normalizeAnswer(currentQ.correctAnswerText || 'triana');
    const isCorrect = userVal === targetVal;

    const feedbackMsg = currentQ.explanation;
    setFeedback({ isCorrect, text: feedbackMsg });

    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: isCorrect ? 1 : 0,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText: fillInput.trim(),
    };

    commitAnswer(currentQ.id, newAnswer);
  };

  // Handle Match Dropdown change
  const handleMatchSelect = (pairIndex: number, value: string) => {
    if (locked) return;
    setMatchSelections((prev) => ({ ...prev, [pairIndex]: value }));
  };

  // Confirm Match Dropdowns
  const handleCheckMatch = () => {
    if (locked || !currentQ || !currentQ.matchPairs) return;
    const totalPairs = currentQ.matchPairs.length;
    const answeredCount = Object.keys(matchSelections).filter((k) => matchSelections[Number(k)]).length;
    if (answeredCount < totalPairs) return;

    setLocked(true);
    const isCorrect = currentQ.matchPairs.every(
      (pair, idx) => matchSelections[idx] === pair[1]
    );

    const feedbackMsg = currentQ.explanation;
    setFeedback({ isCorrect, text: feedbackMsg });

    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: isCorrect ? 1 : 0,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText: JSON.stringify(matchSelections),
    };

    commitAnswer(currentQ.id, newAnswer);
  };

  // Handle Order Tap & Swap
  const handleOrderTap = (pos: number) => {
    if (locked) return;
    if (swapFirstIndex === null) {
      setSwapFirstIndex(pos);
      return;
    }
    if (swapFirstIndex === pos) {
      setSwapFirstIndex(null);
      return;
    }
    const newArr = [...orderState];
    const temp = newArr[swapFirstIndex];
    newArr[swapFirstIndex] = newArr[pos];
    newArr[pos] = temp;
    setOrderState(newArr);
    setSwapFirstIndex(null);
  };

  // Confirm Order
  const handleCheckOrder = () => {
    if (locked || !currentQ) return;
    setLocked(true);

    const isCorrect = orderState.join(',') === '0,1,2,3';
    const feedbackMsg = currentQ.explanation;
    setFeedback({ isCorrect, text: feedbackMsg });

    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex: isCorrect ? 1 : 0,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText: orderState.map((i) => currentQ.orderItems?.[i]).join(' → '),
    };

    commitAnswer(currentQ.id, newAnswer);
  };

  // Save answer to Firestore
  const commitAnswer = async (qId: string, answer: StudentAnswer) => {
    const updatedAnswers = { ...answers, [qId]: answer };
    setAnswers(updatedAnswers);

    const isLastQuestion = current === totalQuestions - 1;
    try {
      const updated = await saveQuestionProgress(
        user,
        activity.id,
        qId,
        answer,
        current,
        answers,
        totalQuestions,
        isLastQuestion,
        activity.title
      );
      setAttempt(updated);
    } catch (err) {
      console.warn('Could not save question progress in Firestore:', err);
    }
  };

  // Advance to Next question or Finish
  const handleNext = () => {
    if (!locked) return;
    if (current < totalQuestions - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // Retake test from beginning
  const handleRestart = async () => {
    try {
      const reset = await resetStudentAttempt(
        user,
        activity.id,
        activity.title,
        totalQuestions
      );
      setAttempt(reset);
      setAnswers({});
      setCurrent(0);
      setIsFinished(false);
      setShowReview(false);
      setStarted(true);
      setLocked(false);
      setFeedback(null);
    } catch (err) {
      console.warn('Error resetting student attempt:', err);
    }
  };

  // Compute live score
  const correctCount = (Object.values(answers) as StudentAnswer[]).filter((a) => a.isCorrect).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">
          Loading Colombian Symbols Challenge...
        </p>
      </div>
    );
  }

  // --- START SCREEN ---
  if (!started && !isFinished) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Laboratorio</span>
        </button>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-xl shadow-amber-950/5 relative overflow-hidden text-center">
          {/* Colombian Flag Ribbon Bar */}
          <div className="absolute top-0 left-0 right-0 flex h-2.5">
            <div className="bg-yellow-400 flex-[2]" />
            <div className="bg-blue-600 flex-1" />
            <div className="bg-red-600 flex-1" />
          </div>

          <div className="text-6xl mb-4 pt-4 select-none">🇨🇴✨</div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>5th Grade Social Studies Challenge</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            How Well Do You Know Colombia?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed mb-6 font-normal">
            Show what you remember from our lessons about Colombia&apos;s patriotic, natural, cultural, and identity symbols. Answer all 33 interactive questions to test your mastery!
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 max-w-md mx-auto mb-8 border border-slate-200 text-left flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Student Profile
              </span>
              <span className="text-sm font-black text-slate-800">
                {user.name}
              </span>
            </div>
            {user.studentGroup && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full border border-indigo-200">
                Grupo {user.studentGroup}
              </span>
            )}
          </div>

          <button
            id="start-symbols-test-btn"
            type="button"
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>START TEST</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // --- SCORE SCREEN ---
  if (isFinished) {
    let emoji = '📚';
    let finalTitle = 'Keep learning!';
    let finalMsg = `Good attempt, ${user.name}! Go back to the lesson and try the challenge again.`;

    if (scorePercent >= 90) {
      emoji = '🏆';
      finalTitle = 'Excellent work!';
      finalMsg = `Amazing, ${user.name}! You really understood Colombia's national symbols and heritage.`;
    } else if (scorePercent >= 75) {
      emoji = '🌟';
      finalTitle = 'Great job!';
      finalMsg = `Well done, ${user.name}! You have a strong understanding of our national symbols.`;
    } else if (scorePercent >= 60) {
      emoji = '👏';
      finalTitle = 'Good effort!';
      finalMsg = `Nice work, ${user.name}. Review the slides and try again to achieve an even higher score!`;
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl relative overflow-hidden text-center">
          {/* Flag Bar */}
          <div className="absolute top-0 left-0 right-0 flex h-2.5">
            <div className="bg-yellow-400 flex-[2]" />
            <div className="bg-blue-600 flex-1" />
            <div className="bg-red-600 flex-1" />
          </div>

          <div className="text-6xl mb-3 pt-4 select-none">{emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            {finalTitle}
          </h2>
          <div className="text-4xl sm:text-5xl font-black text-blue-950 my-3">
            {correctCount} <span className="text-2xl font-bold text-slate-400">/ {totalQuestions}</span>
          </div>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-6">
            {finalMsg}
          </p>

          {/* Metric Badges Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-2xl font-black text-blue-950">{correctCount}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correct</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-2xl font-black text-indigo-700">{scorePercent}%</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-base sm:text-lg font-black text-slate-800 truncate">
                {user.studentGroup || user.name.split(' ')[0]}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-3.5 rounded-xl text-xs font-bold text-slate-700 bg-amber-400 hover:bg-amber-500 border border-amber-500 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN / RETAKE</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReview(!showReview)}
              className="px-6 py-3.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showReview ? 'Hide Review' : 'Review All 33 Questions'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        {showReview && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Detailed Question Review &amp; Explanations
            </h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const wasCorrect = ans?.isCorrect ?? false;
                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border ${
                      wasCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Question {idx + 1} • {q.tag}
                      </span>
                      {wasCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-2">{q.questionText}</p>
                    <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      💡 <strong>Lesson Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- QUESTION SCREEN ---
  const progressPct = ((current) / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6 shadow-xs relative overflow-hidden">
        {/* Flag Bar */}
        <div className="absolute top-0 left-0 right-0 flex h-2">
          <div className="bg-yellow-400 flex-[2]" />
          <div className="bg-blue-600 flex-1" />
          <div className="bg-red-600 flex-1" />
        </div>

        <div className="flex items-center justify-between gap-4 mb-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                🇨🇴 Colombian Symbols
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                5th Grade • Comprehension Challenge
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="block text-xs font-black text-blue-950">
              Question {current + 1} of {totalQuestions}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Score: {correctCount}
            </span>
          </div>
        </div>

        {/* Progress Bar with Tricolor Gradient */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 mb-6 min-h-[380px] flex flex-col justify-between">
        <div>
          {/* Category Tag */}
          <span className="inline-block px-3.5 py-1 rounded-full bg-blue-950 text-white text-[11px] font-black uppercase tracking-wider mb-4">
            {currentQ.tag || 'QUESTION'}
          </span>

          {/* Question Text */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-6">
            {currentQ.questionText}
          </h3>

          {/* Answer Area by Question Type */}
          {/* 1. Multiple Choice */}
          {currentQ.type === 'MC' && (
            <div className="grid gap-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedMcIndex === i;
                const isTargetCorrect = i === currentQ.correctAnswerIndex;

                let btnStyles =
                  'border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-800';

                if (locked) {
                  if (isSelected) {
                    btnStyles = isTargetCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-black'
                      : 'border-rose-500 bg-rose-50 text-rose-900 font-black';
                  } else if (isTargetCorrect) {
                    btnStyles = 'border-emerald-300 bg-emerald-50/50 text-emerald-800';
                  } else {
                    btnStyles = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                } else if (isSelected) {
                  btnStyles = 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={locked}
                    onClick={() => handleSelectOption(i)}
                    className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-sm sm:text-base transition-all cursor-pointer ${btnStyles}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{opt}</span>
                      {locked && isSelected && (
                        <span>
                          {isTargetCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. True / False */}
          {currentQ.type === 'TF' && (
            <div className="grid grid-cols-2 gap-4">
              {['TRUE', 'FALSE'].map((label, idx) => {
                const isSelected = selectedMcIndex === idx;
                const isTargetCorrect = idx === currentQ.correctAnswerIndex;

                let btnStyles =
                  'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800';

                if (locked) {
                  if (isSelected) {
                    btnStyles = isTargetCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-rose-500 bg-rose-50 text-rose-900';
                  } else if (isTargetCorrect) {
                    btnStyles = 'border-emerald-300 bg-emerald-50/50 text-emerald-800';
                  } else {
                    btnStyles = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={locked}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-6 rounded-2xl border-2 font-black text-center text-lg transition-all cursor-pointer ${btnStyles}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Multi Selection Checkboxes */}
          {currentQ.type === 'MULTI' && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Choose every correct answer:
              </p>
              <div className="grid gap-2.5 mb-4">
                {currentQ.options.map((opt, i) => {
                  const isChecked = selectedMultiIndices.includes(i);
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/60 text-blue-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      } ${locked ? 'opacity-70 cursor-default' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={isChecked}
                        onChange={() => toggleMultiOption(i)}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={handleCheckMulti}
                  disabled={selectedMultiIndices.length === 0}
                  className="px-6 py-3 rounded-xl bg-blue-900 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  CHECK ANSWER ✓
                </button>
              )}
            </div>
          )}

          {/* 4. Fill in the Blank */}
          {currentQ.type === 'FILL' && (
            <div>
              <div className="flex gap-3 max-w-md mb-4">
                <input
                  type="text"
                  disabled={locked}
                  placeholder="Type the missing word..."
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckFill()}
                  className="flex-1 px-4 py-3.5 rounded-xl border-2 border-slate-300 font-bold text-base text-slate-900 focus:outline-hidden focus:border-blue-600 disabled:bg-slate-100"
                />
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={handleCheckFill}
                  disabled={!fillInput.trim()}
                  className="px-6 py-3 rounded-xl bg-blue-900 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  CHECK ANSWER ✓
                </button>
              )}
            </div>
          )}

          {/* 5. Matching Dropdowns */}
          {currentQ.type === 'MATCH' && currentQ.matchPairs && (
            <div>
              <div className="grid gap-3 mb-4">
                {currentQ.matchPairs.map((pair, idx) => {
                  const optionsList = Array.from(
                    new Set(currentQ.matchPairs?.map((p) => p[1]) || [])
                  );
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="font-black text-sm text-blue-950">
                        {pair[0]}
                      </span>
                      <select
                        disabled={locked}
                        value={matchSelections[idx] || ''}
                        onChange={(e) => handleMatchSelect(idx, e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 font-bold text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-600"
                      >
                        <option value="">Choose matching meaning...</option>
                        {optionsList.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={handleCheckMatch}
                  disabled={
                    Object.keys(matchSelections).filter((k) => matchSelections[Number(k)])
                      .length < currentQ.matchPairs.length
                  }
                  className="px-6 py-3 rounded-xl bg-blue-900 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  CHECK MATCHING ✓
                </button>
              )}
            </div>
          )}

          {/* 6. Chronological Order Tap & Swap */}
          {currentQ.type === 'ORDER' && currentQ.orderItems && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3">
                Tap one event, then tap another event to swap their positions into chronological order:
              </p>
              <div className="grid gap-2.5 mb-4">
                {orderState.map((itemIdx, pos) => {
                  const isSwapActive = swapFirstIndex === pos;
                  return (
                    <div
                      key={pos}
                      onClick={() => handleOrderTap(pos)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        isSwapActive
                          ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                      } ${locked ? 'pointer-events-none opacity-80' : 'cursor-pointer'}`}
                    >
                      <span className="w-7 h-7 rounded-full bg-blue-950 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {pos + 1}
                      </span>
                      <span className="flex-1">{currentQ.orderItems?.[itemIdx]}</span>
                      {!locked && <ArrowUpDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  );
                })}
              </div>

              {!locked && (
                <button
                  type="button"
                  onClick={handleCheckOrder}
                  className="px-6 py-3 rounded-xl bg-blue-900 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-800 transition-colors"
                >
                  CHECK ORDER ✓
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback Message Block */}
        {feedback && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-sm font-bold leading-relaxed flex items-start gap-3 ${
              feedback.isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-black">
                {feedback.isCorrect ? 'Correct!' : 'Incorrect.'}{' '}
              </span>
              <span>{feedback.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          id="next-symbols-btn"
          type="button"
          disabled={!locked}
          onClick={handleNext}
          className="px-8 py-3.5 bg-blue-950 text-white font-black text-sm rounded-xl shadow-md hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span>{current === totalQuestions - 1 ? 'FINISH ✓' : 'NEXT →'}</span>
        </button>
      </div>
    </div>
  );
};
