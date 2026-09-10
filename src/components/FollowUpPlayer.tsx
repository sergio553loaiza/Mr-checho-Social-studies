import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  Printer,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Activity, ActivityAttempt, AppUser, StudentAnswer } from '../types';
import {
  getStudentAttempt,
  initializeAttempt,
  saveQuestionProgress,
} from '../services/firestore';

interface FollowUpPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

interface CheckedQuestionItem {
  isCorrect: boolean;
  userAnswerText: string;
  selectedOptionIndex: number;
}

export const FollowUpPlayer: React.FC<FollowUpPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  const questions = activity.questions || [];
  const totalQuestions = questions.length;

  const [attempt, setAttempt] = useState<ActivityAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Local state for the current question's user choice
  // For MC: option index (number)
  // For DROP: string (selected word)
  // For MATCH: Record<string, string> (e.g. { "RIGHTS": "...", "DUTIES": "..." })
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, CheckedQuestionItem>>({});

  // Finished review mode
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showReviewList, setShowReviewList] = useState<boolean>(false);

  // Editable or confirmed student details for diploma
  const [studentName, setStudentName] = useState<string>(
    user.name || 'Montessori Student'
  );
  const [studentGroup, setStudentGroup] = useState<string>(
    user.studentGroup || '4th Grade'
  );

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

          // Rebuild checked questions state from existing answers
          if (existing.answers) {
            const restoredChecked: Record<
              string,
              {
                isCorrect: boolean;
                userAnswerText: string;
                selectedOptionIndex: number;
              }
            > = {};

            Object.entries(existing.answers).forEach(([qId, ans]) => {
              restoredChecked[qId] = {
                isCorrect: ans.isCorrect,
                userAnswerText: ans.userAnswerText || '',
                selectedOptionIndex: ans.selectedOptionIndex,
              };
            });
            setCheckedQuestions(restoredChecked);
          }

          if (existing.status === 'COMPLETED') {
            setIsFinished(true);
          } else if (existing.currentQuestionIndex !== undefined) {
            setCurrentIndex(
              Math.min(existing.currentQuestionIndex, totalQuestions - 1)
            );
          }
        }
      } catch (err) {
        console.warn('Error loading follow-up attempt:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAttempt();
    return () => {
      isMounted = false;
    };
  }, [user, activity.id, activity.title, totalQuestions]);

  const currentQ = questions[currentIndex];
  const currentChecked = currentQ ? checkedQuestions[currentQ.id] : null;

  // Whenever currentIndex changes, load previously chosen answer if any
  useEffect(() => {
    if (!currentQ) return;
    const existing = checkedQuestions[currentQ.id];
    if (existing) {
      if (currentQ.type === 'MC') {
        setSelectedAnswer(existing.selectedOptionIndex);
      } else if (currentQ.type === 'DROP') {
        setSelectedAnswer(existing.userAnswerText);
      } else if (currentQ.type === 'MATCH') {
        try {
          setSelectedAnswer(JSON.parse(existing.userAnswerText));
        } catch {
          setSelectedAnswer({});
        }
      }
    } else {
      setSelectedAnswer(currentQ.type === 'MATCH' ? {} : null);
    }
  }, [currentIndex, currentQ, checkedQuestions]);

  // Handle selection for MC
  const handleSelectMC = (optIdx: number) => {
    if (currentChecked) return; // already submitted
    setSelectedAnswer(optIdx);
  };

  // Handle selection for DROP
  const handleSelectDrop = (value: string) => {
    if (currentChecked) return;
    setSelectedAnswer(value);
  };

  // Handle selection for MATCH
  const handleSelectMatchPair = (term: string, definition: string) => {
    if (currentChecked) return;
    setSelectedAnswer((prev: any) => ({
      ...(prev || {}),
      [term]: definition,
    }));
  };

  // Check Answer for current question
  const handleCheckAnswer = async () => {
    if (!currentQ || currentChecked) return;

    let isCorrect = false;
    let userAnswerText = '';
    let selectedOptionIndex = -1;

    if (currentQ.type === 'MC') {
      if (selectedAnswer === null || selectedAnswer === undefined) {
        alert('Please choose an option before checking!');
        return;
      }
      selectedOptionIndex = Number(selectedAnswer);
      isCorrect = selectedOptionIndex === currentQ.correctAnswerIndex;
      userAnswerText = currentQ.options[selectedOptionIndex] || '';
    } else if (currentQ.type === 'DROP') {
      if (!selectedAnswer || selectedAnswer === 'Select an answer...') {
        alert('Please choose an answer from the dropdown!');
        return;
      }
      userAnswerText = String(selectedAnswer);
      isCorrect =
        userAnswerText.trim().toLowerCase() ===
        (currentQ.correctAnswerText || '').trim().toLowerCase();
      selectedOptionIndex = currentQ.options.indexOf(userAnswerText);
    } else if (currentQ.type === 'MATCH') {
      const pairs = currentQ.pairs || [];
      const answersMap = (selectedAnswer as Record<string, string>) || {};
      const allFilled = pairs.every((p) => Boolean(answersMap[p.term]));
      if (!allFilled) {
        alert('Please select definitions for all terms before checking!');
        return;
      }
      isCorrect = pairs.every((p) => answersMap[p.term] === p.correct);
      userAnswerText = JSON.stringify(answersMap);
      selectedOptionIndex = isCorrect ? 0 : 1;
    }

    const newChecked: Record<string, CheckedQuestionItem> = {
      ...checkedQuestions,
      [currentQ.id]: {
        isCorrect,
        userAnswerText,
        selectedOptionIndex,
      },
    };
    setCheckedQuestions(newChecked);

    // Save to Firestore
    const studentAns: StudentAnswer = {
      questionId: currentQ.id,
      selectedOptionIndex,
      isCorrect,
      answeredAt: new Date().toISOString(),
      userAnswerText,
    };

    const allAnswers: Record<string, StudentAnswer> = {};
    Object.entries(newChecked).forEach(([qId, item]) => {
      allAnswers[qId] = {
        questionId: qId,
        selectedOptionIndex: item.selectedOptionIndex,
        isCorrect: item.isCorrect,
        answeredAt: new Date().toISOString(),
        userAnswerText: item.userAnswerText,
      };
    });

    const isLastQuestion = currentIndex === totalQuestions - 1;
    const isCompleted =
      Object.keys(newChecked).length >= totalQuestions && isLastQuestion;

    try {
      const updated = await saveQuestionProgress(
        user,
        activity.id,
        currentQ.id,
        studentAns,
        currentIndex,
        allAnswers,
        totalQuestions,
        isCompleted,
        activity.title
      );
      setAttempt(updated);
    } catch (err) {
      console.warn('Could not save progress to Firestore:', err);
    }
  };

  // Move to next question or show Diploma if done
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all 20 questions!
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Calculate scores
  const answeredCount = Object.keys(checkedQuestions).length;
  const totalHits = Object.values(checkedQuestions).filter((c: CheckedQuestionItem) => c.isCorrect).length;
  const percentage = totalQuestions > 0 ? Math.round((totalHits / totalQuestions) * 100) : 0;
  // Colombian 1.0 - 10.0 scale: (1 + (hits / total) * 9)
  const scoreScale = Number((1 + (totalHits / (totalQuestions || 20)) * 9).toFixed(1));

  // Qualitative feedback
  const getFeedback = (score: number) => {
    if (score >= 9.0) {
      return {
        badge: '🌟 EXCELLENT!',
        text: 'High mastery of democratic concepts and civic values!',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }
    if (score >= 7.0) {
      return {
        badge: '👏 GOOD JOB!',
        text: 'Satisfactory understanding of democracy and citizenship!',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
      };
    }
    if (score >= 6.0) {
      return {
        badge: '⚠️ PASSED',
        text: 'Basic understanding achieved, extra review recommended.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      };
    }
    return {
      badge: '📚 NEEDS IMPROVEMENT',
      text: 'Reinforcement needed on key democratic concepts.',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  };

  const feedback = getFeedback(scoreScale);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-indigo-200">
          <Award className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Loading Follow Up 1: Democracy Challenge...
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Retrieving 4th Grade evaluation record...
        </p>
      </div>
    );
  }

  // 🎓 DIPLOMA / EVALUATION RECORD VIEW
  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fadeIn">
        {/* Navigation top bar */}
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar al Social Studies Lab</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Certificado</span>
            </button>
          </div>
        </div>

        {/* Certificate Card */}
        <div
          id="diploma-card"
          className="relative bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 border-8 border-double border-indigo-700 rounded-3xl p-6 sm:p-10 text-center shadow-xl overflow-hidden"
        >
          {/* Subtle seal watermark */}
          <div className="absolute top-6 right-6 opacity-10 pointer-events-none">
            <Award className="w-36 h-36 text-indigo-900" />
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 mb-3 shadow-xs">
            <Award className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-indigo-950 uppercase mb-1">
            Official Evaluation Record
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Montessori Social Studies Lab • 4th Grade
          </p>

          <div className="my-6">
            <p className="text-xs text-slate-500">This official grade report is issued to:</p>
            <div className="mt-1">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 border-b-2 border-emerald-600 px-4 py-1 inline-block">
                {studentName}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-600">
              <span className="font-bold">
                Grupo:{' '}
                <span className="text-indigo-700 font-extrabold">{studentGroup}</span>
              </span>
              <span>•</span>
              <span className="font-bold">
                Evaluación:{' '}
                <span className="text-slate-900 font-extrabold">
                  Follow Up 1: Democracy &amp; Citizenship
                </span>
              </span>
            </div>
          </div>

          {/* Score Box */}
          <div className="max-w-md mx-auto bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-sm my-6">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Final Grade (Scale 1.0 - 10.0)
            </div>
            <div className="text-5xl font-black text-indigo-700 font-mono tracking-tight">
              {scoreScale.toFixed(1)}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              Correct Answers: <span className="font-bold text-slate-900">{totalHits}</span> of{' '}
              <span className="font-bold text-slate-900">{totalQuestions}</span> ({percentage}%)
            </div>

            {/* Qualitative Feedback */}
            <div
              className={`mt-4 p-3 rounded-2xl border text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 ${feedback.color}`}
            >
              <span>{feedback.badge}</span>
              <span className="font-medium text-slate-700">{feedback.text}</span>
            </div>
          </div>

          {/* Teacher cloud notice */}
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-xs font-bold text-amber-900 max-w-xl mx-auto mb-6">
            📌 OFFICIAL EVALUATION RECORDED TO MR. CHECHO&apos;S CLOUD DASHBOARD 🍎
            <p className="text-[11px] font-normal text-amber-800 mt-1">
              Tu intento y calificación han sido sincronizados en tiempo real en la lista de tu grupo ({studentGroup}).
            </p>
          </div>

          {/* Review Questions Button */}
          <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => setShowReviewList((prev) => !prev)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>{showReviewList ? 'Ocultar Revisión' : 'Revisar Preguntas y Respuestas (20)'}</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
            >
              <span>Volver a la Lista de Actividades</span>
            </button>
          </div>

          {/* Full review question list if opened */}
          {showReviewList && (
            <div className="mt-8 text-left border-t border-slate-200 pt-6 space-y-4 print:hidden">
              <h3 className="text-base font-bold text-slate-900 mb-2 text-center">
                Detalle de Respuestas Pregunta por Pregunta
              </h3>
              {questions.map((q, idx) => {
                const checked = checkedQuestions[q.id];
                const isCorrect = checked?.isCorrect;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-bold text-slate-900">
                        {q.questionText}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Incorrect
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-slate-600 mt-2 text-xs">
                      <strong className="text-slate-700">Tu respuesta:</strong>{' '}
                      {checked?.userAnswerText || 'Sin respuesta'}
                    </div>
                    {!isCorrect && (
                      <div className="text-emerald-700 mt-1 text-xs">
                        <strong className="text-emerald-800">Respuesta correcta:</strong>{' '}
                        {q.correctAnswerText || q.options[q.correctAnswerIndex]}
                      </div>
                    )}
                    <div className="text-slate-500 mt-2 text-[11px] italic bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      💡 <strong>Explicación:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📝 MAIN QUIZ INTERFACE
  const progressPercent =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      {/* Top Header & Back */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer flex-shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  4th Grade Evaluation
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                  Term 1
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
                <span>📜 Follow Up 1: Democracy Challenge</span>
              </h2>
            </div>
          </div>

          {/* Student details pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 self-start sm:self-auto">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <div className="text-left text-xs">
              <div className="font-bold text-slate-800 leading-tight">
                {studentName}
              </div>
              <div className="text-slate-500 text-[10px]">
                Grupo: <strong className="text-indigo-700">{studentGroup}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              {currentChecked && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    currentChecked.isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentChecked.isCorrect ? 'Correct ✔️' : 'Incorrect ❌'}
                </span>
              )}
            </span>
            <span className="text-indigo-700 font-mono">
              {answeredCount}/{totalQuestions} Respondidas ({Math.round(progressPercent)}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question quick-strip */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
          {questions.map((q, idx) => {
            const isChecked = checkedQuestions[q.id];
            const isActive = idx === currentIndex;

            let btnClass = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
            if (isChecked) {
              btnClass = isChecked.isCorrect
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-rose-500 text-white border-rose-600';
            }
            if (isActive) {
              btnClass += ' ring-2 ring-indigo-500 ring-offset-1 font-black';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${btnClass}`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUESTION CARD */}
      {currentQ && (
        <div
          key={currentQ.id}
          className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs transition-all"
        >
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-indigo-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              Question {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
              {currentQ.type === 'MC'
                ? 'Multiple Choice'
                : currentQ.type === 'DROP'
                ? 'Fill in the Blank'
                : 'Concept Matching'}
            </span>
            {currentQ.concept && (
              <span className="text-xs font-black text-indigo-700 tracking-wider uppercase ml-auto">
                {currentQ.concept}
              </span>
            )}
          </div>

          {/* Scenario / Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
            {currentQ.questionText}
          </h3>

          {/* Interactive Question Body */}
          {/* 1. Multiple Choice */}
          {currentQ.type === 'MC' && (
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedAnswer === optIdx;

                let optClass =
                  'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-300';

                if (isSelected && !currentChecked) {
                  optClass =
                    'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-xs';
                }

                if (currentChecked) {
                  if (optIdx === currentQ.correctAnswerIndex) {
                    optClass =
                      'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500';
                  } else if (isSelected && !currentChecked.isCorrect) {
                    optClass =
                      'bg-rose-50 border-rose-600 text-rose-950 line-through';
                  } else {
                    optClass = 'bg-slate-50/60 border-slate-200 text-slate-400';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={Boolean(currentChecked)}
                    onClick={() => handleSelectMC(optIdx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${optClass} ${
                      currentChecked ? 'cursor-default' : ''
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center flex-shrink-0 text-xs sm:text-sm border ${
                        isSelected || (currentChecked && optIdx === currentQ.correctAnswerIndex)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug flex-1">
                      {option}
                    </span>
                    {currentChecked && optIdx === currentQ.correctAnswerIndex && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                    {currentChecked && isSelected && !currentChecked.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Dropdown / Fill in the blank */}
          {currentQ.type === 'DROP' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                  Selecciona la palabra adecuada para completar el enunciado:
                </label>
                <div className="relative">
                  <select
                    disabled={Boolean(currentChecked)}
                    value={selectedAnswer || ''}
                    onChange={(e) => handleSelectDrop(e.target.value)}
                    className={`w-full appearance-none px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all focus:outline-hidden ${
                      currentChecked
                        ? currentChecked.isCorrect
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-rose-50 border-rose-600 text-rose-900'
                        : 'bg-white border-indigo-400 focus:border-indigo-600 text-slate-800'
                    }`}
                  >
                    {currentQ.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* 3. Concept Matching */}
          {currentQ.type === 'MATCH' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Empareja cada concepto cívico con su respectiva definición:
              </p>
              {(currentQ.pairs || []).map((pair, pIdx) => {
                const currentVal =
                  (selectedAnswer && (selectedAnswer as Record<string, string>)[pair.term]) ||
                  '';
                const isPairCorrect = currentVal === pair.correct;

                return (
                  <div
                    key={pIdx}
                    className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      currentChecked
                        ? isPairCorrect
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-rose-50/60 border-rose-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="font-extrabold text-indigo-900 text-xs sm:text-sm md:w-1/3">
                      {pair.term}:
                    </span>
                    <div className="relative md:w-2/3">
                      <select
                        disabled={Boolean(currentChecked)}
                        value={currentVal}
                        onChange={(e) =>
                          handleSelectMatchPair(pair.term, e.target.value)
                        }
                        className={`w-full appearance-none text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border font-medium pr-8 focus:outline-hidden ${
                          currentChecked
                            ? isPairCorrect
                              ? 'bg-white border-emerald-500 text-emerald-950 font-bold'
                              : 'bg-white border-rose-500 text-rose-950'
                            : 'bg-slate-50 border-slate-300 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">Selecciona definición...</option>
                        {pair.options.map((def, dIdx) => (
                          <option key={dIdx} value={def}>
                            {def}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation & Feedback Box */}
          {currentChecked && (
            <div
              className={`mt-6 p-4 sm:p-5 rounded-2xl border-l-4 text-xs sm:text-sm animate-fadeIn ${
                currentChecked.isCorrect
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : 'bg-rose-50 border-rose-600 text-rose-950'
              }`}
            >
              <div className="font-bold flex items-center gap-2 mb-1">
                {currentChecked.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>¡Respuesta Correcta!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Respuesta Incorrecta</span>
                  </>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed mt-1">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Controls Bar */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ⬅️ Anterior
            </button>

            <div className="flex items-center gap-2">
              {!currentChecked ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Comprobar Respuesta</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>
                    {currentIndex === totalQuestions - 1
                      ? 'Finalizar y Ver Diploma 🏁'
                      : 'Siguiente Pregunta ➡️'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
