import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Send,
  Award,
  RefreshCw,
  History,
  Palette,
  LayoutGrid,
  Lightbulb,
  HeartHandshake,
  BookMarked,
  Check,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Save,
  BookOpen,
} from 'lucide-react';
import { AppUser, Activity } from '../types';
import {
  COLOMBIAN_NATIONAL_SYMBOLS,
  ColombianNationalSymbol,
  SymbolMindMapBranch,
  SymbolCategory,
} from '../data/colombianSymbolsData';
import { NationalSymbolIllustration } from './NationalSymbolIllustration';
import { getStudentAttempt, saveColombianSymbolsProgress } from '../services/firestore';
import { evaluateStudentResponsesLocally, EvaluationResult } from '../services/colombianEvaluation';
import { askSocialStudiesAssistant } from '../services/aiAssistantService';

interface ColombianSymbolsPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'assistant';
  text: string;
  suggestedAction?: string;
  timestamp: string;
}

interface SvgConnectionLine {
  id: string;
  color: string;
  path: string;
}

export const ColombianSymbolsPlayer: React.FC<ColombianSymbolsPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  // Exactly 10 Colombian National Symbols
  const symbols = COLOMBIAN_NATIONAL_SYMBOLS;

  // Active Symbol in focus (default: 1. Flag)
  const [activeSymbolIndex, setActiveSymbolIndex] = useState<number>(0);
  const activeSymbol: ColombianNationalSymbol = symbols[activeSymbolIndex] || symbols[0];

  // Responses state per branch id (e.g. 'flag-history', 'valdez-character', etc.)
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Active branch focused for typing / clues
  const [focusedBranchId, setFocusedBranchId] = useState<string | null>(null);

  // Evaluation & Results
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

  // Socratic AI Assistant Drawer
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [activeBranchForAI, setActiveBranchForAI] = useState<SymbolMindMapBranch | null>(null);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [assistantLoading, setAssistantLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `¡Hola ${user.name.split(' ')[0]}! I am Mr. Checho's Social Studies Assistant. I am here to guide your thinking about Colombia's 10 National Symbols. I won't write answers for you, but I will help you discover key facts, vocabulary, and historical connections!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Layout & SVG Connection Lines
  const canvasRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const branchRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [connectionLines, setConnectionLines] = useState<SvgConnectionLine[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPayloadRef = useRef<string>('');

  // Icon resolver
  const renderBranchIcon = (iconName: string, className = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'History':
        return <History className={className} />;
      case 'Palette':
        return <Palette className={className} />;
      case 'LayoutGrid':
        return <LayoutGrid className={className} />;
      case 'Lightbulb':
        return <Lightbulb className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'BookMarked':
        return <BookMarked className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Compass':
      default:
        return <Compass className={className} />;
    }
  };

  // 1. Initial Load: Retrieve existing student responses from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadAttempt() {
      try {
        setLoading(true);
        const attempt = await getStudentAttempt(user.uid, activity.id);
        if (attempt && isMounted) {
          if (attempt.responses && Object.keys(attempt.responses).length > 0) {
            setResponses(attempt.responses);
            lastSavedPayloadRef.current = JSON.stringify(attempt.responses);
          }
          if (typeof attempt.currentQuestionIndex === 'number' && attempt.currentQuestionIndex >= 0 && attempt.currentQuestionIndex < symbols.length) {
            setActiveSymbolIndex(attempt.currentQuestionIndex);
          }
          if (attempt.status === 'COMPLETED' && attempt.finalScore) {
            // Restore previous evaluation summary
            const prevEval = evaluateStudentResponsesLocally(user.name, attempt.responses || {});
            setEvalResult(prevEval);
          }
        }
      } catch (err) {
        console.warn('Could not load attempt from Firestore, using local session state:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAttempt();
    return () => {
      isMounted = false;
    };
  }, [user.uid, activity.id, symbols.length, user.name]);

  // Compute stats across all 10 symbols
  const getBranchWords = useCallback(
    (branchId: string) => {
      const text = (responses[branchId] || '').trim();
      return text.split(/\s+/).filter(Boolean).length;
    },
    [responses]
  );

  const isBranchDone = useCallback(
    (branch: SymbolMindMapBranch) => {
      return getBranchWords(branch.id) >= branch.minWords;
    },
    [getBranchWords]
  );

  const getSymbolCompletedBranchesCount = useCallback(
    (symbol: ColombianNationalSymbol) => {
      return symbol.branches.filter((b) => isBranchDone(b)).length;
    },
    [isBranchDone]
  );

  const isSymbolDone = useCallback(
    (symbol: ColombianNationalSymbol) => {
      return getSymbolCompletedBranchesCount(symbol) === symbol.branches.length;
    },
    [getSymbolCompletedBranchesCount]
  );

  const completedSymbolsCount = symbols.filter((s) => isSymbolDone(s)).length;
  const activeSymbolCompletedBranches = getSymbolCompletedBranchesCount(activeSymbol);

  // Compute completed sections array (indices of completed symbols)
  const completedSectionsIndices = symbols
    .map((s, idx) => (isSymbolDone(s) ? idx : -1))
    .filter((idx) => idx !== -1);

  // Debounced auto-save to Firestore
  const triggerAutoSave = useCallback(
    (newResponses: Record<string, string>, currentSymbolIdx: number) => {
      const payloadStr = JSON.stringify(newResponses);
      if (payloadStr === lastSavedPayloadRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus('saving');
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveColombianSymbolsProgress(
            user,
            activity.id,
            activity.title,
            currentSymbolIdx,
            newResponses,
            completedSectionsIndices,
            false
          );
          lastSavedPayloadRef.current = payloadStr;
          setSaveStatus('saved');
        } catch (error) {
          console.error('Error saving Colombian Symbols progress:', error);
          setSaveStatus('error');
        }
      }, 700);
    },
    [user, activity.id, activity.title, completedSectionsIndices]
  );

  // Handle student text response change for a branch
  const handleResponseChange = (branchId: string, text: string) => {
    const updated = {
      ...responses,
      [branchId]: text,
    };
    setResponses(updated);
    triggerAutoSave(updated, activeSymbolIndex);
  };

  // Re-calculate curved SVG connectors between Central Hub and surrounding Branches
  const updateConnectionLines = useCallback(() => {
    if (!canvasRef.current || !hubRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const hubRect = hubRef.current.getBoundingClientRect();

    const hubCenterX = hubRect.left + hubRect.width / 2 - canvasRect.left;
    const hubCenterY = hubRect.top + hubRect.height / 2 - canvasRect.top;

    const lines: SvgConnectionLine[] = [];

    activeSymbol.branches.forEach((branch) => {
      const branchEl = branchRefs.current[branch.id];
      if (!branchEl) return;

      const bRect = branchEl.getBoundingClientRect();
      const bCenterX = bRect.left + bRect.width / 2 - canvasRect.left;
      const bCenterY = bRect.top + bRect.height / 2 - canvasRect.top;

      // Determine attachment points based on relative position
      let startX = hubCenterX;
      let startY = hubCenterY;
      let endX = bCenterX;
      let endY = bCenterY;

      // Anchor to edge of hub
      if (bCenterX < hubCenterX - 50) {
        startX = hubRect.left - canvasRect.left;
        endX = bRect.right - canvasRect.left;
      } else if (bCenterX > hubCenterX + 50) {
        startX = hubRect.right - canvasRect.left;
        endX = bRect.left - canvasRect.left;
      } else {
        // Vertical
        if (bCenterY < hubCenterY) {
          startY = hubRect.top - canvasRect.top;
          endY = bRect.bottom - canvasRect.top;
        } else {
          startY = hubRect.bottom - canvasRect.top;
          endY = bRect.top - canvasRect.top;
        }
      }

      // Smooth cubic bezier curve
      const dx = endX - startX;
      const dy = endY - startY;
      const cp1X = startX + dx * 0.45;
      const cp1Y = startY + dy * 0.15;
      const cp2X = startX + dx * 0.55;
      const cp2Y = startY + dy * 0.85;

      const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      lines.push({
        id: `line-${branch.id}`,
        color: branch.color || activeSymbol.color,
        path,
      });
    });

    setConnectionLines(lines);
  }, [activeSymbol]);

  // Update connection lines on render, active symbol change, or resize
  useEffect(() => {
    updateConnectionLines();
    const handleResize = () => {
      updateConnectionLines();
    };
    window.addEventListener('resize', handleResize);
    const timeout = setTimeout(updateConnectionLines, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [activeSymbolIndex, updateConnectionLines]);

  // Open Socratic Assistant for a specific branch
  const handleOpenBranchAI = (branch: SymbolMindMapBranch) => {
    setActiveBranchForAI(branch);
    setIsAssistantOpen(true);

    // Initial contextual prompt if no messages for this branch yet
    const existingAns = (responses[branch.id] || '').trim();
    const promptText = existingAns
      ? `I'm writing about **${activeSymbol.title}** (${branch.title}): "${existingAns}". Can you give me feedback or help me expand it?`
      : `I'm working on **${activeSymbol.title}** (${branch.title}). Can you give me a guiding clue or question to help me get started?`;

    // Add assistant recommendation to chat
    setChatHistory((prev) => [
      ...prev,
      {
        id: `branch-context-${Date.now()}`,
        sender: 'assistant',
        text: `🔍 **Focusing on: ${activeSymbol.title} — ${branch.title}**\n\n*Guiding Question:* "${branch.question}"\n\n💡 *Helpful Clue:* ${branch.helperTip}\n\nWhat are you thinking of writing? Tell me your ideas and I'll help you refine them!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Send message to Socratic AI Assistant
  const handleSendAssistantMessage = async (customText?: string) => {
    const textToSend = (customText || assistantInput).trim();
    if (!textToSend || assistantLoading) return;

    const studentMsg: ChatMessage = {
      id: `student-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, studentMsg]);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const branchToQuery = activeBranchForAI || activeSymbol.branches[0];
      const studentCurrentDraft = responses[branchToQuery.id] || '';

      const aiReplyText = await askSocialStudiesAssistant({
        symbolTitle: activeSymbol.title,
        symbolCategory: activeSymbol.category,
        branchTitle: branchToQuery.title,
        branchQuestion: branchToQuery.question,
        branchHelperTip: branchToQuery.helperTip,
        studentDraft: studentCurrentDraft,
        studentMessage: textToSend,
        expectedKeywords: branchToQuery.expectedKeywords,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error asking assistant:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: `Here is a helpful clue: Think about ${activeSymbol.quoteOrFact}. How does this connect to ${activeBranchForAI?.title || 'the symbol'}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Final Assessment / Evaluation
  const handleEvaluateAndFinish = async () => {
    setIsEvaluating(true);
    try {
      const result = evaluateStudentResponsesLocally(user.name, responses, activeSymbol.key);
      setEvalResult(result);
      setShowCompleteModal(true);

      // Save evaluation results to Firestore
      await saveColombianSymbolsProgress(
        user,
        activity.id,
        activity.title,
        activeSymbolIndex,
        responses,
        completedSectionsIndices,
        result.passed,
        {
          finalScore: result.finalScore,
          percentage: result.percentage,
          passed: result.passed,
          feedback: result.feedback,
          rubricBreakdown: result.rubricBreakdown,
        }
      );
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 animate-pulse">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Loading Colombian Mind Maps</h3>
            <p className="text-xs text-stone-500 mt-1">Retrieving your saved progress from the cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  // Category navigation groups
  const patrioticSymbols = symbols.filter((s) => s.category === 'PATRIOTIC SYMBOLS');
  const culturalSymbols = symbols.filter((s) => s.category === 'CULTURAL SYMBOLS');
  const naturalSymbols = symbols.filter((s) => s.category === 'NATURAL SYMBOLS');

  return (
    <div className="min-h-screen bg-stone-50/90 text-stone-800 flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. TOP APP BAR: Progress, Cloud Save, Evaluation trigger */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              id="btn-back-activity"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors shrink-0"
              title="Return to activities dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
                  Colombian National Symbols Mind Map
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  🇨🇴 Montessori 6–12
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block truncate">
                Central Node Architecture • 10 Independent Symbol Mind Maps
              </p>
            </div>
          </div>

          {/* Right Action Cluster: Progress, Cloud Status, AI Assistant, Evaluate */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Auto-save cloud status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span className="text-amber-700 font-semibold text-[11px]">Saving...</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-rose-700 text-[11px]">Cloud offline</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-stone-600 text-[11px]">Saved to Cloud</span>
                </>
              )}
            </div>

            {/* Overall Symbols Progress Counter */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-950">
                {completedSymbolsCount} / 10 Symbols Completed
              </span>
            </div>

            {/* Socratic AI Assistant Button */}
            <button
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              id="btn-toggle-assistant"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors border border-stone-200 shadow-2xs"
            >
              <Bot className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">AI Clues</span>
            </button>

            {/* Final Assessment / Submit Button */}
            <button
              onClick={handleEvaluateAndFinish}
              disabled={isEvaluating}
              id="btn-evaluate-submission"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-98"
            >
              {isEvaluating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Award className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>{completedSymbolsCount === 10 ? 'Submit Final Work' : 'Evaluate Progress'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. 10 SYMBOLS NAVIGATION BAR: Categorized into Patriotic (3), Cultural (4), Natural (3) */}
      {/* ========================================================================= */}
      <nav className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2 shadow-2xs overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-1 no-scrollbar text-xs">
            {/* PATRIOTIC SYMBOLS (3) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Patriotic (3)
              </span>
              <div className="flex items-center gap-1">
                {patrioticSymbols.map((sym) => {
                  const idx = symbols.findIndex((s) => s.id === sym.id);
                  const isSelected = idx === activeSymbolIndex;
                  const isDone = isSymbolDone(sym);
                  const branchCount = getSymbolCompletedBranchesCount(sym);

                  return (
                    <button
                      key={sym.id}
                      onClick={() => {
                        setActiveSymbolIndex(idx);
                        triggerAutoSave(responses, idx);
                      }}
                      id={`nav-symbol-${sym.key}`}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs scale-102'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                      }`}
                      title={`${sym.number}. ${sym.title} (${branchCount}/5 branches)`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white text-amber-700'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isDone ? '✓' : sym.number}
                      </span>
                      <span className="whitespace-nowrap">{sym.title.replace('THE NATIONAL ', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-4 w-px bg-stone-200 shrink-0" />

            {/* CULTURAL SYMBOLS (4) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Cultural (4)
              </span>
              <div className="flex items-center gap-1">
                {culturalSymbols.map((sym) => {
                  const idx = symbols.findIndex((s) => s.id === sym.id);
                  const isSelected = idx === activeSymbolIndex;
                  const isDone = isSymbolDone(sym);

                  return (
                    <button
                      key={sym.id}
                      onClick={() => {
                        setActiveSymbolIndex(idx);
                        triggerAutoSave(responses, idx);
                      }}
                      id={`nav-symbol-${sym.key}`}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-700 text-white shadow-xs scale-102'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                      }`}
                      title={`${sym.number}. ${sym.title}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white text-amber-800'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isDone ? '✓' : sym.number}
                      </span>
                      <span className="whitespace-nowrap">{sym.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-4 w-px bg-stone-200 shrink-0" />

            {/* NATURAL SYMBOLS (3) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Natural (3)
              </span>
              <div className="flex items-center gap-1">
                {naturalSymbols.map((sym) => {
                  const idx = symbols.findIndex((s) => s.id === sym.id);
                  const isSelected = idx === activeSymbolIndex;
                  const isDone = isSymbolDone(sym);

                  return (
                    <button
                      key={sym.id}
                      onClick={() => {
                        setActiveSymbolIndex(idx);
                        triggerAutoSave(responses, idx);
                      }}
                      id={`nav-symbol-${sym.key}`}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs scale-102'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                      }`}
                      title={`${sym.number}. ${sym.title}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white text-emerald-800'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isDone ? '✓' : sym.number}
                      </span>
                      <span className="whitespace-nowrap">{sym.title.split('—')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Prev / Next Step Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (activeSymbolIndex > 0) {
                  setActiveSymbolIndex(activeSymbolIndex - 1);
                  triggerAutoSave(responses, activeSymbolIndex - 1);
                }
              }}
              disabled={activeSymbolIndex === 0}
              className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-40 transition-colors"
              title="Previous Symbol"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-stone-600 px-1">
              {activeSymbolIndex + 1} / 10
            </span>
            <button
              onClick={() => {
                if (activeSymbolIndex < symbols.length - 1) {
                  setActiveSymbolIndex(activeSymbolIndex + 1);
                  triggerAutoSave(responses, activeSymbolIndex + 1);
                }
              }}
              disabled={activeSymbolIndex === symbols.length - 1}
              className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-40 transition-colors"
              title="Next Symbol"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. MAIN INTERACTIVE MIND MAP CANVAS */}
      {/* Information Architecture: */}
      {/* CENTRAL HUB = THE NATIONAL SYMBOL WITH REAL PHOTOGRAPH */}
      {/* SURROUNDING NODES = 5 TAILORED BRANCHES OF KNOWLEDGE FOR THIS SYMBOL */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto relative" ref={canvasRef}>
          {/* Background SVG curved connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block" style={{ minHeight: 680 }}>
            {connectionLines.map((line) => (
              <path
                key={line.id}
                d={line.path}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeDasharray="4,4"
                strokeLinecap="round"
                className="opacity-40 transition-all duration-300"
              />
            ))}
          </svg>

          {/* ================================================================= */}
          {/* SPATIAL MIND MAP LAYOUT (Desktop: 3-column radial; Mobile: Stacking) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start relative z-10">
            {/* LEFT COLUMN: 2 Branches (e.g. Branch 0: History/Origin & Branch 2: Design/Materials) */}
            <div className="lg:col-span-4 space-y-4">
              {activeSymbol.branches
                .filter((_, idx) => idx === 0 || idx === 2)
                .map((branch, idx) => {
                  const ans = responses[branch.id] || '';
                  const words = getBranchWords(branch.id);
                  const isDone = words >= branch.minWords;
                  const isFocused = focusedBranchId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      ref={(el) => (branchRefs.current[branch.id] = el)}
                      id={`branch-card-${branch.id}`}
                      className={`relative bg-white rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs hover:shadow-md ${
                        isFocused
                          ? 'border-amber-500 ring-3 ring-amber-100'
                          : isDone
                          ? 'border-emerald-300/80 bg-emerald-50/20'
                          : 'border-stone-200'
                      }`}
                    >
                      {/* Branch Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: branch.color }}
                          >
                            {renderBranchIcon(branch.iconName)}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                              Branch {idx === 0 ? '1' : '3'} of 5
                            </span>
                            <h3 className="text-xs font-black text-stone-900 leading-none">
                              {branch.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : words > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Done</span>
                            </>
                          ) : (
                            <span>{words}/{branch.minWords} words</span>
                          )}
                        </span>
                      </div>

                      {/* Guiding Question */}
                      <p className="text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 mb-2 leading-relaxed">
                        {branch.question}
                      </p>

                      {/* Student Text Area */}
                      <textarea
                        value={ans}
                        onChange={(e) => handleResponseChange(branch.id, e.target.value)}
                        onFocus={() => setFocusedBranchId(branch.id)}
                        onBlur={() => setFocusedBranchId(null)}
                        rows={3}
                        id={`input-branch-${branch.id}`}
                        placeholder={branch.placeholder}
                        className="w-full text-xs text-stone-800 placeholder-stone-400 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-y font-normal leading-relaxed"
                      />

                      {/* Branch Footer: Words Counter & "Need a Clue?" Button */}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span className="text-[11px] font-medium text-stone-500">
                          {words >= branch.minWords ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓ {words} words (Completed)
                            </span>
                          ) : (
                            <span>
                              {branch.minWords - words} more words needed
                            </span>
                          )}
                        </span>

                        <button
                          onClick={() => handleOpenBranchAI(branch)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors"
                          title="Open Socratic clue for this question"
                        >
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          <span>Ask Clue</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CENTER COLUMN: THE CENTRAL SYMBOL HUB & 5th REFLECTION BRANCH */}
            <div className="lg:col-span-4 space-y-4 flex flex-col items-center">
              {/* ========================================================= */}
              {/* THE CENTRAL NODE: VISUALLY DOMINANT REAL SYMBOL HUB */}
              {/* ========================================================= */}
              <div
                ref={hubRef}
                id="central-symbol-hub"
                className="w-full bg-white rounded-3xl border-3 border-amber-400 shadow-lg p-5 text-center relative overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                {/* Decorative Top Accent Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: activeSymbol.color }}
                />

                {/* Category Pill & Symbol Number */}
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold mb-2.5 border"
                  style={{
                    backgroundColor: activeSymbol.bgLight,
                    color: activeSymbol.textColor,
                    borderColor: activeSymbol.color,
                  }}
                >
                  <span>{activeSymbol.categoryShort} Symbol</span>
                  <span>•</span>
                  <span>{activeSymbol.number} of 10</span>
                </div>

                {/* Central Real Photograph of the National Symbol */}
                <div className="my-2 flex justify-center">
                  <NationalSymbolIllustration
                    symbolType={activeSymbol.symbolType}
                    className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl shadow-md border-2 border-amber-300"
                    altText={activeSymbol.title}
                  />
                </div>

                {/* Title and Spanish Name */}
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight mt-2">
                  {activeSymbol.title}
                </h2>
                <p className="text-xs font-bold text-amber-800 italic">
                  {activeSymbol.spanishTitle}
                </p>

                {/* Tagline / Historical Context */}
                <p className="text-[11px] text-stone-600 mt-2 leading-relaxed px-2 font-medium">
                  {activeSymbol.tagline}
                </p>

                {/* Progress in this symbol: e.g. 3/5 Branches Completed */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-500 text-[11px]">Symbol Progress:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-full text-xs ${
                      activeSymbolCompletedBranches === 5
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeSymbolCompletedBranches} / 5 Branches Completed
                  </span>
                </div>

                {/* Historical Fact / Quote */}
                <div className="mt-2.5 p-2 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] text-stone-600 italic">
                  💡 &ldquo;{activeSymbol.quoteOrFact}&rdquo;
                </div>
              </div>

              {/* BRANCH 5: Bottom Center (Importance & Colombian Identity) */}
              {activeSymbol.branches[4] && (() => {
                const branch = activeSymbol.branches[4];
                const ans = responses[branch.id] || '';
                const words = getBranchWords(branch.id);
                const isDone = words >= branch.minWords;
                const isFocused = focusedBranchId === branch.id;

                return (
                  <div
                    key={branch.id}
                    ref={(el) => (branchRefs.current[branch.id] = el)}
                    id={`branch-card-${branch.id}`}
                    className={`w-full bg-white rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs hover:shadow-md ${
                      isFocused
                        ? 'border-amber-500 ring-3 ring-amber-100'
                        : isDone
                        ? 'border-emerald-300/80 bg-emerald-50/20'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Branch Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: branch.color }}
                        >
                          {renderBranchIcon(branch.iconName)}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                            Branch 5 of 5
                          </span>
                          <h3 className="text-xs font-black text-stone-900 leading-none">
                            {branch.title}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : words > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <span>{words}/{branch.minWords} words</span>
                        )}
                      </span>
                    </div>

                    {/* Guiding Question */}
                    <p className="text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 mb-2 leading-relaxed">
                      {branch.question}
                    </p>

                    {/* Student Text Area */}
                    <textarea
                      value={ans}
                      onChange={(e) => handleResponseChange(branch.id, e.target.value)}
                      onFocus={() => setFocusedBranchId(branch.id)}
                      onBlur={() => setFocusedBranchId(null)}
                      rows={3}
                      id={`input-branch-${branch.id}`}
                      placeholder={branch.placeholder}
                      className="w-full text-xs text-stone-800 placeholder-stone-400 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-y font-normal leading-relaxed"
                    />

                    {/* Branch Footer */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span className="text-[11px] font-medium text-stone-500">
                        {words >= branch.minWords ? (
                          <span className="text-emerald-700 font-semibold">
                            ✓ {words} words (Completed)
                          </span>
                        ) : (
                          <span>{branch.minWords - words} more words needed</span>
                        )}
                      </span>

                      <button
                        onClick={() => handleOpenBranchAI(branch)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors"
                        title="Open Socratic clue for this question"
                      >
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        <span>Ask Clue</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT COLUMN: 2 Branches (e.g. Branch 1: Colors/Culture & Branch 3: Meaning/Sovereignty) */}
            <div className="lg:col-span-4 space-y-4">
              {activeSymbol.branches
                .filter((_, idx) => idx === 1 || idx === 3)
                .map((branch, idx) => {
                  const ans = responses[branch.id] || '';
                  const words = getBranchWords(branch.id);
                  const isDone = words >= branch.minWords;
                  const isFocused = focusedBranchId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      ref={(el) => (branchRefs.current[branch.id] = el)}
                      id={`branch-card-${branch.id}`}
                      className={`relative bg-white rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs hover:shadow-md ${
                        isFocused
                          ? 'border-amber-500 ring-3 ring-amber-100'
                          : isDone
                          ? 'border-emerald-300/80 bg-emerald-50/20'
                          : 'border-stone-200'
                      }`}
                    >
                      {/* Branch Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: branch.color }}
                          >
                            {renderBranchIcon(branch.iconName)}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                              Branch {idx === 0 ? '2' : '4'} of 5
                            </span>
                            <h3 className="text-xs font-black text-stone-900 leading-none">
                              {branch.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : words > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Done</span>
                            </>
                          ) : (
                            <span>{words}/{branch.minWords} words</span>
                          )}
                        </span>
                      </div>

                      {/* Guiding Question */}
                      <p className="text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 mb-2 leading-relaxed">
                        {branch.question}
                      </p>

                      {/* Student Text Area */}
                      <textarea
                        value={ans}
                        onChange={(e) => handleResponseChange(branch.id, e.target.value)}
                        onFocus={() => setFocusedBranchId(branch.id)}
                        onBlur={() => setFocusedBranchId(null)}
                        rows={3}
                        id={`input-branch-${branch.id}`}
                        placeholder={branch.placeholder}
                        className="w-full text-xs text-stone-800 placeholder-stone-400 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-y font-normal leading-relaxed"
                      />

                      {/* Branch Footer */}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span className="text-[11px] font-medium text-stone-500">
                          {words >= branch.minWords ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓ {words} words (Completed)
                            </span>
                          ) : (
                            <span>{branch.minWords - words} more words needed</span>
                          )}
                        </span>

                        <button
                          onClick={() => handleOpenBranchAI(branch)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors"
                          title="Open Socratic clue for this question"
                        >
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          <span>Ask Clue</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick symbol pagination footer */}
          <div className="mt-8 flex items-center justify-between bg-white rounded-2xl p-3 border border-stone-200 shadow-xs">
            <button
              onClick={() => {
                if (activeSymbolIndex > 0) {
                  setActiveSymbolIndex(activeSymbolIndex - 1);
                  triggerAutoSave(responses, activeSymbolIndex - 1);
                }
              }}
              disabled={activeSymbolIndex === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Symbol ({activeSymbolIndex > 0 ? symbols[activeSymbolIndex - 1].title.split('—')[0].replace('THE NATIONAL ', '') : ''})</span>
            </button>

            <div className="text-center">
              <span className="text-xs font-extrabold text-stone-900">
                Symbol {activeSymbol.number} of 10
              </span>
              <p className="text-[10px] text-stone-500 font-medium">
                {activeSymbolCompletedBranches === 5 ? (
                  <span className="text-emerald-700 font-bold">✓ Mind map fully written for this symbol!</span>
                ) : (
                  <span>{5 - activeSymbolCompletedBranches} branches remaining for this symbol</span>
                )}
              </p>
            </div>

            <button
              onClick={() => {
                if (activeSymbolIndex < symbols.length - 1) {
                  setActiveSymbolIndex(activeSymbolIndex + 1);
                  triggerAutoSave(responses, activeSymbolIndex + 1);
                }
              }}
              disabled={activeSymbolIndex === symbols.length - 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
            >
              <span>Next Symbol ({activeSymbolIndex < symbols.length - 1 ? symbols[activeSymbolIndex + 1].title.split('—')[0].replace('THE NATIONAL ', '') : ''})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. SOCRATIC AI ASSISTANT SIDE DRAWER */}
      {/* ========================================================================= */}
      {isAssistantOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-stone-200 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-stone-200 bg-amber-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Mr. Checho&apos;s Assistant
                </h3>
                <p className="text-[11px] text-stone-500">
                  Socratic Clues &amp; Guiding Questions
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAssistantOpen(false)}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
              title="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
            <span className="font-bold text-stone-800 truncate">
              📌 {activeSymbol.title}
              {activeBranchForAI ? ` • ${activeBranchForAI.title}` : ''}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
              Socratic Mode
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs text-[10px] font-bold">
                    🇨🇴
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'student'
                      ? 'bg-amber-600 text-white rounded-tr-xs'
                      : 'bg-stone-100 text-stone-900 rounded-tl-xs border border-stone-200/80 whitespace-pre-wrap'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'student' ? 'text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {assistantLoading && (
              <div className="flex gap-2.5 items-center text-stone-500 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Thinking of a guiding clue...</span>
              </div>
            )}
          </div>

          {/* Quick Inquiry Starter Buttons */}
          <div className="p-2.5 border-t border-stone-100 bg-stone-50/50 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSendAssistantMessage('What historical event or date should I mention?')}
              className="text-[11px] font-semibold bg-white border border-stone-200 hover:border-amber-400 px-2 py-1 rounded-lg text-stone-700 transition-colors"
            >
              📅 Historical Dates
            </button>
            <button
              onClick={() => handleSendAssistantMessage('What key vocabulary words can I include?')}
              className="text-[11px] font-semibold bg-white border border-stone-200 hover:border-amber-400 px-2 py-1 rounded-lg text-stone-700 transition-colors"
            >
              📖 Key Vocabulary
            </button>
            <button
              onClick={() => handleSendAssistantMessage('Why does this symbol matter to Colombian identity?')}
              className="text-[11px] font-semibold bg-white border border-stone-200 hover:border-amber-400 px-2 py-1 rounded-lg text-stone-700 transition-colors"
            >
              🇨🇴 Colombian Identity
            </button>
          </div>

          {/* Drawer Message Input */}
          <div className="p-3 border-t border-stone-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAssistantMessage();
                }}
                placeholder="Ask for a clue or idea..."
                className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendAssistantMessage()}
                disabled={!assistantInput.trim() || assistantLoading}
                className="p-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FINAL EVALUATION / COMPLETION MODAL */}
      {/* ========================================================================= */}
      {showCompleteModal && evalResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header with Grade */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md text-2xl font-black ${
                    evalResult.passed ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {evalResult.passed ? '✓' : '◐'}
                </div>
                <div>
                  <span
                    className={`inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 ${
                      evalResult.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evalResult.status} (Passing: 7.0 / 10.0)
                  </span>
                  <h3 className="text-xl font-black text-stone-900">
                    Mind Map Assessment Results
                  </h3>
                  <p className="text-xs text-stone-500">
                    {evalResult.completedSymbolsCount} of 10 Symbols Completed • {evalResult.completedBranchesCount} of {evalResult.totalBranchesCount} Branches
                  </p>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right shrink-0 bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                <div className="text-3xl font-black text-stone-900 leading-none">
                  {evalResult.finalScore}
                  <span className="text-sm font-semibold text-stone-500"> / 10</span>
                </div>
                <span className="text-xs font-bold text-amber-700">{evalResult.percentage}% Score</span>
              </div>
            </div>

            {/* Personalized Teacher Feedback */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Personalized Feedback
              </h4>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                {evalResult.feedback}
              </p>
            </div>

            {/* Rubric Breakdown Grid */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2.5">
                Rubric Criteria Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Understanding</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.accuracyAndUnderstanding} / 3.0
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Completeness</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.completeness} / 2.0
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Reasoning</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.explanationAndReasoning} / 2.0
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Vocabulary</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.vocabulary} / 1.0
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Identity</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.connectionToIdentity} / 1.0
                  </span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Reflection</span>
                  <span className="text-sm font-black text-stone-900">
                    {evalResult.rubricBreakdown.reflection} / 1.0
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Strengths
                </span>
                <ul className="list-disc list-inside text-emerald-800 text-[11px] space-y-1">
                  {evalResult.rubricBreakdown.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Recommendations
                </span>
                <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-1">
                  {evalResult.rubricBreakdown.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                Keep Editing Mind Maps
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
              >
                Return to Activities Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
