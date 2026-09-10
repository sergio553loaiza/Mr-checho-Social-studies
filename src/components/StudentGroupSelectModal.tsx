import React, { useState } from 'react';
import { Compass, GraduationCap, Sparkles, Check, ArrowRight } from 'lucide-react';
import { AppUser, StudentGroup, STUDENT_GROUPS } from '../types';
import { updateUserGroup } from '../services/auth';

interface StudentGroupSelectModalProps {
  user: AppUser;
  isOpen: boolean;
  onGroupSelected: (group: StudentGroup) => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

export const StudentGroupSelectModal: React.FC<StudentGroupSelectModalProps> = ({
  user,
  isOpen,
  onGroupSelected,
  canDismiss = false,
  onClose,
}) => {
  const [selected, setSelected] = useState<StudentGroup | null>(user.studentGroup || null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateUserGroup(user.uid, selected);
      onGroupSelected(selected);
    } catch (err) {
      console.error('Failed to save selected group:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black tracking-tight">
            ¿A qué grupo perteneces?
          </h3>
          <p className="text-xs text-indigo-100 mt-1 max-w-sm mx-auto leading-relaxed">
            Hola, <strong className="text-white">{user.name.split(' ')[0]}</strong>. Selecciona tu grupo escolar para activar tus misiones y sincronizar tus calificaciones con Mr Checho.
          </p>
        </div>

        {/* Group Options */}
        <div className="p-6 space-y-5">
          {/* 4th Grade */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Grado 4° de Primaria</span>
              </span>
              <span className="text-[11px] text-blue-700 font-medium">
                Democracia y Ciudadanía
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {(['4A', '4B', '4C'] as StudentGroup[]).map((grp) => {
                const isCurrent = selected === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    id={`select-modal-group-${grp}`}
                    onClick={() => setSelected(grp)}
                    className={`py-3 px-3 rounded-xl text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border-2 ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 scale-102 ring-2 ring-blue-400/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                      <span>Grupo {grp}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5th Grade */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Grado 5° de Primaria</span>
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                Símbolos e Independencia
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {(['5A', '5B', '5C'] as StudentGroup[]).map((grp) => {
                const isCurrent = selected === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    id={`select-modal-group-${grp}`}
                    onClick={() => setSelected(grp)}
                    className={`py-3 px-3 rounded-xl text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border-2 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-102 ring-2 ring-indigo-400/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                      <span>Grupo {grp}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            No te preocupes si te equivocas: podrás cambiarlo en cualquier momento desde tu perfil o con Mr Checho.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {canDismiss && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium pl-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Colegio Montessori</span>
            </div>
          )}

          <button
            type="button"
            id="confirm-group-selection-btn"
            disabled={!selected || saving}
            onClick={handleConfirm}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <span>Confirmar Grupo {selected || ''}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
