
import React, { useState, useMemo, useEffect } from 'react';
import { Flag, Shield, User, Crown, Plus, Trophy, Palette, AlertTriangle, Award, TrendingUp } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Teacher } from '../types';

const HouseManager: React.FC = () => {
  const { teachers, students, updateTeacher, events, currentUser } = useSchool();
  const [activeHouse, setActiveHouse] = useState<'Red' | 'Blue' | 'Green' | 'Yellow'>('Red');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);

  const canEdit = currentUser?.role === 'Admin';
  
  // Identify if the user is a student
  const isStudent = currentUser?.role === 'Student';
  const studentHouse = isStudent ? students.find(s => s.id === currentUser.id)?.house : null;

  // Force student to view only their house
  useEffect(() => {
      if (isStudent && studentHouse && studentHouse !== activeHouse) {
          setActiveHouse(studentHouse);
      }
  }, [isStudent, studentHouse, activeHouse]);

  const HOUSE_CONFIG = {
      'Red': { color: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-500' },
      'Blue': { color: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-500' },
      'Green': { color: 'bg-green-500', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', ring: 'ring-green-500' },
      'Yellow': { color: 'bg-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', ring: 'ring-yellow-500' },
  };

  // --- HOUSE STATS CALCULATION (Mirrors Events Logic) ---
  const houseStats = useMemo(() => {
    const stats: Record<string, { sports: number, cultural: number, discipline: number, total: number }> = {
        'Red': { sports: 0, cultural: 0, discipline: 0, total: 0 },
        'Blue': { sports: 0, cultural: 0, discipline: 0, total: 0 },
        'Green': { sports: 0, cultural: 0, discipline: 0, total: 0 },
        'Yellow': { sports: 0, cultural: 0, discipline: 0, total: 0 },
    };

    // 1. Calculate Event Points
    events.forEach(event => {
        event.studentRoles.forEach(role => {
            let house = role.house;
            if (!house) {
                const s = students.find(stu => stu.id === role.studentId);
                if (s) house = s.house;
            }

            if (!house || !stats[house]) return;

            let points = 0;
            const ach = role.achievement || '';

            if (ach.includes('Winner') || ach.includes('1st')) points = 10;
            else if (ach.includes('Runner') || ach.includes('2nd')) points = 7;
            else if (ach.includes('Third') || ach.includes('3rd')) points = 5;
            else if (role.role === 'Participant') points = 1;

            if (event.category === 'Sports') {
                stats[house].sports += points;
            } else {
                stats[house].cultural += points;
            }
        });
    });

    // 2. Calculate Discipline Points (From Manual Cards)
    students.forEach(s => {
        if (!s.house || !stats[s.house]) return;
        
        const penalties = s.disciplinaryActions?.reduce((acc, action) => acc + action.penaltyPoints, 0) || 0;
        stats[s.house].discipline += penalties; // penalties are negative numbers
    });
    
    // 3. Compute Totals
    Object.keys(stats).forEach(h => {
        stats[h].total = stats[h].sports + stats[h].cultural + stats[h].discipline;
    });

    return stats;
  }, [events, students]);

  // Helper to calculate individual student points
  const getStudentPoints = (studentId: string) => {
      let sports = 0;
      let cultural = 0;
      
      events.forEach(ev => {
          const role = ev.studentRoles.find(r => r.studentId === studentId);
          if (role) {
              let p = 1; // Participation Base
              const ach = role.achievement || '';
              if (ach.includes('Winner') || ach.includes('1st')) p = 10;
              else if (ach.includes('Runner') || ach.includes('2nd')) p = 7;
              else if (ach.includes('Third') || ach.includes('3rd')) p = 5;

              if (ev.category === 'Sports') sports += p;
              else cultural += p;
          }
      });

      const s = students.find(stu => stu.id === studentId);
      const discipline = s?.disciplinaryActions?.reduce((acc, a) => acc + a.penaltyPoints, 0) || 0;

      return { sports, cultural, discipline, total: sports + cultural + discipline };
  };

  // Filter Data for Active House
  const houseTeachers = teachers.filter(t => t.house === activeHouse);
  const houseMaster = houseTeachers.find(t => t.isHouseMaster);
  const houseMembers = houseTeachers.filter(t => !t.isHouseMaster);
  const currentStats = houseStats[activeHouse];

  // Sorting Students: Class 12 -> Nursery
  const houseStudents = useMemo(() => {
      const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };
      const getGradeValue = (className?: string) => {
          if (!className) return -100;
          const grade = className.split('-')[0];
          const num = parseInt(grade);
          return isNaN(num) ? (gradeMap[grade] || -10) : num;
      };

      return students
          .filter(s => s.house === activeHouse)
          .sort((a, b) => {
              const valA = getGradeValue(a.className);
              const valB = getGradeValue(b.className);
              if (valA !== valB) return valB - valA; // Descending
              return a.name.localeCompare(b.name);
          });
  }, [students, activeHouse]);

  const handleAddTeacherToHouse = (teacher: Teacher) => {
      updateTeacher({ ...teacher, house: activeHouse, isHouseMaster: false });
      setShowAddTeacherModal(false);
  };

  // Teachers available to be added (No House assigned)
  const availableTeachers = teachers.filter(t => !t.house);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-school-100 rounded-lg text-school-600">
                <Flag size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">House System</h2>
                <p className="text-gray-500">Manage House Masters, Staff Members, and Student Rosters.</p>
            </div>
        </div>

        {/* HOUSE TABS */}
        <div className="grid grid-cols-4 gap-4">
            {(Object.keys(HOUSE_CONFIG) as Array<keyof typeof HOUSE_CONFIG>).map(house => {
                // If student, ONLY render their house button
                if (isStudent && house !== studentHouse) return null;

                return (
                    <button
                        key={house}
                        onClick={() => setActiveHouse(house)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isStudent ? 'col-span-4' : ''} ${
                            activeHouse === house 
                            ? `border-${house === 'Red' ? 'red' : house === 'Blue' ? 'blue' : house === 'Green' ? 'green' : 'yellow'}-500 bg-white shadow-md transform scale-105` 
                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-white hover:border-gray-200'
                        }`}
                        disabled={isStudent}
                    >
                        <Shield size={24} className={activeHouse === house ? HOUSE_CONFIG[house].text : ''} fill={activeHouse === house ? 'currentColor' : 'none'} />
                        <span className={`font-bold ${activeHouse === house ? 'text-gray-900' : ''}`}>{house} House</span>
                        {isStudent && <span className="text-xs text-gray-500">(Your Assigned House)</span>}
                    </button>
                );
            })}
        </div>

        {/* CONTENT AREA */}
        <div className={`rounded-xl border ${HOUSE_CONFIG[activeHouse].border} bg-white overflow-hidden shadow-sm`}>
            {/* Header */}
            <div className={`p-6 ${HOUSE_CONFIG[activeHouse].light} border-b ${HOUSE_CONFIG[activeHouse].border} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold ${HOUSE_CONFIG[activeHouse].text} flex items-center gap-2`}>
                    <Shield size={24} fill="currentColor"/> {activeHouse} House Roster
                </h3>
                <span className="text-sm font-medium text-gray-600 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                    Total Students: {houseStudents.length}
                </span>
            </div>

            {/* --- HOUSE SCORECARD --- */}
            <div className="grid grid-cols-4 gap-px bg-gray-200 border-b border-gray-200">
                <div className="bg-white p-4 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Trophy size={12} className="text-orange-500" /> Sports
                    </span>
                    <span className="text-2xl font-bold text-gray-800">{currentStats.sports}</span>
                </div>
                <div className="bg-white p-4 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Palette size={12} className="text-pink-500" /> Cultural
                    </span>
                    <span className="text-2xl font-bold text-gray-800">{currentStats.cultural}</span>
                </div>
                <div className="bg-white p-4 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <AlertTriangle size={12} className="text-red-500" /> Discipline
                    </span>
                    <span className={`text-2xl font-bold ${currentStats.discipline < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                        {currentStats.discipline}
                    </span>
                </div>
                <div className="bg-gray-50 p-4 flex flex-col items-center justify-center border-l border-gray-200">
                    <span className="text-xs font-bold text-school-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Award size={12} /> Total Score
                    </span>
                    <span className="text-3xl font-black text-school-700">{currentStats.total}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                
                {/* COLUMN 1: STAFF (Takes 1 col) */}
                <div className="lg:col-span-1 p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Crown size={14} className="text-yellow-500"/> House Master / In-charge
                        </h4>
                        {houseMaster ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" title={`ID: ${houseMaster.teacherCode}`}>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-gray-700 shadow-sm border border-gray-100">
                                    {houseMaster.name.charAt(4)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{houseMaster.name}</p>
                                    <p className="text-xs text-gray-500">{houseMaster.mainSubject}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 text-sm">
                                No House Master Assigned
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Staff Members</h4>
                            {canEdit && (
                                <button 
                                    onClick={() => setShowAddTeacherModal(true)}
                                    className="text-xs flex items-center gap-1 text-school-600 hover:text-school-800 font-medium"
                                >
                                    <Plus size={12}/> Add Teacher
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {houseMembers.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors group" title={`ID: ${t.teacherCode}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold">
                                            {t.name.charAt(4)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{t.name}</p>
                                            <p className="text-[10px] text-gray-500">{t.mainSubject}</p>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <button 
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove from House"
                                            onClick={() => updateTeacher({...t, house: undefined})}
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            {houseMembers.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No members assigned yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2, 3, 4: STUDENTS (Takes 3 cols) */}
                <div className="lg:col-span-3 p-6 flex flex-col h-[600px]">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <User size={14}/> Student Roster & Contributions
                        </h4>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 bg-gray-50 font-medium sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 w-16">Class</th>
                                    <th className="px-4 py-2">Student Name</th>
                                    <th className="px-4 py-2 text-center text-[10px] uppercase font-bold text-orange-600 w-20 bg-orange-50/50">Sports</th>
                                    <th className="px-4 py-2 text-center text-[10px] uppercase font-bold text-pink-600 w-20 bg-pink-50/50">Arts</th>
                                    <th className="px-4 py-2 text-center text-[10px] uppercase font-bold text-red-600 w-20 bg-red-50/50">Disc.</th>
                                    <th className="px-4 py-2 text-right font-bold w-20">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {houseStudents.map(s => {
                                    // Calculate individual points dynamically
                                    const points = getStudentPoints(s.id);

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-2 font-bold text-gray-700">{s.className}</td>
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-gray-900 group-hover:text-school-700 transition-colors" title={`Login ID: ${s.admissionNo}`}>
                                                    {s.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center font-mono text-gray-600 bg-orange-50/10">
                                                {points.sports > 0 ? points.sports : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-center font-mono text-gray-600 bg-pink-50/10">
                                                {points.cultural > 0 ? points.cultural : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-center font-mono bg-red-50/10">
                                                {points.discipline < 0 ? (
                                                    <span className="text-red-500 font-bold">{points.discipline}</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono font-bold text-gray-900">
                                                {points.total !== 0 ? points.total : <span className="text-gray-300">0</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {houseStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-400">No students assigned to this house.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* ADD TEACHER MODAL */}
        {showAddTeacherModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Add Staff to {activeHouse} House</h3>
                        <button onClick={() => setShowAddTeacherModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-2">
                        {availableTeachers.length > 0 ? availableTeachers.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleAddTeacherToHouse(t)}
                                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-school-50 hover:border-school-200 transition-all text-left"
                            >
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.mainSubject}</p>
                                </div>
                                <Plus size={16} className="text-school-600"/>
                            </button>
                        )) : (
                            <p className="text-center text-gray-500 py-4 text-sm">All teachers are already assigned to a house.</p>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default HouseManager;
