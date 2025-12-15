
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, UserPlus, Eye, ChevronRight, Briefcase, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { Student, StudentStream } from '../types';

const StudentList: React.FC = () => {
  const { students, classes, addStudent, admissionSchema, currentUser } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student Form State (Flexible Map)
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Office Use State (Separate from form data to simulate admin task)
  const [officeData, setOfficeData] = useState({
      admissionNo: '',
      classId: '',
      stream: '',
      house: '', // Added House field
      joiningDate: '2025-04-01' // Updated for 2025-26 Session
  });

  const canCreate = currentUser?.role === 'Admin';
  // REVERTED: Only Admin sees fees.
  const showFinancials = currentUser?.role === 'Admin';

  // Sort classes: 12th -> Nursery for display consistency
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

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal]);

  // Auto-generate admission number when modal opens
  useEffect(() => {
    if (showAddModal) {
        const nextId = 2025000 + students.length + 1; // Updated Base for 2025
        setOfficeData(prev => ({ ...prev, admissionNo: `A-${nextId}` }));
    }
  }, [showAddModal, students.length]);

  // Filter AND Sort Students (12th -> Nursery)
  const filteredStudents = useMemo(() => {
    const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };
    const getGradeValue = (className?: string) => {
        if (!className) return -100;
        const grade = className.split('-')[0]; // Extract '12' from '12-A'
        const num = parseInt(grade);
        return isNaN(num) ? (gradeMap[grade] || -10) : num;
    };

    return students
        .filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === 'All' || student.className?.startsWith(filterClass);
            return matchesSearch && matchesClass;
        })
        .sort((a, b) => {
            const valA = getGradeValue(a.className);
            const valB = getGradeValue(b.className);
            
            if (valA !== valB) return valB - valA; // Descending (12 -> Nur)
            
            // Secondary sort: Name
            return a.name.localeCompare(b.name);
        });
  }, [students, searchTerm, filterClass]);

  const handleInputChange = (fieldId: string, value: string) => {
      setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core fields validation
    if (!formData['name']) {
        alert("Student Name is required");
        return;
    }

    const assignedClass = classes.find(c => c.id === officeData.classId);
    
    // Extract standard fields
    const newStudent: Student = {
        id: `s${Date.now()}`,
        admissionNo: officeData.admissionNo,
        name: formData['name'],
        guardianName: formData['guardianName'] || '',
        contactNo: formData['contactNo'] || '',
        feesStatus: 'Paid',
        attendancePercentage: 100,
        joiningDate: officeData.joiningDate,
        stream: officeData.stream as any,
        house: officeData.house as any, // Assign House
        classId: officeData.classId || '',
        className: assignedClass ? assignedClass.name : 'Unassigned',
        examResults: [], 
        activities: [],
        disciplinaryActions: [],
        customDetails: {},
        // Standard Props for backward compatibility / explicit UI use
        dob: formData['dob'],
        gender: formData['gender'],
        motherName: formData['motherName'],
        address: formData['address']
    };

    // Populate custom details for anything not standard
    admissionSchema.forEach(field => {
        // Skip System fields that are handled manually or in Office Data
        if (field.id === 'admissionNo') return;
        
        if (!field.isSystem && formData[field.id]) {
            if (newStudent.customDetails) {
                newStudent.customDetails[field.id] = formData[field.id];
            }
        }
    });

    addStudent(newStudent);
    setShowAddModal(false);
    setFormData({});
    setOfficeData({ admissionNo: '', classId: '', stream: '', house: '', joiningDate: '2025-04-01' });
  };

  const renderField = (field: any) => {
      // Skip fields handled in Office Panel
      if (field.id === 'admissionNo') return null;

      return (
          <div key={field.id} className={`col-span-1 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                  <textarea 
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                      rows={3}
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                  />
              ) : field.type === 'select' ? (
                  <select 
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                  >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                      ))}
                  </select>
              ) : (
                  <input 
                      type={field.type} 
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                  />
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Student Directory</h2>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
                <Download size={16} /> Export CSV
            </button>
            {canCreate && (
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-school-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-700 shadow-sm flex items-center gap-2"
                >
                    <UserPlus size={16} /> New Admission
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-school-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select 
                className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
            >
                <option value="All">All Classes</option>
                {sortedClasses.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Admission No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Class/Sec</th>
                <th className="px-6 py-4">Stream</th>
                {showFinancials && <th className="px-6 py-4">Fees</th>}
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-gray-500">
                    <Link to={`/students/${student.id}`} className="hover:text-school-600 hover:underline font-medium">
                        {student.admissionNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/students/${student.id}`} className="block group-hover:text-school-700 transition-colors" title={`Login ID: ${student.admissionNo}`}>
                        {student.name}
                        <div className="text-xs text-gray-500 font-normal">{student.guardianName}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {student.className ? (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {student.className}
                         </span>
                    ) : (
                         <span className="text-red-500 text-xs font-semibold">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{student.stream || '-'}</td>
                  
                  {showFinancials && (
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.feesStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        student.feesStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                        }`}>
                        {student.feesStatus}
                        </span>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${student.attendancePercentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${student.attendancePercentage}%`}}></div>
                        </div>
                        <span className="text-xs">{student.attendancePercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                        to={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 text-school-600 hover:text-school-800 bg-school-50 hover:bg-school-100 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    >
                      <Eye size={14} /> View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">No students found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            {/* FORCE FIXED HEIGHT FOR SCROLLING: h-[85vh] instead of max-h */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden h-[85vh] flex flex-col md:flex-row">
                
                {/* LEFT SIDE: THE FORM (Data Entry) */}
                <div className="flex-1 flex flex-col overflow-hidden h-full min-h-0">
                    <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Admission Form</h3>
                            <p className="text-xs text-gray-500">Please fill in student details</p>
                        </div>
                    </div>
                    
                    <form id="admissionForm" onSubmit={handleAddStudent} className="flex-1 overflow-y-auto p-6 bg-white overscroll-contain">
                        <div className="space-y-6">
                            {['Personal', 'Parent', 'Other'].map(section => {
                                const fields = admissionSchema.filter(f => f.section === section);
                                if (fields.length === 0) return null;

                                return (
                                    <div key={section} className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2 uppercase text-xs tracking-wide text-school-600">{section} Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {fields.map(field => renderField(field))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </form>
                </div>

                {/* RIGHT SIDE: OFFICE USE ONLY */}
                <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 flex flex-col p-6 shrink-0 h-full overflow-y-auto overscroll-contain min-h-0">
                    <div className="mb-6 flex items-center gap-2 text-gray-800 shrink-0">
                        <Briefcase size={20} className="text-school-600" />
                        <h3 className="font-bold">Office Use Only</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admission Number</label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-50 text-gray-900 font-mono font-bold text-lg border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                                value={officeData.admissionNo}
                                onChange={e => setOfficeData({...officeData, admissionNo: e.target.value})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Auto-generated. Editable if required.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Allocate Class</label>
                            <select 
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                                value={officeData.classId}
                                onChange={e => setOfficeData({...officeData, classId: e.target.value})}
                            >
                                <option value="">-- Unassigned --</option>
                                {sortedClasses.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign House</label>
                            <select 
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                                value={officeData.house}
                                onChange={e => setOfficeData({...officeData, house: e.target.value})}
                            >
                                <option value="">-- Unassigned --</option>
                                <option value="Red">Red House</option>
                                <option value="Blue">Blue House</option>
                                <option value="Green">Green House</option>
                                <option value="Yellow">Yellow House</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream (Seniors Only)</label>
                            <select 
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                                value={officeData.stream}
                                onChange={e => setOfficeData({...officeData, stream: e.target.value})}
                            >
                                <option value="">None / General</option>
                                <option value={StudentStream.SCIENCE}>Science</option>
                                <option value={StudentStream.COMMERCE}>Commerce</option>
                                <option value={StudentStream.HUMANITIES}>Humanities</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                            <input 
                                type="date"
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                                value={officeData.joiningDate}
                                onChange={e => setOfficeData({...officeData, joiningDate: e.target.value})}
                            />
                        </div>

                        <div className="pt-6 mt-auto shrink-0">
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                                <button type="submit" form="admissionForm" className="flex-1 px-4 py-3 bg-school-600 text-white rounded-lg font-bold hover:bg-school-700 shadow-md">Complete Admission</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
