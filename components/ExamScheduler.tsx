
import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Save, Trash2, ChevronRight, Clock } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { ExamSchedule, ExamEntry } from '../types';

const ExamScheduler: React.FC = () => {
  const { classes, examSchedules, createExamSchedule, addExamEntry, deleteExamSchedule } = useSchool();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(examSchedules[0]?.id || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sort classes 12 -> Nur for display consistency
  const sortedClasses = useMemo(() => {
    const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };
    const getGradeValue = (grade: string) => {
        const num = parseInt(grade);
        return isNaN(num) ? (gradeMap[grade] || -10) : num;
    };
    return [...classes].sort((a, b) => {
        const valA = getGradeValue(a.grade);
        const valB = getGradeValue(b.grade);
        if (valA !== valB) return valB - valA;
        return a.section.localeCompare(b.section);
    });
  }, [classes]);

  // Create Schedule Form
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');

  // Add Exam Entry Form
  const [newEntryDate, setNewEntryDate] = useState('');
  const [newEntryClassId, setNewEntryClassId] = useState(sortedClasses[0]?.id || '');
  const [newEntrySubject, setNewEntrySubject] = useState('');
  // Default time kept internally
  const defaultTime = '09:00 AM';

  // Derived
  const selectedSchedule = examSchedules.find(s => s.id === selectedScheduleId);
  const selectedClassForEntry = classes.find(c => c.id === newEntryClassId);
  const availableSubjects = selectedClassForEntry ? selectedClassForEntry.periodAllocation.map(p => p.subject) : [];

  const handleCreateSchedule = () => {
    if (!newScheduleTitle || !newStartDate) return;
    const schedule: ExamSchedule = {
      id: `sch_${Date.now()}`,
      title: newScheduleTitle,
      startDate: newStartDate,
      endDate: newStartDate, // Updates as exams are added
      status: 'Draft',
      entries: []
    };
    createExamSchedule(schedule);
    setShowCreateModal(false);
    setSelectedScheduleId(schedule.id);
    setNewScheduleTitle('');
  };

  const handleAddEntry = () => {
    if (!selectedScheduleId || !newEntryDate || !newEntryClassId || !newEntrySubject) return;

    const entry: ExamEntry = {
      id: `ex_entry_${Date.now()}`,
      date: newEntryDate,
      classId: newEntryClassId,
      className: selectedClassForEntry?.name || 'Unknown',
      subject: newEntrySubject,
      startTime: defaultTime,
      durationMinutes: 180
    };

    addExamEntry(selectedScheduleId, entry);
    // Reset fields nicely
    setNewEntrySubject(''); 
    // Keep date and class to allow rapid entry
  };

  return (
    <div className="space-y-6 animate-fade-in h-[600px] md:h-[calc(100vh-16rem)] flex flex-col min-h-0">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Date Sheet Generator</h2>
          <p className="text-gray-500">Schedule exams and create date sheets for classes.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-school-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> New Exam Schedule
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden min-h-0">
        {/* Left: Schedule List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
             <h3 className="font-bold text-gray-700">Exam Terms</h3>
           </div>
           <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
             {examSchedules.map(sch => (
               <button
                 key={sch.id}
                 onClick={() => setSelectedScheduleId(sch.id)}
                 className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedScheduleId === sch.id ? 'bg-school-50 border-l-4 border-school-600' : ''}`}
               >
                 <p className="font-bold text-gray-800 text-sm">{sch.title}</p>
                 <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sch.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {sch.status}
                    </span>
                    <span className="text-xs text-gray-500">{sch.entries.length} Papers</span>
                 </div>
               </button>
             ))}
             {examSchedules.length === 0 && (
                 <div className="p-8 text-center text-gray-400 text-sm">No schedules created.</div>
             )}
           </div>
        </div>

        {/* Right: Scheduler */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {selectedSchedule ? (
            <>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedSchedule.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar size={14}/> Start Date: {selectedSchedule.startDate}
                    </p>
                 </div>
                 <button 
                    onClick={() => { if(confirm('Delete this schedule?')) deleteExamSchedule(selectedSchedule.id)}}
                    className="text-red-500 hover:text-red-700 p-2"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>

              {/* Add Entry Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3 items-end shrink-0">
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Date</label>
                    <input type="date" className="w-full text-sm bg-white text-gray-900 border border-gray-300 rounded px-2 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none" 
                        value={newEntryDate} onChange={e => setNewEntryDate(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Class</label>
                    <select className="w-full text-sm bg-white text-gray-900 border border-gray-300 rounded px-2 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                        value={newEntryClassId} onChange={e => { setNewEntryClassId(e.target.value); setNewEntrySubject(''); }}
                    >
                        {sortedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Subject</label>
                    <select className="w-full text-sm bg-white text-gray-900 border border-gray-300 rounded px-2 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                        value={newEntrySubject} onChange={e => setNewEntrySubject(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {availableSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <button onClick={handleAddEntry} className="bg-school-600 text-white py-2 rounded text-sm font-medium hover:bg-school-700 h-[38px]">
                    Add Exam
                 </button>
              </div>

              {/* Date Sheet Table */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                 <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 bg-gray-50 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Subject</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {selectedSchedule.entries
                            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-gray-600">{entry.date}</td>
                                <td className="px-4 py-3 font-bold text-school-700">{entry.className}</td>
                                <td className="px-4 py-3 text-gray-800">{entry.subject}</td>
                            </tr>
                        ))}
                        {selectedSchedule.entries.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-10 text-gray-400">No exams scheduled yet. Add from above.</td></tr>
                        )}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p>Select an exam schedule to edit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">New Exam Schedule</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" placeholder="e.g. Mid-Term 2024" className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                             value={newScheduleTitle} onChange={e => setNewScheduleTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Approx Start Date</label>
                        <input type="date" className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                             value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded text-gray-700 font-medium">Cancel</button>
                    <button onClick={handleCreateSchedule} className="flex-1 px-4 py-2 bg-school-600 text-white rounded font-medium">Create</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduler;
