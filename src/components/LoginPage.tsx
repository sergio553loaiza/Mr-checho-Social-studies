import React, { useState } from 'react';
import { Compass, Sparkles, Globe, ShieldCheck, AlertCircle, GraduationCap, Check } from 'lucide-react';
import { signInWithGoogle } from '../services/auth';
import { StudentGroup } from '../types';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mrchecho_pending_group') as StudentGroup | null) || null;
    }
    return null;
  });

  const handleSelectGroup = (group: StudentGroup) => {
    setSelectedGroup(group);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mrchecho_pending_group', group);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (selectedGroup && typeof window !== 'undefined') {
        localStorage.setItem('mrchecho_pending_group', selectedGroup);
      }
      await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in was cancelled. Please try again when ready.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please check your internet connection.');
      } else {
        setErrorMessage(error.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-slate-50 to-purple-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Emblem */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-200 mb-5">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Mr Checho&apos;s Social Studies Lab
        </h1>
        <p className="mt-2 text-sm text-indigo-700 font-semibold tracking-wide uppercase">
          Montessori Elementary Interactive Lab 2.0
        </p>
        <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
          Explore world geography, continents, oceans, cultures, and Montessori history investigations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-indigo-100/50 rounded-2xl border border-indigo-100/80">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Authentication Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-base font-semibold text-slate-800">
                Sign in to your Learning Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Students and teachers authenticate using their Google institutional account.
              </p>
            </div>

            {/* Student Group Selector */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Selecciona tu Grupo (Estudiantes)</span>
                </label>
                {selectedGroup ? (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-indigo-600" />
                    Grupo {selectedGroup}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium italic">
                    (Opcional antes de entrar)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Elige tu grupo para clasificar automáticamente tus actividades y calificaciones:
              </p>

              {/* 4th Grade */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1.5">
                  Grado 4°:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['4A', '4B', '4C'] as StudentGroup[]).map((grp) => {
                    const isSelected = selectedGroup === grp;
                    return (
                      <button
                        key={grp}
                        id={`login-group-${grp}`}
                        type="button"
                        onClick={() => handleSelectGroup(grp)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>Grupo {grp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5th Grade */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">
                  Grado 5°:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['5A', '5B', '5C'] as StudentGroup[]).map((grp) => {
                    const isSelected = selectedGroup === grp;
                    return (
                      <button
                        key={grp}
                        id={`login-group-${grp}`}
                        type="button"
                        onClick={() => handleSelectGroup(grp)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>Grupo {grp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-slate-300 rounded-xl shadow-xs text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>
                {loading
                  ? 'Authenticating...'
                  : selectedGroup
                  ? `Ingresar como Grupo ${selectedGroup} con Google`
                  : 'Sign in with Google'}
              </span>
            </button>

            {/* Features Highlight */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Clasificación por Grupo:</strong> Estudiantes clasificados en 4A, 4B, 4C y 5A, 5B, 5C.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Cloud Persistence:</strong> Respuestas y avances guardados en tiempo real en Firestore.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Optimized for Devices:</strong> Funciona en Chromebooks, iPads y computadores.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200/80">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Teacher Account: <code className="text-indigo-700 font-mono font-semibold">sergio553.loaiza@montessori.edu.co</code>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Mr Checho&apos;s Montessori Elementary Social Studies Program
        </p>
      </div>
    </div>
  );
};
