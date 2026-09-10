import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Activity, AppUser, ActivityAttempt, StudentAnswer } from '../types';
import {
  getStudentAttempt,
  initializeAttempt,
  saveWordSearchProgress,
  resetStudentAttempt,
} from '../services/firestore';

interface WordSearchPlayerProps {
  user: AppUser;
  activity: Activity;
  onBack: () => void;
}

const TARGET_WORDS = [
  'PARTICIPATION',
  'GOVERNMENT',
  'DEMOCRACY',
  'DECISIONS',
  'ELECTION',
  'OPINIONS',
  'FREEDOM',
  'LIBERTY',
  'RIGHTS',
  'DUTIES',
  'IDEAS',
  'VOTE',
];

const GRID_SIZE = 15;

const DIRECTIONS = [
  [0, 1],   // horizontal right
  [0, -1],  // horizontal left
  [1, 0],   // vertical down
  [-1, 0],  // vertical up
  [1, 1],   // diagonal down-right
  [-1, -1], // diagonal up-left
  [1, -1],  // diagonal down-left
  [-1, 1],  // diagonal up-right
];

// Curated verified default grid to ensure zero cold-start delay
const DEFAULT_GRID_CONFIG = {
  grid: [
    ['Z','V','O','T','E','R','Q','X','E','S','N','M','Z','I','W'],
    ['T','C','F','H','P','T','M','A','E','O','K','H','N','W','V'],
    ['O','T','R','U','T','R','F','I','I','S','G','O','H','S','Y'],
    ['T','L','E','W','D','I','T','T','T','O','I','I','N','I','D'],
    ['F','N','E','T','L','U','C','H','V','T','D','O','E','D','T'],
    ['H','M','D','U','D','E','G','E','A','E','I','C','E','U','I'],
    ['O','S','O','T','L','I','R','P','A','S','K','M','T','C','E'],
    ['D','B','M','E','R','N','I','S','I','H','O','Y','T','N','L'],
    ['C','C','U','O','M','C','L','C','I','C','T','T','Z','K','E'],
    ['A','U','F','E','I','O','E','X','R','A','X','R','W','O','A'],
    ['T','X','N','T','I','D','W','A','D','S','W','E','U','P','U'],
    ['Q','T','R','X','N','E','C','B','Q','V','A','B','B','D','A'],
    ['L','A','S','N','D','Y','E','W','T','F','T','I','E','I','D'],
    ['P','S','N','O','I','N','I','P','O','P','Q','L','A','H','T'],
    ['U','K','M','S','S','I','F','H','K','Y','Z','I','T','Z','E']
  ],
  placements: {
    PARTICIPATION: [[13,0],[12,1],[11,2],[10,3],[9,4],[8,5],[7,6],[6,7],[5,8],[4,9],[3,10],[2,11],[1,12]],
    GOVERNMENT: [[2,10],[3,9],[4,8],[5,7],[6,6],[7,5],[8,4],[9,3],[10,2],[11,1]],
    DEMOCRACY: [[4,13],[5,12],[6,11],[7,10],[8,9],[9,8],[10,7],[11,6],[12,5]],
    DECISIONS: [[10,5],[9,6],[8,7],[7,8],[6,9],[5,10],[4,11],[3,12],[2,13]],
    ELECTION: [[7,3],[6,4],[5,5],[4,6],[3,7],[2,8],[1,9],[0,10]],
    OPINIONS: [[13,8],[13,7],[13,6],[13,5],[13,4],[13,3],[13,2],[13,1]],
    FREEDOM: [[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2]],
    LIBERTY: [[13,11],[12,11],[11,11],[10,11],[9,11],[8,11],[7,11]],
    RIGHTS: [[7,4],[6,5],[5,6],[4,7],[3,8],[2,9]],
    DUTIES: [[5,4],[4,5],[3,6],[2,7],[1,8],[0,9]],
    IDEAS: [[3,11],[4,10],[5,9],[6,8],[7,7]],
    VOTE: [[0,1],[0,2],[0,3],[0,4]]
  } as Record<string, [number, number][]>
};

