import React from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  BookOpen,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { AppUser, getGradeFromGroup } from '../types';
import mrChechoImg from '../assets/images/mr_checho_official.jpg';
import montessoriLogo from '../assets/images/colegio_montessori_logo.svg';

interface HomePageProps {
  user: AppUser;
  onEnterLab: () => void;
  onOpenGradeSelector: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  user,
  onEnterLab,
  onOpenGradeSelector,
}) => {
  const isTeacher = user.role === 'teacher';
  const studentGrade = user.studentGroup ? getGradeFromGroup(user.studentGroup) : user.selectedGrade;
  const is4thGrade = studentGrade === '4';
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex flex-col justify-between">
      {/* Top Banner with Logos and Accreditation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-indigo-100/80">
          <div className="flex items-center gap-3.5">
            <img
              src={montessoriLogo}
              alt="Colegio Montessori Medellín"
              className="h-10 sm:h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback to public asset if needed
                (e.currentTarget as HTMLImageElement).src = '/assets/colegio_montessori_logo.svg';
              }}
              referrerPolicy="no-referrer"
            />
            <div className="h-7 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                Colegio Montessori
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Elementary Social Studies Department
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 shadow-2xs text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authenticated Student: <strong>{user.name.split(' ')[0]}</strong></span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Mr Checho Illustration Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Decorative aura */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-blue-400/20 rounded-3xl blur-xl" />

              <div className="relative bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/50 overflow-hidden p-4 sm:p-5">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-slate-900 flex items-center justify-center">
                  <img
                    src={mrChechoImg}
                    alt="Mr. Checho - Montessori Elementary Social Studies Teacher"
                    className="w-full h-full object-contain object-center transition-transform duration-500 hover:scale-102"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src.includes('official')) {
                        img.src = '/WhatsApp Image 2026-08-26 at 3.24.51 PM.jpeg';
                      } else if (img.src.includes('WhatsApp')) {
                        img.src = '/assets/mr_checho_teacher.jpg';
                      }
                    }}
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Teacher Badge */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs py-2 px-3.5 rounded-xl border border-indigo-100/90 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        Mr. Checho (Sergio Loaiza)
                      </h4>
                      <p className="text-[11px] font-semibold text-indigo-700">
                        Social Studies Guide & Lead Educator
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Explorer Motto Pill */}
                <div className="mt-3.5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Curiosity · Inquiry · Active Citizenship</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Welcoming Message & Enter Lab CTA */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-100/70 text-indigo-800 text-xs font-bold tracking-wider uppercase mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>MONTESSORI ELEMENTARY INTERACTIVE LAB</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Mr Checho&apos;s Social Studies Lab
              </h1>
              <p className="text-sm sm:text-base font-semibold text-indigo-700 mt-1">
                Version 2.0 • Digital Learning & Research Hub
              </p>
            </div>

            {/* Welcoming Message Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-indigo-100 shadow-md shadow-indigo-50/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-bl-full pointer-events-none" />

              <div className="space-y-3.5 text-slate-700 text-sm sm:text-base leading-relaxed">
                <p className="font-bold text-slate-900 text-base sm:text-lg">
                  {is4thGrade ? 'Hello 4th Grade Explorers & Citizens!' : 'Hello Historians and Explorers!'}
                </p>

                {is4thGrade ? (
                  <p>
                    Welcome to our 4th Grade Social Studies digital hub. Here we discover foundational principles of democracy, civic rights and duties, democratic participation, and how each citizen helps build an inspiring school community!
                  </p>
                ) : (
                  <p>
                    Welcome to our 5th Grade Social Studies digital hub. This year, we aren&apos;t just reading history—we are stepping into it! Together, we will travel back to the 19th century to uncover the mysteries of Colombia&apos;s independence, debate constitutional rights, explore our rich biodiversity, and discover how YOU can shape our world as an active global citizen.
                  </p>
                )}

                <p className="text-indigo-900 font-medium">
                  Explore the activities, missions, hands-on projects, and interactive resources. Get ready to question, collaborate, and create!
                </p>
              </div>

              {/* Signature line */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">— Mr. Checho &amp; The Social Studies Team</span>
                <span className="italic">Medellín, Colombia</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                id="enter-the-lab-btn"
                type="button"
                onClick={onEnterLab}
                className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>ENTER THE LAB</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {(isTeacher || !user.studentGroup) && (
                <button
                  id="choose-grade-direct-btn"
                  type="button"
                  onClick={onOpenGradeSelector}
                  className="px-6 py-4 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isTeacher ? 'Select Level View' : 'Choose Grade'}</span>
                </button>
              )}
            </div>

            {/* Lab Highlights Preview Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-1.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900">Montessori Method</span>
                <span className="text-[11px] text-slate-500 leading-tight">Guided inquiry &amp; self-paced</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-1.5">
                  <Globe2 className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900">National Identity</span>
                <span className="text-[11px] text-slate-500 leading-tight">Symbols, history &amp; geography</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="block text-xs font-bold text-slate-900">Real-time Progress</span>
                <span className="text-[11px] text-slate-500 leading-tight">Auto-saved to cloud</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Brand Note */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-slate-400">
        <p>
          Colegio Montessori Elementary Social Studies • Built for 4th and 5th Grade Historians and Explorers
        </p>
      </div>
    </div>
  );
};
