
import React, { useState, useMemo } from 'react';
import { Plus, Users, ChevronRight, Search, BookOpen } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { SchoolClass } from '../types';

const ClassManagement: React.FC = () => {
  const { classes, students, teachers, addClass, updateStudentClass, assignClassTeacher } = useSchool();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Class State
  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState('');

  // Selected Class View
  // Default to the first class in the sorted list if available
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

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
          
          if (valA !== valB) return valB - valA; // Descending (12 -> Nur)
          return a.section.localeCompare(b.section); 
      });
  }, [classes]);

  // Set initial selected class if none selected
  React.useEffect(() => {
      if (!selectedClassId && sortedClasses.length > 0) {
          setSelectedClassId(sortedClasses[0].id);
      }
  }, [sortedClasses, selectedClassId]);

  const handleCreateClass = () => {
    if (!newGrade || !newSection) return;
    const name = `${newGrade}-${newSection.toUpperCase()}`;
    // Check duplicate
    if (classes.find(c => c.name === name)) {
      alert('Class already exists!');
      return;
    }

    const newClass: SchoolClass = {
      id: `c${Date.now()}`,
      grade: newGrade,
      section: newSection.toUpperCase(),
      name: name,
      studentIds: [],
      periodAllocation: [],
      totalPeriodsPerWeek: 40 // Default, can be edited in Curriculum
    };
    addClass(newClass);
    setShowCreateModal(false);
    setNewGrade('');
    setNewSection('');
  };

  const handleAddStudentToClass = (studentId: string) => {
    if (selectedClassId) {
      updateStudentClass(studentId, selectedClassId);
      setStudentSearch(''); // Clear search after adding
    }
  };

  const selectedClass = sortedClasses.find(c => c.id === selectedClassId);
  const studentsInClass = students.filter(s => s.classId === selectedClassId);
  
  // Identify Class Teacher
  const currentClassTeacher = teachers.find(t => t.id === selectedClass?.classTeacherId);
  
  // Filter teachers who teach this class (for prioritization in dropdown)
  const teachersTeachingThisClass = selectedClass 
      ? teachers.filter(t => t.workload.some(w => w.classId === selectedClass.id)) 
      : [];
  const otherTeachers = selectedClass 
      ? teachers.filter(t => !t.workload.some(w => w.classId === selectedClass.id))
      : teachers;

  // Search for students NOT in the current class
  const searchResults = studentSearch 
    ? students.filter(s => 
        s.classId !== selectedClassId && 
        (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
         s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Class Management</h2>
          <p className="text-gray-500">Define classes, sections, and manage rosters.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-school-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Define New Class
        </button>
      </div>

      {/* Adjusted height calculation: 100vh - (Header + Tabs + Padding) ~= 100vh - 16rem */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] md:h-[calc(100vh-16rem)] min-h-0">
        {/* Left Column: List of Classes */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
             <h3 className="font-semibold text-gray-700">All Classes</h3>
           </div>
           <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
             {sortedClasses.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">No classes defined yet.</div>
             )}
             {sortedClasses.map(cls => (
               <button
                 key={cls.id}
                 onClick={() => setSelectedClassId(cls.id)}
                 className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedClassId === cls.id ? 'bg-school-50 border-l-4 border-school-600' : ''}`}
               >
                 <div>
                    <span className="text-lg font-bold text-gray-800">{cls.name}</span>
                    <p className="text-xs text-gray-500">{cls.studentIds.length} Students</p>
                 </div>
                 <ChevronRight size={16} className="text-gray-400" />
               </button>
             ))}
           </div>
        </div>

        {/* Right Column: Class Details & Roster */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {selectedClass ? (
            <>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900">Class {selectedClass.name}</h3>
                    <div className="mt-2 flex items-center gap-2">
                        <label className="text-sm text-gray-500">Class Teacher:</label>
                        <select 
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-school-500"
                            value={selectedClass.classTeacherId || ''}
                            onChange={(e) => assignClassTeacher(selectedClass.id, e.target.value)}
                        >
                            <option value="">-- Assign --</option>
                            {teachersTeachingThisClass.length > 0 && (
                                <optgroup label="Teaching This Class">
                                    {teachersTeachingThisClass.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </optgroup>
                            )}
                            <optgroup label="Other Staff">
                                {otherTeachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                 </div>
                 <div className="bg-school-100 text-school-700 px-3 py-1 rounded-full text-xs font-bold">
                    {studentsInClass.length} Students
                 </div>
              </div>

              {/* Add Student Section */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search student to add to this class..." 
                        className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-school-500"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                    />
                </div>
                {/* Search Results Dropdown */}
                {studentSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-[calc(100%-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map(s => (
                            <div key={s.id} className="p-3 hover:bg-gray-50 flex justify-between items-center border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{s.name}</p>
                                    <p className="text-xs text-gray-500">{s.admissionNo} • Current: {s.className || 'Unassigned'}</p>
                                </div>
                                <button 
                                    onClick={() => handleAddStudentToClass(s.id)}
                                    className="px-3 py-1 bg-school-600 text-white text-xs rounded hover:bg-school-700"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {studentSearch && searchResults.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2 ml-1">No matching students found outside this class.</p>
                )}
              </div>

              {/* Roster List */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                 <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 bg-gray-50 font-medium sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Admission No</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Stream</th>
                            <th className="px-4 py-2">Guardian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {studentsInClass.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-gray-500">{s.admissionNo}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                <td className="px-4 py-3 text-gray-600">{s.stream || '-'}</td>
                                <td className="px-4 py-3 text-gray-600">{s.guardianName}</td>
                            </tr>
                        ))}
                        {studentsInClass.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">
                                    No students in this class yet. Search above to add.
                                </td>
                            </tr>
                        )}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p>Select a class to view details or add students.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Define New Class</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Class</label>
                        <select 
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                            value={newGrade}
                            onChange={(e) => setNewGrade(e.target.value)}
                        >
                            <option value="">Select Grade</option>
                            {[12,11,10,9,8,7,6,5,4,3,2,1,'UKG','LKG','Nur'].map(g => <option key={g} value={g.toString()}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <input 
                            type="text" 
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                            placeholder="e.g. A, B, C"
                            maxLength={1}
                            value={newSection}
                            onChange={(e) => setNewSection(e.target.value.toUpperCase())}
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
                    <button onClick={handleCreateClass} className="flex-1 px-4 py-2 bg-school-600 text-white rounded-lg font-medium hover:bg-school-700">Create</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