// Generate a random dynamic grid when requested
function generateDynamicWordSearch(): {
  grid: string[][];
  placements: Record<string, [number, number][]>;
} {
  const size = GRID_SIZE;
  const words = TARGET_WORDS;
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (let trial = 0; trial < 150; trial++) {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placements: Record<string, [number, number][]> = {};
    let allPlaced = true;

    for (const word of sortedWords) {
      let placed = false;
      for (let attempt = 0; attempt < 400 && !placed; attempt++) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const dr = dir[0];
        const dc = dir[1];

        const minR = dr < 0 ? word.length - 1 : 0;
        const maxR = dr > 0 ? size - word.length : size - 1;
        const minC = dc < 0 ? word.length - 1 : 0;
        const maxC = dc > 0 ? size - word.length : size - 1;

        if (maxR < minR || maxC < minC) continue;

        const startR = minR + Math.floor(Math.random() * (maxR - minR + 1));
        const startC = minC + Math.floor(Math.random() * (maxC - minC + 1));

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + i * dr;
          const c = startC + i * dc;
          if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          const coords: [number, number][] = [];
          for (let i = 0; i < word.length; i++) {
            const r = startR + i * dr;
            const c = startC + i * dc;
            grid[r][c] = word[i];
            coords.push([r, c]);
          }
          placements[word] = coords;
          placed = true;
        }
      }
      if (!placed) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      const FILLERS = 'ABCDEEFGHIIKLMNOPQRSTTUUVWXYZ';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === '') {
            grid[r][c] = FILLERS[Math.floor(Math.random() * FILLERS.length)];
          }
        }
      }
      return { grid, placements };
    }
  }

  // Fallback to verified default layout
  return DEFAULT_GRID_CONFIG;
}

