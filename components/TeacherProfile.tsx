import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, Clock, Crown, Mail, Phone, Shield, Trophy, User } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const TeacherProfile: React.FC = () => {
    const { currentUser, teachers, events } = useSchool();
    const [activeTab, setActiveTab] = useState<'workload' | 'duties'>('workload');

    if (currentUser?.role !== 'Teacher') return <div className="p-8">Access Denied</div>;

    const teacher = teachers.find(t => t.id === currentUser.id);
    if (!teacher) return <div className="p-8">Teacher profile not found.</div>;

    // Calculations
    const totalPeriods = teacher.workload.reduce((sum, w) => sum + w.periods, 0);

    // Get Events
    const myEvents = events.filter(e =>
        e.headTeacherId === teacher.id ||
        e.staffRoles.some(r => r.teacherId === teacher.id)
    );

    const getHouseColor = (house?: string) => {
        switch (house) {
            case 'Red': return 'bg-red-500 text-white';
            case 'Blue': return 'bg-blue-500 text-white';
            case 'Green': return 'bg-green-500 text-white';
            case 'Yellow': return 'bg-yellow-500 text-white';
            default: return 'bg-gray-200 text-gray-500';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                <p className="text-gray-500">Manage your teaching portfolio and duties.</p>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-school-50 border-2 border-school-100 flex items-center justify-center text-3xl font-bold text-school-700">
                        {teacher.name.charAt(4)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
                        <p className="text-gray-500 font-medium">{teacher.qualification}</p>
                        <p className="text-xs font-mono text-gray-400 mt-1 bg-gray-50 inline-block px-1 rounded">ID: {teacher.teacherCode}</p>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <Briefcase size={14} className="text-school-500" />
                                <span>Subject: <strong>{teacher.mainSubject}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-school-500" />
                                <span>{teacher.contactNo}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-school-500" />
                                <span>Joined: {teacher.joiningDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    {/* House Badge */}
                    {teacher.house ? (
                        <div className={`px - 4 py - 2 rounded - lg font - bold uppercase tracking - wide flex items - center gap - 2 shadow - sm ${getHouseColor(teacher.house)} `}>
                            <Shield size={16} fill="currentColor" />
                            {teacher.house} House
                            {teacher.isHouseMaster && (
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ml-1">
                                    <Crown size={10} fill="currentColor" /> MASTER
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-2">
                            <Shield size={16} /> No House Assigned
                        </div>
                    )}

                    {/* Workload Badge */}
                    <div className={`px - 3 py - 1 rounded text - xs font - bold border ${totalPeriods > 32 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} `}>
                        Load: {totalPeriods} / 40 Periods
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('workload')}
                        className={`flex - 1 py - 4 text - sm font - bold flex items - center justify - center gap - 2 transition - colors ${activeTab === 'workload' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'
                            } `}
                    >
                        <Briefcase size={16} /> Academic Workload
                    </button>
                    <button
                        onClick={() => setActiveTab('duties')}
                        className={`flex - 1 py - 4 text - sm font - bold flex items - center justify - center gap - 2 transition - colors ${activeTab === 'duties' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'
                            } `}
                    >
                        <Trophy size={16} /> Co-Curricular Duties
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'workload' && (
                        <div>
                            {teacher.workload.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Class</th>
                                                <th className="px-6 py-3">Subject Allotted</th>
                                                <th className="px-6 py-3 text-center">Periods / Week</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {teacher.workload.map((work, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-bold text-gray-800 text-lg">Class {work.className}</td>
                                                    <td className="px-6 py-4 text-gray-700">{work.subject}</td>
                                                    <td className="px-6 py-4 text-center font-mono font-medium bg-gray-50/50">{work.periods}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50 border-t border-gray-200">
                                                <td className="px-6 py-3 font-bold text-gray-800" colSpan={2}>TOTAL WEEKLY LOAD</td>
                                                <td className="px-6 py-3 font-bold text-center text-school-700 text-lg">{totalPeriods}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                    <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No academic classes assigned yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'duties' && (
                        <div className="space-y-4">
                            {myEvents.length > 0 ? myEvents.map(event => (
                                <div key={event.id} className="p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30 hover:bg-white hover:shadow-sm transition-all">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text - [10px] font - bold uppercase tracking - wide px - 2 py - 0.5 rounded ${event.headTeacherId === teacher.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                                                } `}>
                                                {event.headTeacherId === teacher.id ? 'Teacher In-Charge' : 'Staff Member'}
                                            </span>
                                            <span className={`text - [10px] font - bold uppercase tracking - wide px - 2 py - 0.5 rounded ${event.status === 'Completed' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
                                                } `}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900">{event.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Calendar size={14} /> {event.date}
                                            <span className="text-gray-300">|</span>
                                            {event.venue}
                                        </p>
                                        <div className="mt-2">
                                            <Link
                                                to={`/events/${event.id}`}
                                                className="text-school-600 hover:text-school-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                Manage Event →
                                            </Link>
                                        </div>
                                    </div>

                                    {/* If staff role, show specific duty */}
                                    {event.headTeacherId !== teacher.id && (
                                        <div className="bg-white border border-gray-200 px-3 py-2 rounded text-sm text-gray-600">
                                            Role: <strong>{event.staffRoles.find(r => r.teacherId === teacher.id)?.role}</strong>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                    <Trophy size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No co-curricular duties assigned yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherProfile;
