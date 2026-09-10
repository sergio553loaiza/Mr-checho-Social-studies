import React, { useState, useEffect } from 'react';
import { Users, Mail, Calendar, CheckCircle2, Search, ShieldCheck, GraduationCap, Filter, Check } from 'lucide-react';
import { AppUser, ActivityAttempt, StudentGroup, STUDENT_GROUPS } from '../types';
import { subscribeToUsers, subscribeToTeacherDashboard } from '../services/firestore';
import { updateUserGroup } from '../services/auth';

type GroupFilter = 'ALL' | StudentGroup | 'UNASSIGNED';

export const TeacherStudentsView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<GroupFilter>('ALL');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubUsers = subscribeToUsers((userList) => {
      setUsers(userList);
      setLoading(false);
    });

    const unsubAttempts = subscribeToTeacherDashboard((attList) => {
      setAttempts(attList);
    });

    return () => {
      unsubUsers();
      unsubAttempts();
    };
  }, []);

  const students = users.filter((u) => u.role === 'student');

  // Count calculations
  const groupCounts: Record<StudentGroup, number> = {
    '4A': students.filter((s) => s.studentGroup === '4A').length,
    '4B': students.filter((s) => s.studentGroup === '4B').length,
    '4C': students.filter((s) => s.studentGroup === '4C').length,
    '5A': students.filter((s) => s.studentGroup === '5A').length,
    '5B': students.filter((s) => s.studentGroup === '5B').length,
    '5C': students.filter((s) => s.studentGroup === '5C').length,
  };
  const unassignedCount = students.filter((s) => !s.studentGroup).length;

  const filteredStudents = students.filter((s) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Group filter
    if (activeGroupFilter === 'ALL') return true;
    if (activeGroupFilter === 'UNASSIGNED') return !s.studentGroup;
    return s.studentGroup === activeGroupFilter;
  });

  const handleGroupChange = async (studentUid: string, newGroup: StudentGroup) => {
    setUpdatingUid(studentUid);
    try {
      await updateUserGroup(studentUid, newGroup);
      setUsers((prev) =>
        prev.map((u) => (u.uid === studentUid ? { ...u, studentGroup: newGroup } : u))
      );
    } catch (err) {
      console.error('Failed to change student group:', err);
    } finally {
      setTimeout(() => setUpdatingUid(null), 800);
    }
  };

  // Group stats for current selection
  const groupAttempts = attempts.filter((a) =>
    filteredStudents.some((s) => s.uid === a.studentUid)
  );
  const groupCompleted = groupAttempts.filter((a) => a.status === 'COMPLETED');
  const groupAvgScore =
    groupCompleted.length > 0
      ? Math.round(
          groupCompleted.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            groupCompleted.length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Enrolled Students Roster</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Estudiantes clasificados por grupo (4A, 4B, 4C y 5A, 5B, 5C) con sincronización en tiempo real.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs"
          />
        </div>
      </div>

      {/* Group Classification Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filtrar por Grupo Escolar:</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredStudents.length}</strong> de <strong>{students.length}</strong> estudiantes
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* All Button */}
          <button
            type="button"
            id="filter-group-all"
            onClick={() => setActiveGroupFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              activeGroupFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Todos</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
                activeGroupFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {students.length}
            </span>
          </button>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* 4th Grade Groups */}
          <div className="inline-flex items-center gap-1.5 bg-blue-50/70 p-1 rounded-2xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 px-2 uppercase tracking-wide">
              4°:
            </span>
            {(['4A', '4B', '4C'] as StudentGroup[]).map((grp) => {
              const isSelected = activeGroupFilter === grp;
              const count = groupCounts[grp];
              return (
                <button
                  key={grp}
                  id={`filter-group-${grp}`}
                  type="button"
                  onClick={() => setActiveGroupFilter(grp)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                      : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/60'
                  }`}
                >
                  <span>{grp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 5th Grade Groups */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50/70 p-1 rounded-2xl border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-700 px-2 uppercase tracking-wide">
              5°:
            </span>
            {(['5A', '5B', '5C'] as StudentGroup[]).map((grp) => {
              const isSelected = activeGroupFilter === grp;
              const count = groupCounts[grp];
              return (
                <button
                  key={grp}
                  id={`filter-group-${grp}`}
                  type="button"
                  onClick={() => setActiveGroupFilter(grp)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                      : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100/60'
                  }`}
                >
                  <span>{grp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Unassigned Warning Pill if any students don't have a group */}
          {unassignedCount > 0 && (
            <button
              type="button"
              id="filter-group-unassigned"
              onClick={() => setActiveGroupFilter('UNASSIGNED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeGroupFilter === 'UNASSIGNED'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Sin Grupo</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeGroupFilter === 'UNASSIGNED'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {unassignedCount}
              </span>
            </button>
          )}
        </div>

        {/* Selected Group Quick Metrics Banner */}
        {activeGroupFilter !== 'ALL' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {activeGroupFilter === 'UNASSIGNED'
                  ? 'Estudiantes pendientes por asignar grupo'
                  : `Grupo ${activeGroupFilter}`}
              </span>
              <span>•</span>
              <span>{filteredStudents.length} estudiantes registrados</span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Actividades completadas: <strong className="text-emerald-700">{groupCompleted.length}</strong>
              </span>
              <span>
                Promedio del grupo:{' '}
                <strong className="text-indigo-700">
                  {groupCompleted.length > 0 ? `${groupAvgScore}%` : '—'}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Cargando lista de estudiantes...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">
            No se encontraron estudiantes en este grupo
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeGroupFilter === 'ALL'
              ? 'Los estudiantes aparecerán aquí cuando inicien sesión con su cuenta institucional de Google.'
              : `Aún no hay estudiantes asignados al grupo ${activeGroupFilter}. Puedes asignarles su grupo usando el selector rápido en cualquier tarjeta.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const studentAttempts = attempts.filter((a) => a.studentUid === student.uid);
            const completed = studentAttempts.filter((a) => a.status === 'COMPLETED');
            const inProgress = studentAttempts.filter((a) => a.status === 'IN PROGRESS');

            const avgScore =
              completed.length > 0
                ? Math.round(
                    completed.reduce((acc, a) => acc + (a.percentage || 0), 0) /
                      completed.length
                  )
                : 0;

            const isUpdating = updatingUid === student.uid;
            const currentGroup = student.studentGroup;
            const isGrade4 = currentGroup?.startsWith('4');

            return (
              <div
                key={student.uid}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Student Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {student.photoURL ? (
                        <img
                          src={student.photoURL}
                          alt={student.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-base">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Group Badge */}
                    <div>
                      {currentGroup ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black tracking-tight border ${
                            isGrade4
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{currentGroup}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Sin Grupo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block font-medium">Completadas</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {completed.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">En Curso</span>
                      <span className="font-bold text-amber-700 text-sm">
                        {inProgress.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Promedio</span>
                      <span className="font-bold text-indigo-700 text-sm">
                        {completed.length > 0 ? `${avgScore}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Quick Group Reassignment & Last Active */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`group-select-${student.uid}`}
                      className="text-slate-500 font-medium text-[11px]"
                    >
                      Asignar Grupo:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isUpdating ? (
                        <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Guardando...
                        </span>
                      ) : (
                        <select
                          id={`group-select-${student.uid}`}
                          value={currentGroup || ''}
                          onChange={(e) => {
                            const val = e.target.value as StudentGroup;
                            if (val) handleGroupChange(student.uid, val);
                          }}
                          className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <option value="" disabled>
                            Seleccionar grupo...
                          </option>
                          <optgroup label="Grado 4°">
                            <option value="4A">Grupo 4A</option>
                            <option value="4B">Grupo 4B</option>
                            <option value="4C">Grupo 4C</option>
                          </optgroup>
                          <optgroup label="Grado 5°">
                            <option value="5A">Grupo 5A</option>
                            <option value="5B">Grupo 5B</option>
                            <option value="5C">Grupo 5C</option>
                          </optgroup>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Último acceso:</span>
                    <span className="font-medium text-slate-600">
                      {new Date(student.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
