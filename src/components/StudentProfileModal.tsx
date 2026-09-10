import React, { useState } from 'react';
import { X, User, Mail, ShieldCheck, Calendar, LogOut, CheckCircle2, GraduationCap, Check } from 'lucide-react';
import { AppUser, StudentGroup, STUDENT_GROUPS } from '../types';
import { signOutUser, updateUserGroup } from '../services/auth';

interface StudentProfileModalProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated?: (group: StudentGroup) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onGroupUpdated,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | undefined>(user.studentGroup);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const isTeacher = user.role === 'teacher';

  const handleSignOut = async () => {
    onClose();
    await signOutUser();
  };

  const handleSaveGroup = async (group: StudentGroup) => {
    setSaving(true);
    try {
      await updateUserGroup(user.uid, group);
      setSelectedGroup(group);
      setIsChangingGroup(false);
      if (onGroupUpdated) {
        onGroupUpdated(group);
      }
    } catch (err) {
      console.error('Failed to update group:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center border border-white/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{user.name}</h3>
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-indigo-100 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isTeacher ? 'Profesor / Teacher' : `Estudiante • Grupo ${selectedGroup || 'Sin Grupo'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-3.5 text-sm">
          {/* Student Group Section */}
          {!isTeacher && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Grupo de Social Studies
                  </span>
                </div>
                {selectedGroup && (
                  <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Grupo {selectedGroup}
                  </span>
                )}
              </div>

              {isChangingGroup ? (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] text-slate-500 block">
                    Selecciona tu nuevo grupo:
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {STUDENT_GROUPS.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleSaveGroup(grp)}
                        disabled={saving}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          selectedGroup === grp
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingGroup(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline mt-1"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-600">
                    {selectedGroup
                      ? `Asignado al grado ${selectedGroup.startsWith('4') ? '4°' : '5°'}`
                      : 'Aún no has seleccionado tu grupo escolar'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsChangingGroup(true)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  >
                    Cambiar grupo
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Correo Institucional
              </span>
              <span className="text-slate-800 font-medium truncate block">
                {user.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Última Sesión Activa
              </span>
              <span className="text-slate-800 font-medium">
                {new Date(user.lastLoginAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Cuenta activa y autenticada. Tu progreso se guarda automáticamente en tiempo real en la nube.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
