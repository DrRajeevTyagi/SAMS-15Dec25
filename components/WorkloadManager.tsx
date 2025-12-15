
import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle, AlertTriangle, BookOpen, Wand2 } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Teacher } from '../types';

const WorkloadManager: React.FC = () => {
  const { teachers, classes, assignTeacherToSubject, triggerAutoAllocation } = useSchool();
  
  // Sort classes: 12th -> Nursery
  const sortedClasses = useMemo(() => {
    const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };
    const getGradeValue = (grade: string) => {
        const num = parseInt(grade);
        return isNaN(num) ? (gradeMap[grade] || -10) : num;
    };
    return [...classes].sort((a, b) => {
        const valA = getGradeValue(a.grade);
        const valB = getGradeValue(b.grade);
        if (valA !== valB) return valB - valA; // Descending
        return a.section.localeCompare(b.section);
    });
  }, [classes]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(sortedClasses[0]?.id || null);

  // Ensure default selection respects the sort order
  useEffect(() => {
      if (!selectedClassId && sortedClasses.length > 0) {
          setSelectedClassId(sortedClasses[0].id);
      }
  }, [sortedClasses, selectedClassId]);

  const calculateTeacherLoad = (teacher: Teacher) => {
    return teacher.workload.reduce((sum, item) => sum + item.periods, 0);
  };

  const handleAutoAllocation = () => {
    if(window.confirm("This will redistribute workloads based on seniority and subject matching. Existing manual assignments might be overwritten. Proceed?")) {
        triggerAutoAllocation();
    }
  };

  const selectedClass = sortedClasses.find(c => c.id === selectedClassId);

  return (
    // Fixed Height Container to allow internal scrolling
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px] md:h-[calc(100vh-16rem)] min-h-0">
        {/* LEFT: Class List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 className="font-bold text-gray-700">Select Class</h3>
            </div>
            <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                {sortedClasses.map(cls => {
                    const assignedCount = cls.periodAllocation.filter(p => p.assignedTeacherId).length;
                    const totalCount = cls.periodAllocation.length;
                    const isComplete = assignedCount === totalCount && totalCount > 0;
                    
                    return (
                    <button 
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex justify-between items-center ${selectedClassId === cls.id ? 'bg-school-50 border-l-4 border-school-600' : ''}`}
                    >
                        <div>
                            <p className="font-bold text-gray-800">{cls.name}</p>
                            <p className="text-xs text-gray-500">{assignedCount}/{totalCount} Subjects</p>
                        </div>
                        {isComplete ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                    </button>
                    );
                })}
            </div>
        </div>

        {/* RIGHT: Allocation Table */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {selectedClass ? (
                <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Allocations for Class {selectedClass.name}</h3>
                        <p className="text-sm text-gray-500">Assign teachers for {selectedClass.totalPeriodsPerWeek} periods/week.</p>
                    </div>
                    <button 
                        onClick={handleAutoAllocation}
                        className="bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-2 shadow-sm"
                    >
                        <Wand2 size={16} /> Auto-Fill Gap
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {selectedClass.periodAllocation.map((subjectItem, idx) => {
                            // Filter teachers relevant to this subject
                            const recommendedTeachers = teachers.filter(t => t.mainSubject === subjectItem.subject);
                            const otherTeachers = teachers.filter(t => t.mainSubject !== subjectItem.subject);
                            
                            return (
                                <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-school-300 transition-colors bg-white">
                                    <div className="w-1/4">
                                        <p className="font-bold text-gray-800">{subjectItem.subject}</p>
                                        <p className="text-xs text-gray-500">{subjectItem.periods} Periods / Week</p>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <select 
                                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                            value={subjectItem.assignedTeacherId || ''}
                                            onChange={(e) => assignTeacherToSubject(selectedClass.id, subjectItem.subject, e.target.value)}
                                        >
                                            <option value="">-- Assign Teacher --</option>
                                            
                                            {recommendedTeachers.length > 0 && (
                                                <optgroup label="Recommended (Subject Match)">
                                                    {recommendedTeachers.map(t => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name} • Load: {calculateTeacherLoad(t)}/40
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            
                                            <optgroup label="Others">
                                                {otherTeachers.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name} [{t.mainSubject}] • Load: {calculateTeacherLoad(t)}/40
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div className="w-32 text-right">
                                        {subjectItem.assignedTeacherId ? (
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                                Assigned
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-full border border-orange-200 flex items-center justify-end gap-1">
                                                <AlertTriangle size={12} /> Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {selectedClass.periodAllocation.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                No curriculum defined for this class yet. Go to Curriculum tab.
                            </div>
                        )}
                    </div>
                </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <BookOpen size={48} className="mb-4 opacity-20" />
                    <p>Select a class to manage workload.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default WorkloadManager;