// Color palettes for highlighting discovered words
const WORD_COLORS = [
  { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-400' },
  { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400' },
  { bg: 'bg-amber-200', text: 'text-amber-900', border: 'border-amber-400' },
  { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-400' },
  { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-400' },
  { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400' },
  { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'border-cyan-400' },
  { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-400' },
  { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' },
  { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', border: 'border-fuchsia-400' },
  { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-400' },
  { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-400' },
];

export const WordSearchPlayer: React.FC<WordSearchPlayerProps> = ({
  user,
  activity,
  onBack,
}) => {
  const [boardConfig, setBoardConfig] = useState(DEFAULT_GRID_CONFIG);
  const [attempt, setAttempt] = useState<ActivityAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoord, setStartCoord] = useState<[number, number] | null>(null);
  const [currentCoord, setCurrentCoord] = useState<[number, number] | null>(null);

  // Success celebration & feedback message
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recentlyFoundWord, setRecentlyFoundWord] = useState<string | null>(null);
  const [isChampionCelebration, setIsChampionCelebration] = useState(false);

  // Grid element ref for coordinate-based touch drag handling
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Play audio chime using Web Audio API
  const playChime = useCallback(
    (isSuccess: boolean = true) => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (isSuccess) {
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
          });
        }
      } catch {
        // Ignore audio failures
      }
    },
    [soundEnabled]
  );

  // Load or initialize attempt on mount
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        let existing = await getStudentAttempt(user.uid, activity.id);
        if (!existing) {
          existing = await initializeAttempt(user, activity.id, activity.title, 10);
        }
        if (isMounted) {
          setAttempt(existing);
          if (existing.status === 'COMPLETED') {
            setIsChampionCelebration(true);
          }
        }
      } catch (err) {
        console.warn('Could not load attempt from Firestore, using local attempt:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user, activity]);

  // Set of found words derived from attempt.answers
  const foundWords = useMemo(() => {
    const set = new Set<string>();
    if (!attempt?.answers) return set;
    Object.keys(attempt.answers).forEach((key) => {
      const upper = key.toUpperCase();
      if (TARGET_WORDS.includes(upper) && attempt.answers[key]?.isCorrect) {
        set.add(upper);
      }
    });
    return set;
  }, [attempt?.answers]);

  // Coordinate map for permanently highlighted cells
  const highlightedCellsMap = useMemo(() => {
    const map = new Map<string, { word: string; colorIndex: number }>();
    let colorCounter = 0;

    TARGET_WORDS.forEach((word) => {
      if (foundWords.has(word)) {
        const coords = boardConfig.placements[word];
        if (coords) {
          const colorIndex = colorCounter % WORD_COLORS.length;
          coords.forEach(([r, c]) => {
            map.set(`${r},${c}`, { word, colorIndex });
          });
          colorCounter++;
        }
      }
    });

    return map;
  }, [foundWords, boardConfig]);

  // Cells currently selected during active drag
  const currentSelection = useMemo(() => {
    if (!startCoord || !currentCoord) return [];
    const [r1, c1] = startCoord;
    const [r2, c2] = currentCoord;

    const dr = r2 - r1;
    const dc = c2 - c1;

    // Check if horizontal, vertical, or diagonal
    const isHorizontal = dr === 0;
    const isVertical = dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc);

    if (!isHorizontal && !isVertical && !isDiagonal) {
      // Just the start cell if not in a straight line
      return [[r1, c1]] as [number, number][];
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    const cells: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push([r1 + i * stepR, c1 + i * stepC]);
    }
    return cells;
  }, [startCoord, currentCoord]);

  // String formed by the current selection
  const selectedText = useMemo(() => {
    if (currentSelection.length === 0) return '';
    return currentSelection
      .map(([r, c]) => boardConfig.grid[r]?.[c] || '')
      .join('');
  }, [currentSelection, boardConfig.grid]);

  // Handle word verification when selection finishes
  const finalizeSelection = useCallback(async () => {
    if (!startCoord || currentSelection.length < 2) {
      setIsSelecting(false);
      setStartCoord(null);
      setCurrentCoord(null);
      return;
    }

    const forward = selectedText.toUpperCase();
    const backward = forward.split('').reverse().join('');

    let matchedWord: string | null = null;
    if (TARGET_WORDS.includes(forward)) {
      matchedWord = forward;
    } else if (TARGET_WORDS.includes(backward)) {
      matchedWord = backward;
    }

    if (matchedWord) {
      if (foundWords.has(matchedWord)) {
        setFeedback(`You already found "${matchedWord}"!`);
        setTimeout(() => setFeedback(null), 1800);
      } else {
        // Discovered a new word!
        playChime(true);
        setRecentlyFoundWord(matchedWord);
        setFeedback(`✨ Great job! Found: ${matchedWord}!`);
        setTimeout(() => setFeedback(null), 2500);

        const currentAnswers = attempt?.answers || {};
        const newFoundCount = foundWords.size + 1;
        const willBeComplete = newFoundCount >= TARGET_WORDS.length;

        setSaving(true);
        try {
          const updatedAttempt = await saveWordSearchProgress(
            user,
            activity.id,
            activity.title,
            matchedWord,
            currentAnswers,
            TARGET_WORDS.length
          );
          setAttempt(updatedAttempt);

          if (willBeComplete) {
            setIsChampionCelebration(true);
          }
        } catch (err) {
          console.error('Failed to save word search answer:', err);
        } finally {
          setSaving(false);
        }
      }
    }

    setIsSelecting(false);
    setStartCoord(null);
    setCurrentCoord(null);
  }, [
    startCoord,
    currentSelection,
    selectedText,
    foundWords,
    playChime,
    user,
    activity,
    attempt?.answers,
  ]);

  // Global mouseup listener to catch releases outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        finalizeSelection();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, finalizeSelection]);

  // Start selection at coordinate
  const handleCellMouseDown = (r: number, c: number) => {
    setIsSelecting(true);
    setStartCoord([r, c]);
    setCurrentCoord([r, c]);
  };

  // Drag over coordinate
  const handleCellMouseEnter = (r: number, c: number) => {
    if (isSelecting) {
      setCurrentCoord([r, c]);
    }
  };

  // Touch handlers for mobile & tablets
  const handleTouchStart = (e: React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    setIsSelecting(true);
    setStartCoord([r, c]);
    setCurrentCoord([r, c]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting || !e.touches[0]) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    const rowAttr = targetElement.getAttribute('data-row');
    const colAttr = targetElement.getAttribute('data-col');

    if (rowAttr !== null && colAttr !== null) {
      const r = parseInt(rowAttr, 10);
      const c = parseInt(colAttr, 10);
      if (!isNaN(r) && !isNaN(c)) {
        setCurrentCoord([r, c]);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    finalizeSelection();
  };

  // Reset Word Search: regenerates grid and resets Firestore progress
  const handleResetWordSearch = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your Democracy Word Search? Your progress will restart.'
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const freshConfig = generateDynamicWordSearch();
      setBoardConfig(freshConfig);

      const resetAttempt = await resetStudentAttempt(
        user,
        activity.id,
        activity.title,
        10
      );
      setAttempt(resetAttempt);
      setIsChampionCelebration(false);
      setFeedback('Word Search reset! Good luck finding all 12 words!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Error resetting word search:', err);
    } finally {
      setSaving(false);
    }
  };

  const foundCount = foundWords.size;
  const totalWords = TARGET_WORDS.length;
  const progressPercent = Math.round((foundCount / totalWords) * 100);

  // Set of cells currently being dragged over
  const selectedCellsSet = useMemo(() => {
    const set = new Set<string>();
    currentSelection.forEach(([r, c]) => set.add(`${r},${c}`));
    return set;
  }, [currentSelection]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-700">
          Loading Democracy Vocabulary Search...
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Setting up your 15x15 interactive letter board.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="word-search-back-btn"
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors flex items-center gap-1.5 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>My Activities</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {activity.topic || 'Civics / Citizenship'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {activity.gradeLevel || 'Montessori Elementary'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <span>🗳️</span>
                <span>{activity.title}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              id="reset-word-search-btn"
              type="button"
              onClick={handleResetWordSearch}
              disabled={saving}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Word Search</span>
            </button>
          </div>
        </div>

        {/* Instructions & Live Progress */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-medium">
              Click/drag from start to end of each word to select it!
            </span>
          </div>

          {/* Progress Bar & Counter */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="text-xs font-bold text-slate-500">
              Found <strong className="text-indigo-600">{foundCount}</strong> / {totalWords}
            </div>
            <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  foundCount === totalWords ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-black text-slate-700">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div className="mb-4 p-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{feedback}</span>
          </div>
          {saving && (
            <span className="text-xs text-indigo-200">Saving to Firestore...</span>
          )}
        </div>
      )}

      {/* Main Board & Vocabulary List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 15x15 Word Search Board */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-hidden flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold px-1">
            <span>15 × 15 Civic Grid</span>
            <span className="text-slate-500">
              {selectedText ? (
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Selecting: {selectedText}
                </span>
              ) : (
                'Horizontal, Vertical & Diagonal'
              )}
            </span>
          </div>

          {/* Touch and Mouse Responsive Grid Canvas */}
          <div
            ref={gridContainerRef}
            id="word-search-board-container"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full max-w-[560px] aspect-square grid grid-cols-15 gap-1 sm:gap-1.5 p-2 sm:p-3 bg-slate-50 rounded-2xl border border-slate-200 touch-none shadow-inner"
          >
            {boardConfig.grid.map((row, rIdx) =>
              row.map((letter, cIdx) => {
                const coordKey = `${rIdx},${cIdx}`;
                const isFound = highlightedCellsMap.has(coordKey);
                const isCurrentDrag = selectedCellsSet.has(coordKey);
                const foundMeta = highlightedCellsMap.get(coordKey);

                let cellStyle = 'bg-white text-slate-800 border-slate-200 hover:bg-indigo-50';

                if (isCurrentDrag) {
                  cellStyle =
                    'bg-indigo-600 text-white font-black border-indigo-700 scale-105 shadow-sm z-10';
                } else if (isFound && foundMeta) {
                  const palette = WORD_COLORS[foundMeta.colorIndex];
                  cellStyle = `${palette.bg} ${palette.text} font-black ${palette.border} border`;
                }

                return (
                  <button
                    key={coordKey}
                    type="button"
                    data-row={rIdx}
                    data-col={cIdx}
                    onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                    onTouchStart={(e) => handleTouchStart(e, rIdx, cIdx)}
                    className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-base border transition-all select-none cursor-pointer ${cellStyle}`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Tip: Drag forward, backward, or diagonally across any of the 12 democracy terms.
          </p>
        </div>

        {/* Right Column: Target Words List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Target Words ({foundCount}/12)</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {foundCount === totalWords ? 'All Complete! 🎉' : `${totalWords - foundCount} Remaining`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {TARGET_WORDS.map((word, idx) => {
                const isFound = foundWords.has(word);
                const isRecentlyFound = recentlyFoundWord === word;

                return (
                  <div
                    key={word}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isFound
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                    } ${isRecentlyFound ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 font-mono w-4">
                        {idx + 1}.
                      </span>
                      <span
                        className={`font-black text-xs sm:text-sm tracking-wide truncate ${
                          isFound ? 'line-through text-emerald-800' : 'text-slate-800'
                        }`}
                      >
                        {word}
                      </span>
                    </div>

                    {isFound ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Found
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-slate-200 flex-shrink-0">
                        Search
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Montessori Civics Insight Box */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 rounded-3xl border border-indigo-100 p-5 text-xs text-indigo-950">
            <h4 className="font-extrabold text-sm text-indigo-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Montessori Elementary Civics
            </h4>
            <p className="text-slate-600 leading-relaxed">
              In our classroom democracy, words like <strong>PARTICIPATION</strong>,{' '}
              <strong>RIGHTS</strong>, and <strong>DUTIES</strong> are living agreements.
              Finding each term prepares you to contribute thoughtfully to our collective class constitution.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Modal / Screen: "DEMOCRACY CHAMPION!" */}
      {isChampionCelebration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-indigo-100 max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-amber-100 to-indigo-100 rounded-full blur-xl opacity-80 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-full blur-xl opacity-80 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-xl shadow-amber-200 mb-4 animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                DEMOCRACY CHAMPION!
              </h2>

              <p className="text-slate-600 font-medium text-sm sm:text-base mt-3 leading-relaxed">
                &ldquo;You mastered all 12 democracy concepts! You are fully prepared to build our class constitution.&rdquo;
              </p>

              {/* Assessment Summary Badges */}
              <div className="my-6 grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Score
                  </span>
                  <span className="text-lg font-black text-slate-900 block mt-0.5">
                    10 / 10
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                    Mastery
                  </span>
                  <span className="text-lg font-black text-emerald-700 block mt-0.5">
                    100%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="text-xs font-black text-indigo-700 block mt-1.5">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="celebration-reset-btn"
                  type="button"
                  onClick={handleResetWordSearch}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Word Search</span>
                </button>
                <button
                  id="celebration-back-btn"
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>My Activities</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
