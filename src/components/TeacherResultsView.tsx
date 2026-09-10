import React, { useState, useEffect } from 'react';
import { Award, Download, CheckCircle2, TrendingUp, Users, Filter, GraduationCap } from 'lucide-react';
import { ActivityAttempt, StudentGroup } from '../types';
import { subscribeToTeacherDashboard } from '../services/firestore';
import { AttemptDetailModal } from './AttemptDetailModal';

type GroupFilter = 'ALL' | StudentGroup | 'UNASSIGNED';

export const TeacherResultsView: React.FC = () => {
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ActivityAttempt | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL');

  useEffect(() => {
    const unsub = subscribeToTeacherDashboard((list) => {
      setAttempts(list);
    });
    return () => unsub();
  }, []);

  const filteredAttempts = attempts.filter((a) => {
    if (groupFilter === 'ALL') return true;
    if (groupFilter === 'UNASSIGNED') return !a.studentGroup;
    return a.studentGroup === groupFilter;
  });

  const completed = filteredAttempts.filter((a) => a.status === 'COMPLETED');
  const masteryCount = completed.filter((a) => (a.percentage || 0) >= 80).length;
  const developingCount = completed.filter(
    (a) => (a.percentage || 0) >= 60 && (a.percentage || 0) < 80
  ).length;
  const needsPracticeCount = completed.filter((a) => (a.percentage || 0) < 60).length;

  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Student Email',
      'Student Group',
      'Activity Title',
      'Status',
      'Score',
      'Total Questions',
      'Percentage',
      'Started At',
      'Completed At',
    ];

    const rows = filteredAttempts.map((a) => [
      `"${a.studentName.replace(/"/g, '""')}"`,
      `"${a.studentEmail.replace(/"/g, '""')}"`,
      `"${a.studentGroup || 'Unassigned'}"`,
      `"${a.activityTitle.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      a.score,
      a.totalQuestions,
      `${a.percentage}%`,
      `"${a.startedAt}"`,
      `"${a.completedAt || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const groupSuffix = groupFilter === 'ALL' ? 'All_Groups' : `Group_${groupFilter}`;
    link.setAttribute(
      'download',
      `Mr_Checho_Results_${groupSuffix}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Performance & Results
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro holístico de notas y progreso clasificado por grupo escolar (4A, 4B, 4C y 5A, 5B, 5C).
          </p>
        </div>

        {attempts.length > 0 && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Exportar CSV {groupFilter !== 'ALL' ? `(Grupo ${groupFilter})` : ''}</span>
          </button>
        )}
      </div>

      {/* Group Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filtrar Resultados por Grupo:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setGroupFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              groupFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>

          <span className="text-slate-300">|</span>

          {/* Grado 4 */}
          <div className="inline-flex items-center gap-1 bg-blue-50/70 p-0.5 rounded-xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 px-1.5 uppercase">4°:</span>
            {(['4A', '4B', '4C'] as StudentGroup[]).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setGroupFilter(grp)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  groupFilter === grp
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* Grado 5 */}
          <div className="inline-flex items-center gap-1 bg-indigo-50/70 p-0.5 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700 px-1.5 uppercase">5°:</span>
            {(['5A', '5B', '5C'] as StudentGroup[]).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setGroupFilter(grp)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  groupFilter === grp
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100/50'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setGroupFilter('UNASSIGNED')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              groupFilter === 'UNASSIGNED'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Sin Grupo
          </button>
        </div>
      </div>

      {/* Mastery Tier Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase">
            <span>Mastery (80% - 100%)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-2">
            {masteryCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exemplary understanding of geography concepts
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase">
            <span>Developing (60% - 79%)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-800 mt-2">
            {developingCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Solid grasp with opportunities for reinforcement
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase">
            <span>Needs Practice (&lt; 60%)</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-amber-800 mt-2">
            {needsPracticeCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recommended for targeted Montessori materials review
          </p>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {groupFilter === 'ALL'
              ? 'Todos los Intentos de Estudiantes'
              : `Intentos de Estudiantes • Grupo ${groupFilter}`}
          </h3>
          <span className="text-xs text-slate-500">
            {filteredAttempts.length} Intentos Registrados
          </span>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron intentos para este grupo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Grupo</th>
                  <th className="px-6 py-3.5">Activity</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Percentage</th>
                  <th className="px-6 py-3.5">Completed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAttempt(a)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {a.studentName}
                    </td>
                    <td className="px-4 py-4">
                      {a.studentGroup ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            a.studentGroup.startsWith('4')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>{a.studentGroup}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Sin grupo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{a.activityTitle}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          a.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {a.status === 'COMPLETED'
                        ? a.finalScore !== undefined
                          ? `${a.finalScore.toFixed(1)} / 10`
                          : `${a.score} / ${a.totalQuestions}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-700">
                      {a.percentage}%
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AttemptDetailModal
        attempt={selectedAttempt}
        isOpen={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
      />
    </div>
  );
};
