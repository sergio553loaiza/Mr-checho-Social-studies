import React, { useState } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe2,
  Layers,
  FileText,
} from 'lucide-react';
import { Activity, Question, ActivityGrade } from '../types';
import { saveCustomActivity } from '../services/activityStorage';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: (activity: Activity) => void;
}

interface QuestionFormState {
  questionText: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
}

const DEFAULT_QUESTIONS: QuestionFormState[] = Array.from({ length: 10 }, (_, i) => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  explanation: '',
}));

const SAMPLE_ACTIVITY: {
  title: string;
  topic: string;
  gradeLevel: string;
  description: string;
  estimatedMinutes: number;
  questions: QuestionFormState[];
} = {
  title: 'Ancient Civilizations: Mesopotamia & The Fertile Crescent',
  topic: 'Ancient Civilizations',
  gradeLevel: 'Upper Elementary (Ages 9-12)',
  description:
    'Discover how early humans transitioned from hunting and gathering to agriculture along the Tigris and Euphrates rivers, establishing the cradle of civilization, cuneiform writing, and irrigation networks.',
  estimatedMinutes: 10,
  questions: [
    {
      questionText: 'Between which two major rivers was Mesopotamia located?',
      options: ['Nile and Congo', 'Tigris and Euphrates', 'Indus and Ganges', 'Amazon and Orinoco'],
      correctAnswerIndex: 1,
      explanation:
        'Mesopotamia is a Greek word meaning "between two rivers," referring to the fertile valley flanked by the Tigris and Euphrates rivers in modern-day Iraq.',
    },
    {
      questionText: 'What was the earliest known system of writing invented by the Sumerians?',
      options: ['Hieroglyphics', 'The Phoenician Alphabet', 'Cuneiform', 'Latin Script'],
      correctAnswerIndex: 2,
      explanation:
        'Cuneiform was developed around 3400 BCE by Sumerian scribes using wedge-shaped reeds pressed into damp clay tablets.',
    },
    {
      questionText: 'Why was the Fertile Crescent so favorable for the birth of human agriculture?',
      options: [
        'Frequent snowstorms kept the ground frozen',
        'Annual river flooding deposited rich, nutrient silt on the soil',
        'Dense mountain jungles provided shelter',
        'It had no plant or animal competitors',
      ],
      correctAnswerIndex: 1,
      explanation:
        'Melting snows in nearby mountains caused annual river floods that left behind fresh, nutrient-rich fertile silt ideal for farming.',
    },
    {
      questionText: 'What massive stepped temple structures did Mesopotamians construct to honor their patron gods?',
      options: ['Pyramids', 'Colosseums', 'Ziggurats', 'Parthenons'],
      correctAnswerIndex: 2,
      explanation:
        'Ziggurats were grand monumental stepped towers built of mud bricks, serving as both spiritual sanctuaries and civic focal points.',
    },
    {
      questionText: 'Which ancient king of Babylon is famous for inscribing one of the world’s earliest codified sets of laws on a diorite stele?',
      options: ['Hammurabi', 'Gilgamesh', 'Nebuchadnezzar', 'Sargon'],
      correctAnswerIndex: 0,
      explanation:
        'King Hammurabi enacted the Code of Hammurabi (c. 1754 BCE), an extensive set of 282 legal statutes outlining civic justice and accountability.',
    },
    {
      questionText: 'How did Mesopotamian farmers solve the challenge of dry summers with little rainfall?',
      options: [
        'They transported water by hand in small pots',
        'They engineered complex irrigation canals and levees',
        'They only planted crops in winter',
        'They migrated to the ocean every summer',
      ],
      correctAnswerIndex: 1,
      explanation:
        'Farmers engineered canals, reservoirs, and drainage gates that channeled river water directly onto distant crop fields throughout hot seasons.',
    },
    {
      questionText: 'Which mathematical invention is credited to ancient Mesopotamian astronomers and mathematicians?',
      options: [
        'The 60-second minute and 60-minute hour (base-60 system)',
        'The metric system',
        'Roman numerals',
        'Calculus',
      ],
      correctAnswerIndex: 0,
      explanation:
        'Mesopotamians utilized the sexagesimal (base-60) numerical framework, which lives on today in our 60-second minutes, 60-minute hours, and 360-degree circles.',
    },
    {
      questionText: 'Which legendary work of Mesopotamian literature tells the heroic journey of an ancient king seeking immortality?',
      options: ['The Odyssey', 'The Epic of Gilgamesh', 'The Book of the Dead', 'The Iliad'],
      correctAnswerIndex: 1,
      explanation:
        'The Epic of Gilgamesh is one of humanity’s oldest epic poems, capturing deep Montessori values about friendship, nature, leadership, and human mortality.',
    },
    {
      questionText: 'Which key transport revolution was widely perfected and utilized for pottery and wagons in Mesopotamia around 3500 BCE?',
      options: ['The steam engine', 'The wheel', 'The magnetic compass', 'The printing press'],
      correctAnswerIndex: 1,
      explanation:
        'While initially developed for pottery spinning, Mesopotamians adapted the wheel for wheeled carts and war chariots, transforming trade and transit.',
    },
    {
      questionText: 'Which modern-day country occupies most of the territory where ancient Mesopotamia flourished?',
      options: ['Egypt', 'Greece', 'Iraq', 'India'],
      correctAnswerIndex: 2,
      explanation:
        'The core valley between the Tigris and Euphrates rivers lies largely within modern-day Iraq, alongside portions of Kuwait, Syria, and Turkey.',
    },
  ],
};

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onActivityCreated,
}) => {
  // Activity Meta Fields
  const [title, setTitle] = useState<string>('');
  const [topic, setTopic] = useState<string>('Physical Geography');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('Montessori Elementary (Ages 6-12)');
  const [targetGrade, setTargetGrade] = useState<ActivityGrade>('both');
  const [description, setDescription] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(10);

  // 10 Questions State
  const [questions, setQuestions] = useState<QuestionFormState[]>(DEFAULT_QUESTIONS);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Form handling state
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'stepper' | 'all'>('stepper');

  if (!isOpen) return null;

  // Handle updates to a question
  const updateQuestionField = <K extends keyof QuestionFormState>(
    qIndex: number,
    field: K,
    value: QuestionFormState[K]
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
    setError(null);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[qIndex].options] as [string, string, string, string];
      newOptions[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOptions };
      return copy;
    });
    setError(null);
  };

  // Check completion of a single question
  const isQuestionComplete = (q: QuestionFormState) => {
    return (
      q.questionText.trim().length > 0 &&
      q.options.every((opt) => opt.trim().length > 0) &&
      q.explanation.trim().length > 0
    );
  };

  const completedQuestionsCount = questions.filter(isQuestionComplete).length;

  // Fill sample data
  const handleLoadSample = () => {
    setTitle(SAMPLE_ACTIVITY.title);
    setTopic(SAMPLE_ACTIVITY.topic);
    setGradeLevel(SAMPLE_ACTIVITY.gradeLevel);
    setDescription(SAMPLE_ACTIVITY.description);
    setEstimatedMinutes(SAMPLE_ACTIVITY.estimatedMinutes);
    setQuestions(SAMPLE_ACTIVITY.questions);
    setActiveQuestionIndex(0);
    setError(null);
  };

  // Reset form
  const handleReset = () => {
    setTitle('');
    setTopic('Physical Geography');
    setCustomTopic('');
    setGradeLevel('Montessori Elementary (Ages 6-12)');
    setTargetGrade('both');
    setDescription('');
    setEstimatedMinutes(10);
    setQuestions(Array.from({ length: 10 }, () => ({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
    })));
    setActiveQuestionIndex(0);
    setError(null);
  };

  // Form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Meta
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide an Activity Title.');
      return;
    }

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      setError('Please provide a Short Description of this Social Studies unit.');
      return;
    }

    const finalTopic = topic === 'CUSTOM' ? customTopic.trim() : topic;
    if (!finalTopic) {
      setError('Please specify a Category / Topic for this unit.');
      return;
    }

    // Validate all 10 questions
    for (let i = 0; i < 10; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} is missing its question prompt.`);
        setActiveQuestionIndex(i);
        setViewMode('stepper');
        return;
      }

      for (let o = 0; o < 4; o++) {
        if (!q.options[o].trim()) {
          setError(`Question ${i + 1}, Option ${String.fromCharCode(65 + o)} is empty. Please provide 4 complete options.`);
          setActiveQuestionIndex(i);
          setViewMode('stepper');
          return;
        }
      }

      if (!q.explanation.trim()) {
        setError(`Question ${i + 1} is missing the educational explanation for students.`);
        setActiveQuestionIndex(i);
        setViewMode('stepper');
        return;
      }
    }

    setIsSaving(true);

    try {
      // Generate ID
      const slug = cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 32);
      const activityId = `act-${slug}-${Date.now().toString(36)}`;

      const formattedQuestions: Question[] = questions.map((q, idx) => ({
        id: `q-${activityId}-${idx + 1}`,
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation.trim(),
        points: 1,
      }));

      const newActivity: Activity = {
        id: activityId,
        title: cleanTitle,
        description: cleanDescription,
        iconName: 'BookOpen',
        topic: finalTopic,
        gradeLevel: gradeLevel,
        grade: targetGrade,
        estimatedMinutes: Math.max(5, estimatedMinutes || 10),
        questions: formattedQuestions,
      };

      await saveCustomActivity(newActivity);
      onActivityCreated(newActivity);
      handleReset();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save activity:', err);
      const errorObj = err as Error;
      setError(errorObj.message || 'Could not save the activity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = questions[activeQuestionIndex];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Create Social Studies Activity
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                  Teacher Only
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Design a new interactive 10-question inquiry unit for the Montessori Student Lab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold text-indigo-100 transition-colors cursor-pointer"
              title="Auto-fill with Mesopotamia 10-question sample activity"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Pre-fill Sample
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-xs sm:text-sm text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Top Bar for Small Screens to Load Sample */}
          <div className="sm:hidden flex justify-end">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pre-fill Sample Activity
            </button>
          </div>

          {/* SECTION 1: Activity Metadata */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                1. Activity Overview & Metadata
              </h4>
              <span className="text-xs text-slate-500">All fields required</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Constitution & Branches of Government"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                required
              />
            </div>

            {/* Category & Grade Level & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category / Topic *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                >
                  <option value="Physical Geography">Physical Geography</option>
                  <option value="Ancient Civilizations">Ancient Civilizations</option>
                  <option value="World History & Cultures">World History & Cultures</option>
                  <option value="Cultural Geography">Cultural Geography</option>
                  <option value="Civics & Democratic Systems">Civics & Democratic Systems</option>
                  <option value="Cartography & Map Skills">Cartography & Map Skills</option>
                  <option value="Economics & Global Trade">Economics & Global Trade</option>
                  <option value="Indigenous Civilizations">Indigenous Civilizations</option>
                  <option value="CUSTOM">+ Custom Category...</option>
                </select>
                {topic === 'CUSTOM' && (
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter custom category..."
                    className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nivel / Destinatarios *
                </label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value as ActivityGrade)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                >
                  <option value="both">Ambos Grados (4to y 5to)</option>
                  <option value="4">Solo 4to Grado</option>
                  <option value="5">Solo 5to Grado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Difficulty / Stage *
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                >
                  <option value="Montessori Elementary (Ages 6-12)">Montessori Elementary (Ages 6–12)</option>
                  <option value="Lower Elementary (Ages 6-9)">Lower Elementary (Ages 6–9)</option>
                  <option value="Upper Elementary (Ages 9-12)">Upper Elementary (Ages 9–12)</option>
                  <option value="Beginner (Introductory Level)">Beginner (Introductory Level)</option>
                  <option value="Intermediate (Standard Mastery)">Intermediate (Standard Mastery)</option>
                  <option value="Advanced (Independent Research)">Advanced (Independent Research)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Short Description *
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what key geographical or historical concepts students will explore in this activity..."
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          {/* SECTION 2: 10 Multiple-Choice Questions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  2. 10 Multiple-Choice Questions
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Each question requires 4 answer choices, a correct answer, and an educational explanation.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {completedQuestionsCount} of 10 Ready
                </span>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('stepper')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'stepper' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Question Stepper
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    View All 10
                  </button>
                </div>
              </div>
            </div>

            {/* Question Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {questions.map((q, idx) => {
                const complete = isQuestionComplete(q);
                const isActive = activeQuestionIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveQuestionIndex(idx);
                      if (viewMode === 'all') {
                        const el = document.getElementById(`question-card-${idx}`);
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                        : complete
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    {complete && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>

            {/* Stepper Mode: Edit One Question at a Time */}
            {viewMode === 'stepper' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    Question {activeQuestionIndex + 1} of 10
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeQuestionIndex === 0}
                      onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Previous Question"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={activeQuestionIndex === 9}
                      onClick={() => setActiveQuestionIndex((prev) => Math.min(9, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Next Question"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Question Prompt *
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.questionText}
                    onChange={(e) =>
                      updateQuestionField(activeQuestionIndex, 'questionText', e.target.value)
                    }
                    placeholder={`e.g., Which river provided the foundation for ancient agriculture in Egypt?`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  />
                </div>

                {/* 4 Answer Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      4 Answer Options (Select the correct one) *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Click the radio circle to mark the correct answer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt, optIdx) => {
                      const isCorrect = currentQ.correctAnswerIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300'
                              : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestionField(
                                activeQuestionIndex,
                                'correctAnswerIndex',
                                optIdx
                              )
                            }
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer mt-1 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isCorrect ? 'Correct Answer' : 'Click to mark as Correct Answer'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </button>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOptionText(activeQuestionIndex, optIdx, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}...`}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 mt-1 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Marked as Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Educational Explanation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Montessori Educational Explanation *
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.explanation}
                    onChange={(e) =>
                      updateQuestionField(activeQuestionIndex, 'explanation', e.target.value)
                    }
                    placeholder="Provide immediate pedagogical feedback shown to students after they answer (e.g. why the correct answer is right and the broader geographical context)..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                    required
                  />
                </div>

                {/* Question Stepper Navigation Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={activeQuestionIndex === 0}
                    onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous (Q{activeQuestionIndex})
                  </button>

                  {activeQuestionIndex < 9 ? (
                    <button
                      type="button"
                      onClick={() => setActiveQuestionIndex((prev) => Math.min(9, prev + 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
                    >
                      Next Question (Q{activeQuestionIndex + 2})
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">
                      Final Question (Q10)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* View All 10 Mode */}
            {viewMode === 'all' && (
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    id={`question-card-${qIdx}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        Question {qIdx + 1} of 10
                      </span>
                      {isQuestionComplete(q) ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Incomplete
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Prompt *
                      </label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                        placeholder={`Question ${qIdx + 1} prompt...`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestionField(qIdx, 'correctAnswerIndex', oIdx)}
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              q.correctAnswerIndex === oIdx
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Educational Explanation *
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => updateQuestionField(qIdx, 'explanation', e.target.value)}
                        placeholder="Pedagogical feedback..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Footer inside scrollable body */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              New activities will immediately sync to the <strong className="text-slate-700">Teacher Curriculum</strong> and <strong className="text-slate-700">Student Lab</strong>.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing Activity...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save & Publish Activity
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
