
import React, { useState } from 'react';
import { UserPlus, Search, BookOpen, Phone, X, Calendar, GraduationCap, Trophy, Edit2, Check, Save, Shield, Crown, Badge } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Teacher } from '../types';

const Staff: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, events, currentUser } = useSchool();
  
  // Directory State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', qualification: '', mainSubject: '', contactNo: '' });
  
  // Teacher Profile Modal State
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Teacher | null>(null);

  // Permission Check
  const canEdit = currentUser?.role === 'Admin';

  // --- HELPERS ---
  const calculateTeacherLoad = (teacher: Teacher) => {
      return teacher.workload.reduce((sum, item) => sum + item.periods, 0);
  };

  const getLoadColor = (periods: number) => {
      if (periods < 20) return 'text-green-600 bg-green-50 border-green-200';
      if (periods <= 32) return 'text-yellow-700 bg-yellow-50 border-yellow-200'; // Optimal
      return 'text-red-600 bg-red-50 border-red-200'; // Overloaded
  };

  const maskContact = (info: string) => {
    if (!info) return '';
    
    // PROTOCOL RULE 9: Operational Data Visibility
    // Authorized Staff (Admin/Teacher) must see actual contact info.
    if (currentUser?.role === 'Admin' || currentUser?.role === 'Teacher') {
        return info;
    }
    
    // Email check
    if (info.includes('@')) {
         const parts = info.split('@');
         const name = parts[0];
         if (name.length <= 3) return `${name}***@${parts[1]}`;
         return `${name.slice(0,2)}****${name.slice(-1)}@${parts[1]}`;
    }
    // Phone check
    const clean = info.replace(/\D/g, '');
    if (clean.length >= 10) {
        return `${clean.slice(0, 2)}xxxx${clean.slice(-4)}`;
    }
    return info; 
  };

  const getHouseColor = (house?: string) => {
      switch(house) {
          case 'Red': return 'bg-red-500 text-white';
          case 'Blue': return 'bg-blue-500 text-white';
          case 'Green': return 'bg-green-500 text-white';
          case 'Yellow': return 'bg-yellow-500 text-white';
          default: return 'bg-gray-200 text-gray-500';
      }
  };

  // --- HANDLERS ---
  const handleAddTeacher = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTeacher.name) return;
      const tId = `t_${Date.now()}`;
      const teacher: Teacher = {
          id: tId,
          teacherCode: `T-${Math.floor(1000 + Math.random() * 9000)}`, // Simple logic for manually added teacher
          name: newTeacher.name,
          qualification: newTeacher.qualification,
          mainSubject: newTeacher.mainSubject,
          contactNo: newTeacher.contactNo,
          workload: [],
          isClassTeacher: false,
          joiningDate: new Date().toISOString().split('T')[0]
      };
      addTeacher(teacher);
      setShowAddModal(false);
      setNewTeacher({ name: '', qualification: '', mainSubject: '', contactNo: '' });
  };

  const handleEditClick = () => {
      if (selectedTeacher && canEdit) {
          setEditForm({ ...selectedTeacher });
          setIsEditing(true);
      }
  };

  const handleSaveEdit = () => {
      if (editForm && selectedTeacher) {
          updateTeacher(editForm);
          setSelectedTeacher(editForm);
          setIsEditing(false);
      }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.mainSubject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter events for selected teacher
  const teacherEvents = selectedTeacher ? events.filter(e => 
    e.headTeacherId === selectedTeacher.id || 
    e.staffRoles.some(r => r.teacherId === selectedTeacher.id)
  ) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Directory</h2>
          <p className="text-gray-500">View teacher profiles and contact details.</p>
        </div>
        {canEdit && (
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black flex items-center gap-2 shadow-sm"
            >
                <UserPlus size={18} /> Appoint New Staff
            </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
            type="text"
            placeholder="Search staff by name or subject..."
            className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-school-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map(teacher => {
            const load = calculateTeacherLoad(teacher);
            return (
                <div 
                    key={teacher.id} 
                    onClick={() => { setSelectedTeacher(teacher); setIsEditing(false); }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-school-200 transition-all cursor-pointer overflow-hidden group relative"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-school-50 flex items-center justify-center text-school-700 font-bold text-lg group-hover:bg-school-100 transition-colors">
                                    {teacher.name.charAt(4)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-school-700 transition-colors" title={`Login ID: ${teacher.teacherCode}`}>{teacher.name}</h3>
                                    <p className="text-xs text-gray-500">{teacher.qualification}</p>
                                    <p className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono mt-1 w-fit">{teacher.teacherCode}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${getLoadColor(load)}`}>
                                Load: {load}/40
                            </span>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen size={16} className="text-school-400"/>
                                <span className="font-medium">Designation: {teacher.mainSubject}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={16} className="text-school-400"/>
                                <span>{maskContact(teacher.contactNo)}</span>
                            </div>
                        </div>

                        {/* House Badge */}
                        {teacher.house && (
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getHouseColor(teacher.house)}`}>
                                {teacher.isHouseMaster && <Crown size={10} fill="currentColor"/>}
                                {teacher.house}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Active Classes</p>
                            <div className="flex flex-wrap gap-2">
                                {teacher.workload.slice(0, 3).map((w, idx) => (
                                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                                        {w.className}
                                    </span>
                                ))}
                                {teacher.workload.length > 3 && (
                                    <span className="text-xs text-gray-500 px-1 py-1">+{teacher.workload.length - 3} more</span>
                                )}
                                {teacher.workload.length === 0 && <span className="text-xs text-gray-400 italic">No classes assigned</span>}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* TEACHER PROFILE DETAILS MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-school-900 p-6 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-school-900 font-bold text-2xl border-2 border-school-200">
                            {selectedTeacher.name.charAt(4)}
                        </div>
                        <div className="text-white">
                            {isEditing && editForm ? (
                                <input 
                                    className="bg-school-800 text-white border-none rounded px-2 py-1 font-bold text-xl w-full focus:ring-2 focus:ring-school-400 outline-none"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                />
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold">{selectedTeacher.name}</h3>
                                    <p className="text-xs text-school-300 font-mono">ID: {selectedTeacher.teacherCode}</p>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-school-200 text-sm mt-1">
                                <GraduationCap size={16} />
                                {isEditing && editForm ? (
                                    <input 
                                        className="bg-school-800 text-white border-none rounded px-2 py-0.5 text-sm focus:ring-2 focus:ring-school-400 outline-none"
                                        value={editForm.qualification}
                                        onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                                    />
                                ) : (
                                    <span>{selectedTeacher.qualification}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-school-200 text-sm mt-1">
                                <Calendar size={16} />
                                <span>Joined: {selectedTeacher.joiningDate}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                             <button 
                                onClick={handleSaveEdit} 
                                className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                title="Save Changes"
                            >
                                <Save size={20} />
                            </button>
                        ) : (
                            // Only show Edit button if Admin
                            canEdit && (
                                <button 
                                    onClick={handleEditClick} 
                                    className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit2 size={20} />
                                </button>
                            )
                        )}
                        <button 
                            onClick={() => setSelectedTeacher(null)} 
                            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Designated Subject</p>
                            {isEditing && editForm ? (
                                <input 
                                    className="w-full bg-white border border-blue-200 rounded px-2 py-1 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.mainSubject}
                                    onChange={(e) => setEditForm({...editForm, mainSubject: e.target.value})}
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">{selectedTeacher.mainSubject}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Primary Area of Expertise</p>
                        </div>
                        
                        {/* Contact Info (Editable) */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</p>
                            {isEditing && editForm ? (
                                <input 
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-school-500"
                                    value={editForm.contactNo}
                                    onChange={(e) => setEditForm({...editForm, contactNo: e.target.value})}
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Phone size={16} className="text-gray-400"/> {maskContact(selectedTeacher.contactNo)}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Official Contact</p>
                        </div>
                    </div>

                    {/* HOUSE ASSIGNMENT CARD (NEW) */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1">
                                <Shield size={14} /> House Duty
                            </p>
                            {isEditing && editForm ? (
                                <div className="space-y-2">
                                    <select 
                                        className="bg-white border border-yellow-200 rounded px-2 py-1 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500"
                                        value={editForm.house || ''}
                                        onChange={(e) => setEditForm({...editForm, house: e.target.value as any})}
                                    >
                                        <option value="">No House Allocated</option>
                                        <option value="Red">Red House</option>
                                        <option value="Blue">Blue House</option>
                                        <option value="Green">Green House</option>
                                        <option value="Yellow">Yellow House</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-yellow-600 focus:ring-yellow-500"
                                            checked={editForm.isHouseMaster || false}
                                            onChange={(e) => setEditForm({...editForm, isHouseMaster: e.target.checked})}
                                        />
                                        Designate as House In-Charge
                                    </label>
                                </div>
                            ) : (
                                <div>
                                    {selectedTeacher.house ? (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-sm font-bold ${getHouseColor(selectedTeacher.house)}`}>
                                                {selectedTeacher.house} House
                                            </span>
                                            {selectedTeacher.isHouseMaster && (
                                                <span className="text-xs font-bold text-yellow-800 flex items-center gap-1 bg-yellow-200 px-2 py-1 rounded">
                                                    <Crown size={12}/> Master
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No house duties assigned.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Workload Stats */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                             <p className="text-xs font-bold text-purple-600 uppercase mb-1">Total Workload</p>
                             <div className="flex items-end gap-1">
                                <p className="text-2xl font-bold text-gray-900">{calculateTeacherLoad(selectedTeacher)}</p>
                                <p className="text-sm text-gray-500 mb-1">/ 40 periods</p>
                             </div>
                             <div className="w-full h-1.5 bg-purple-200 rounded-full mt-2">
                                <div 
                                    className={`h-full rounded-full ${calculateTeacherLoad(selectedTeacher) > 32 ? 'bg-red-500' : 'bg-purple-600'}`} 
                                    style={{ width: `${(calculateTeacherLoad(selectedTeacher) / 40) * 100}%` }}
                                ></div>
                             </div>
                    </div>

                    {/* Detailed Assignment Table */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <BookOpen size={18} className="text-gray-500"/>
                            Allotted Workload Breakdown
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Class Assigned</th>
                                        <th className="px-4 py-3">Subject / Activity</th>
                                        <th className="px-4 py-3 text-center">Periods</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedTeacher.workload.map((work, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-school-700">Class {work.className}</td>
                                            <td className="px-4 py-3 text-gray-800">{work.subject}</td>
                                            <td className="px-4 py-3 text-center font-mono font-medium">{work.periods}</td>
                                        </tr>
                                    ))}
                                    {selectedTeacher.workload.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                                                No classes have been allotted to this teacher yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Events & Duties Section */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Trophy size={18} className="text-gray-500"/>
                            Co-Curricular Duties
                        </h4>
                        <div className="space-y-2">
                            {teacherEvents.map(event => (
                                <div key={event.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{event.name}</p>
                                        <p className="text-xs text-gray-500">{event.date} • {event.venue}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                        event.headTeacherId === selectedTeacher.id 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                        : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {event.headTeacherId === selectedTeacher.id ? 'In-Charge' : 'Support Staff'}
                                    </span>
                                </div>
                            ))}
                            {teacherEvents.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No event duties assigned currently.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><UserPlus size={20}/> Appoint New Teacher</h3>
                <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (with title)</label>
                        <input required type="text" placeholder="e.g. Mrs. Geeta Singh" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none" 
                             value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                        <input type="text" placeholder="e.g. M.Sc Physics, B.Ed" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none" 
                             value={newTeacher.qualification} onChange={e => setNewTeacher({...newTeacher, qualification: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Main Subject</label>
                            <input required type="text" placeholder="e.g. Physics" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none" 
                                value={newTeacher.mainSubject} onChange={e => setNewTeacher({...newTeacher, mainSubject: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
                            <input type="tel" placeholder="0000000000" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none" 
                                value={newTeacher.contactNo} onChange={e => setNewTeacher({...newTeacher, contactNo: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-2">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-school-600 text-white rounded-lg font-medium hover:bg-school-700">Appoint</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
