import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CheckCircle, BookOpen } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { ClassSession } from '../types';

const Academics: React.FC = () => {
  const { classes, students, addClassSession, currentUser, teachers } = useSchool();
  
  // Helper to sort classes 12 -> Nur
  const sortedClasses = useMemo(() => {
    // 1. If Teacher, filter only their classes
    let availableClasses = classes;
    if (currentUser?.role === 'Teacher') {
        const myProfile = teachers.find(t => t.id === currentUser.id);
        if (myProfile) {
            availableClasses = classes.filter(c => 
                myProfile.workload.some(w => w.classId === c.id)
            );
        } else {
            availableClasses = [];
        }
    }

    // 2. Sort Logic
    const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };
    const getGradeValue = (grade: string) => {
        const num = parseInt(grade);
        return isNaN(num) ? (gradeMap[grade] || -10) : num;
    };
    return [...availableClasses].sort((a, b) => {
        const valA = getGradeValue(a.grade);
        const valB = getGradeValue(b.grade);
        if (valA !== valB) return valB - valA; // Descending
        return a.section.localeCompare(b.section);
    });
  }, [classes, currentUser, teachers]);

  // Default to first class (High school) if available
  const [selectedClassId, setSelectedClassId] = useState(sortedClasses[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [absentees, setAbsentees] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived state
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = students.filter(s => s.classId === selectedClassId);
  
  // Get subjects. If Teacher, filter only subjects they teach to that class
  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    
    // Base Allocation
    let subjectList = selectedClass.periodAllocation
        .filter(p => p.periods > 0)
        .map(p => p.subject);

    // If Teacher, narrow down
    if (currentUser?.role === 'Teacher') {
        const myProfile = teachers.find(t => t.id === currentUser.id);
        if (myProfile) {
            const mySubjectsForClass = myProfile.workload
                .filter(w => w.classId === selectedClassId)
                .map(w => w.subject);
            // Intersect
            subjectList = subjectList.filter(s => mySubjectsForClass.includes(s));
        }
    }

    return [...new Set(subjectList)]; // Unique
  }, [selectedClass, currentUser, teachers, selectedClassId]);

  // Update default subject when class changes
  useEffect(() => {
    if (subjects.length > 0) {
        setSubject(subjects[0]);
    } else {
        setSubject('');
    }
  }, [selectedClassId, subjects]);

  // Ensure we have a valid selection on load if sortedClasses changes
  useEffect(() => {
      if (!selectedClassId && sortedClasses.length > 0) {
          setSelectedClassId(sortedClasses[0].id);
      }
  }, [sortedClasses, selectedClassId]);

  const toggleAbsentee = (id: string) => {
    setAbsentees(prev => 
        prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!selectedClassId || !topic || !subject) return;

    const newSession: ClassSession = {
        id: `sess_${Date.now()}`,
        classId: selectedClassId,
        date: sessionDate,
        subject: subject,
        topic: topic,
        absentStudentIds: absentees
    };

    addClassSession(newSession);
    setSaved(true);
    
    setTimeout(() => {
        setSaved(false);
        setTopic('');
        setAbsentees([]);
    }, 3000);
  };

  if (sortedClasses.length === 0) {
      return (
          <div className="max-w-4xl mx-auto p-10 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-2">No Classes Assigned</h3>
              <p>You haven't been assigned any classes yet. Please contact the administrator to update your workload.</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Teacher's Daily Log</h2>
            <p className="text-gray-500 mt-1">Record class progression and attendance for analysis.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Class</label>
                <select 
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:border-school-500 focus:ring-school-500 focus:outline-none"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                >
                    {sortedClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject</label>
                <select 
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:border-school-500 focus:ring-school-500 focus:outline-none"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={subjects.length === 0}
                >
                    {subjects.length > 0 ? (
                        subjects.map((subj, idx) => (
                            <option key={idx} value={subj}>{subj}</option>
                        ))
                    ) : (
                        <option value="">No subjects assigned</option>
                    )}
                </select>
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
                <input 
                    type="date" 
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:border-school-500 focus:ring-school-500 focus:outline-none"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                />
             </div>
        </div>

        <div className="p-8 space-y-6">
            {/* Topic Input */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">What was taught today?</label>
                <div className="relative">
                    <BookOpen className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea 
                        className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-500 focus:outline-none min-h-[100px] shadow-sm placeholder-gray-400"
                        placeholder="e.g., Chapter 4: Moving Charges and Magnetism - Biot-Savart Law derivation"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">This helps the AI identify specific learning gaps for absent students.</p>
            </div>

            {/* Attendance Selection */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Mark Absentees</label>
                {studentsInClass.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {studentsInClass.map(student => (
                            <button
                                key={student.id}
                                onClick={() => toggleAbsentee(student.id)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all shadow-sm text-sm text-left ${
                                    absentees.includes(student.id)
                                        ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="truncate">{student.name}</span>
                                {absentees.includes(student.id) && (
                                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2"></div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm">No students assigned to this class yet.</p>
                )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">
                    {absentees.length > 0 ? `${absentees.length} students marked absent` : 'Full attendance'}
                </span>
                <button 
                    onClick={handleSave}
                    disabled={!topic || !subject || saved}
                    className={`px-6 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 transition-all shadow-md ${
                        saved ? 'bg-green-600' : 'bg-school-600 hover:bg-school-700 hover:shadow-lg'
                    }`}
                >
                    {saved ? (
                        <>
                            <CheckCircle size={18} />
                            Log Saved
                        </>
                    ) : (
                        <>
                            <Calendar size={18} />
                            Save Class Log
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Academics;