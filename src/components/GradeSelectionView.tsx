import React from 'react';
import {
  Compass,
  GraduationCap,
  Layers,
  ArrowRight,
  Sparkles,
  BookOpen,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import { ActivityGrade } from '../types';

interface GradeSelectionViewProps {
  currentGrade?: ActivityGrade;
  onSelectGrade: (grade: ActivityGrade) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const GradeSelectionView: React.FC<GradeSelectionViewProps> = ({
  currentGrade,
  onSelectGrade,
  onCancel,
  isModal = false,
}) => {
  const options: Array<{
    grade: ActivityGrade;
    title: string;
    levelTag: string;
    description: string;
    highlights: string[];
    accentColor: string;
    borderColor: string;
    bgColor: string;
    icon: React.ReactNode;
  }> = [
    {
      grade: '4',
      title: '4th Grade',
      levelTag: 'Upper Elementary • Level 1',
      description:
        'Foundational democratic institutions, civic participation, community citizenship, and vocabulary explorations.',
      highlights: [
        'Democracy & Citizenship Concepts',
        'Civic Duties & Human Rights',
        'Interactive Vocabulary & Matching',
      ],
      accentColor: 'text-blue-600',
      borderColor: 'border-blue-200 hover:border-blue-400',
      bgColor: 'bg-blue-50/50',
      icon: <GraduationCap className="w-8 h-8 text-blue-600" />,
    },
    {
      grade: '5',
      title: '5th Grade',
      levelTag: 'Upper Elementary • Level 2',
      description:
        'Deep dive into Colombia’s 19th-century independence, 10 National Symbols Mind Maps, and constitutional history.',
      highlights: [
        'Colombian National Symbols Hub',
        'Patriotic, Cultural & Natural Symbols',
        'Expedition Charter & History Missions',
      ],
      accentColor: 'text-indigo-600',
      borderColor: 'border-indigo-200 hover:border-indigo-500',
      bgColor: 'bg-indigo-50/50',
      icon: <Compass className="w-8 h-8 text-indigo-600" />,
    },
    {
      grade: 'both',
      title: '4th & 5th Grade',
      levelTag: 'Combined Elementary Lab',
      description:
        'Access all cross-grade curriculum activities, shared projects, and collaborative elementary Social Studies investigations.',
      highlights: [
        'Full Montessori Curriculum Access',
        'Both 4th & 5th Grade Challenges',
        'Ideal for Multi-Grade Work & Review',
      ],
      accentColor: 'text-purple-600',
      borderColor: 'border-purple-200 hover:border-purple-400',
      bgColor: 'bg-purple-50/50',
      icon: <Layers className="w-8 h-8 text-purple-600" />,
    },
  ];

  const content = (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Montessori Learning Pathways</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Choose Your Grade
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Select your level to unlock tailored curriculum activities, expeditions, and interactive mind maps.
        </p>
      </div>

      {/* Grade Cards (Three large, clear options) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((opt) => {
          const isSelected = currentGrade === opt.grade;
          return (
            <div
              key={opt.grade}
              id={`grade-option-${opt.grade}`}
              onClick={() => onSelectGrade(opt.grade)}
              className={`relative rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between bg-white border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-indigo-100'
                  : `${opt.borderColor} hover:border-slate-300`
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  <span>Selected</span>
                </div>
              )}

              <div>
                {/* Icon & Level tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${opt.bgColor} border border-slate-100`}>
                    {opt.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {opt.grade === 'both' ? 'Shared' : `Grade ${opt.grade}`}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {opt.title}
                </h3>
                <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                  {opt.levelTag}
                </p>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {opt.description}
                </p>

                {/* Highlights List */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {opt.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action Button */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  id={`select-grade-${opt.grade}-btn`}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  <span>Select {opt.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note on grade persistence */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          Your grade selection will be saved to your student profile. You can switch grades anytime in the Lab.
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
      {content}
    </div>
  );
};
