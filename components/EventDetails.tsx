

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, UserPlus, Save, Trophy, Image as ImageIcon, CheckCircle, RefreshCw, Building2, Globe } from 'lucide-react';
import { SchoolEvent, EventStaffRole, EventStudentRole } from '../types';
import { useSchool } from '../context/SchoolContext';

const EventDetails: React.FC = () => {
    const { id } = useParams();
    const { events, updateEvent, students, teachers, currentUser, addEventNote, deleteEventNote } = useSchool(); // Added new methods
    const [event, setEvent] = useState<SchoolEvent | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'volunteers' | 'results'>('results'); // Default to results tab
    const [isSaved, setIsSaved] = useState(true);

    // NEW: Notes state
    const [noteTarget, setNoteTarget] = useState<'student' | 'staff' | 'event'>('event');
    const [noteTargetId, setNoteTargetId] = useState('');
    const [noteComment, setNoteComment] = useState('');

    useEffect(() => {
        const found = events.find(e => e.id === id);
        if (found) setEvent(found);
    }, [id, events]);

    // Form states for adding roles
    const [newStaff, setNewStaff] = useState({ name: '', role: '' });
    const [newStudent, setNewStudent] = useState({ name: '', role: 'Participant', specific: '', house: 'Red' });

    if (!event) return <div className="p-8">Event not found</div>;

    // NEW: Permission checking
    const isOrganizer = currentUser?.role === 'Admin' ||
        event.headTeacherId === currentUser?.id ||
        event.staffRoles.some(r => r.teacherId === currentUser?.id);

    const handleSaveToContext = () => {
        if (event) {
            updateEvent(event);
            setIsSaved(true);
        }
    };

    const addStaff = () => {
        if (!newStaff.name) return;
        const newRole: EventStaffRole = {
            teacherId: `t${Date.now()}`,
            teacherName: newStaff.name,
            role: newStaff.role || 'Member'
        };
        setEvent({ ...event, staffRoles: [...event.staffRoles, newRole] });
        setNewStaff({ name: '', role: '' });
        setIsSaved(false);
    };

    const addStudent = () => {
        if (!newStudent.name) return;
        const newRole: EventStudentRole = {
            studentId: `s${Date.now()}`,
            studentName: newStudent.name,
            role: newStudent.role as any,
            status: 'participant', // NEW: Direct adds are participants
            specificDuty: newStudent.specific,
            house: newStudent.house
        };
        setEvent({ ...event, studentRoles: [...event.studentRoles, newRole] });
        setNewStudent({ name: '', role: 'Participant', specific: '', house: 'Red' });
        setIsSaved(false);
    };

    // NEW: Promote volunteer to participant
    const promoteVolunteer = (studentId: string) => {
        const updatedRoles = event.studentRoles.map(role =>
            role.studentId === studentId ? { ...role, status: 'participant' as const } : role
        );
        setEvent({ ...event, studentRoles: updatedRoles });
        setIsSaved(false);
    };

    // NEW: Add note/comment
    const handleAddNote = () => {
        if (!noteComment || !currentUser) return;

        let targetName = 'Event Note';
        if (noteTarget === 'student') {
            const student = event.studentRoles.find(r => r.studentId === noteTargetId);
            targetName = student?.studentName || 'Unknown Student';
        } else if (noteTarget === 'staff') {
            const staff = event.staffRoles.find(r => r.teacherId === noteTargetId);
            if (!staff && event.headTeacherId === noteTargetId) {
                targetName = event.headTeacherName;
            } else {
                targetName = staff?.teacherName || 'Unknown Staff';
            }
        }

        const newNote = {
            id: `note_${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            targetId: noteTargetId || event.id,
            targetName,
            targetType: noteTarget,
            comment: noteComment,
            date: new Date().toISOString().split('T')[0]
        };

        if (event.id) {
            addEventNote(event.id, newNote);
        }
        setNoteComment('');
        setNoteTargetId('');
    };

    const updateResult = (studentId: string, result: string) => {
        const updatedRoles = event.studentRoles.map(role =>
            role.studentId === studentId ? { ...role, achievement: result } : role
        );
        setEvent({ ...event, studentRoles: updatedRoles });
        setIsSaved(false);
    };

    const isInterSchool = event.type === 'Inter-School';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <Link to="/events" className="flex items-center text-gray-500 hover:text-school-600 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Events
                </Link>
                <button
                    onClick={handleSaveToContext}
                    disabled={isSaved}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${isSaved
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-school-600 text-white hover:bg-school-700 shadow-md'
                        }`}
                >
                    {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                    {isSaved ? 'All Changes Saved' : 'Save & Sync Profiles'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {isInterSchool ? (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-purple-200">
                                    <Globe size={10} /> Inter-School
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-gray-200">
                                    <Building2 size={10} /> Intra-School
                                </span>
                            )}
                            <span className="bg-school-50 text-school-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-school-100">
                                {event.category}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                        <p className="text-gray-600 mt-1 max-w-2xl">{event.description}</p>
                        <div className="flex gap-6 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2"><Calendar size={16} className="text-school-500" /> {event.date}</div>
                            <div className="flex items-center gap-2">
                                {isInterSchool ? <Building2 size={16} className="text-purple-500" /> : <MapPin size={16} className="text-school-500" />}
                                {isInterSchool ? `Hosted by ${event.venue}` : event.venue}
                            </div>
                            <div className="flex items-center gap-2"><Users size={16} className="text-school-500" /> I/C: {event.headTeacherName}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${event.status === 'Completed' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                            {event.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    {isOrganizer && (
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            1. Staff Team
                        </button>
                    )}
                    {isOrganizer && (
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            2. Student Participation
                        </button>
                    )}
                    {isOrganizer && (
                        <button
                            onClick={() => setActiveTab('volunteers')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'volunteers' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            3. Volunteers
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'results' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {isOrganizer ? '4. Results & Notes' : 'Event Details'}
                    </button>
                </div>

                <div className="p-6">
                    {/* STAFF TAB */}
                    {activeTab === 'staff' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    <UserPlus size={16} /> Add Teacher to Team
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Search Teacher Name..."
                                        className="flex-1 bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Role (e.g. Scoring)"
                                        className="flex-1 bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    />
                                    <button
                                        onClick={addStaff}
                                        className="bg-school-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-school-700"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 mb-3">Assigned Staff</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex justify-between items-center p-3 border border-school-200 rounded-lg bg-school-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-school-200 flex items-center justify-center text-xs font-bold text-school-800">
                                                {event.headTeacherName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{event.headTeacherName}</p>
                                                <p className="text-xs text-gray-500">Teacher In-Charge</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-white border border-school-200 rounded text-xs text-school-700 font-medium">
                                            HEAD
                                        </span>
                                    </div>
                                    {event.staffRoles.map((role, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {role.teacherName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{role.teacherName}</p>
                                                    <p className="text-xs text-gray-500">Staff</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">
                                                {role.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STUDENTS TAB */}
                    {activeTab === 'students' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <Users size={16} /> Add Student Participant/Volunteer
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Student Name..."
                                        className="md:col-span-2 bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    />
                                    <select
                                        className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newStudent.house}
                                        onChange={(e) => setNewStudent({ ...newStudent, house: e.target.value })}
                                    >
                                        <option value="Red">Red House</option>
                                        <option value="Blue">Blue House</option>
                                        <option value="Green">Green House</option>
                                        <option value="Yellow">Yellow House</option>
                                    </select>
                                    <select
                                        className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newStudent.role}
                                        onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                                    >
                                        <option value="Participant">Participant</option>
                                        <option value="Organizer/Volunteer">Volunteer</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Duty (e.g. Speaker 1)"
                                        className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newStudent.specific}
                                        onChange={(e) => setNewStudent({ ...newStudent, specific: e.target.value })}
                                    />
                                    <button
                                        onClick={addStudent}
                                        className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">House</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Duty/Team</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {event.studentRoles.filter(r => r.status === 'participant').map((role, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-medium text-gray-800">{role.studentName}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${role.house === 'Red' ? 'bg-red-500' : role.house === 'Blue' ? 'bg-blue-500' : role.house === 'Green' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`}></span>
                                                {role.house}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${role.role === 'Participant' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                                    {role.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{role.specificDuty || '-'}</td>
                                        </tr>
                                    ))}
                                    {event.studentRoles.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-4 text-gray-400 italic">No students added yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* VOLUNTEERS TAB */}
                    {activeTab === 'volunteers' && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <h3 className="text-sm font-bold text-yellow-800 mb-2">Volunteer Applications</h3>
                                <p className="text-xs text-yellow-700">Students who have applied to participate. Select volunteers to confirm their participation.</p>
                            </div>

                            {event.studentRoles.filter(r => r.status === 'volunteered').length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Users size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No volunteer applications yet</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">House</th>
                                            <th className="px-4 py-3">Applied Date</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {event.studentRoles.filter(r => r.status === 'volunteered').map((role) => (
                                            <tr key={role.studentId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{role.studentName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${role.house === 'Red' ? 'bg-red-100 text-red-700' :
                                                        role.house === 'Blue' ? 'bg-blue-100 text-blue-700' :
                                                            role.house === 'Green' ? 'bg-green-100 text-green-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {role.house}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{role.appliedDate || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    {isOrganizer && (
                                                        <button
                                                            onClick={() => promoteVolunteer(role.studentId)}
                                                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                                                        >
                                                            Select as Participant
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* RESULTS TAB */}
                    {activeTab === 'results' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
                                <RefreshCw className="text-yellow-600 mt-1" size={20} />
                                <div>
                                    <h3 className="text-sm font-bold text-yellow-800">Auto-Sync Enabled</h3>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Saving the results below will <strong>automatically update</strong> the Student's 360° Profile Activity Log.
                                        This ensures the AI Factor Analysis is always up to date.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {event.studentRoles.filter(r => r.role === 'Participant').map((role, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900">{role.studentName} <span className="text-gray-400 text-xs">({role.house})</span></p>
                                            <p className="text-xs text-gray-500">{role.specificDuty}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                                value={role.achievement || ''}
                                                onChange={(e) => updateResult(role.studentId, e.target.value)}
                                            >
                                                <option value="">-- No Position --</option>
                                                <option value="Winner (1st)">Winner (1st)</option>
                                                <option value="Runner Up (2nd)">Runner Up (2nd)</option>
                                                <option value="Third Place">Third Place</option>
                                                <option value="Consolation">Consolation</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* NOTES & APPRECIATION SECTION */}
                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Notes & Appreciation</h3>

                                {/* Add Note Form */}
                                {isOrganizer && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                                        <h4 className="text-sm font-bold text-blue-800 mb-3">Add Note/Comment</h4>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <select
                                                    className="bg-white border border-gray-300 rounded px-3 py-2 text-sm"
                                                    value={noteTarget}
                                                    onChange={(e) => setNoteTarget(e.target.value as 'student' | 'staff' | 'event')}
                                                >
                                                    <option value="event">General Event Note</option>
                                                    <option value="student">For a Student</option>
                                                    <option value="staff">For a Staff Member</option>
                                                </select>

                                                {noteTarget !== 'event' && (
                                                    <select
                                                        className="bg-white border border-gray-300 rounded px-3 py-2 text-sm flex-1"
                                                        value={noteTargetId}
                                                        onChange={(e) => setNoteTargetId(e.target.value)}
                                                    >
                                                        <option value="">Select {noteTarget}...</option>
                                                        {noteTarget === 'student' && event.studentRoles.map(r => (
                                                            <option key={r.studentId} value={r.studentId}>{r.studentName}</option>
                                                        ))}
                                                        {noteTarget === 'staff' && event.staffRoles.map(r => (
                                                            <option key={r.teacherId} value={r.teacherId}>{r.teacherName}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <textarea
                                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
                                                rows={3}
                                                placeholder="Write your note or appreciation..."
                                                value={noteComment}
                                                onChange={(e) => setNoteComment(e.target.value)}
                                            />

                                            <button
                                                onClick={handleAddNote}
                                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                                            >
                                                Add Note
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Display Notes */}
                                <div className="space-y-2">
                                    {event.notes && event.notes.length > 0 ? (
                                        event.notes.map(note => (
                                            <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-medium text-gray-900">{note.authorName}</span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            {note.targetType !== 'event' && `→ ${note.targetName}`}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{note.date}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{note.comment}</p>
                                                {(currentUser?.role === 'Admin' || currentUser?.id === note.authorId) && (
                                                    <button
                                                        onClick={() => deleteEventNote(event.id, note.id)}
                                                        className="text-xs text-red-600 hover:text-red-800 mt-2"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No notes yet</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <ImageIcon size={18} /> Event Gallery
                                </h3>
                                <div className="h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <ImageIcon size={24} className="mb-2" />
                                    <span className="text-sm font-medium">Drag and drop photos here</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetails;