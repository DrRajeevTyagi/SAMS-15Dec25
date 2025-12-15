
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Trophy, AlertTriangle, Sparkles, BrainCircuit, Edit2, Save, FileText, TrendingUp, Calendar, Clock, X, Check, Phone, User, Bell, Globe, Info, Flag } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { analyzeStudentFactors } from '../services/geminiService';
import { useToast } from './Toast';
import { ExamEntry, Student, SchoolEvent, EventStudentRole, EventVolunteer, DisciplinaryAction } from '../types';

const StudentProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { students, classes, updateStudentClass, classSessions, examSchedules, admissionSchema, updateStudent, events, updateEvent, currentUser, issuePenaltyCard } = useSchool();
    const toast = useToast();

    const [student, setStudent] = useState<Student | undefined>(Array.isArray(students) ? students.find(s => s && s.id === id) : undefined);
    const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'factors'>('overview');
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Class Edit Mode State
    const [isEditingClass, setIsEditingClass] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(student?.classId || '');

    // Full Profile Edit Mode State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState<Record<string, string>>({});

    // Penalty Modal State
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [penaltyType, setPenaltyType] = useState<'Yellow' | 'Pink' | 'Red'>('Yellow');
    const [penaltyReason, setPenaltyReason] = useState('');

    // Permissions Check
    const canEdit = currentUser?.role === 'Admin';
    const canRunAnalysis = currentUser?.role === 'Admin' || currentUser?.role === 'Teacher';
    // Students can always apply to events (no need for canApplyToEvent check)
    const canIssuePenalty = currentUser?.role === 'Admin' || currentUser?.role === 'Teacher';

    // Update local student object when context changes
    useEffect(() => {
        const foundStudent = Array.isArray(students) ? students.find(s => s && s.id === id) : undefined;
        setStudent(foundStudent || undefined);
        if (foundStudent) {
            setSelectedClassId(foundStudent.classId || '');
        }
    }, [students, id]);

    // Pre-fill Edit Form when modal opens
    useEffect(() => {
        if (showEditModal && student) {
            const initialData: Record<string, string> = {
                name: student.name,
                admissionNo: student.admissionNo,
                dob: student.dob || '',
                gender: student.gender || '',
                guardianName: student.guardianName,
                motherName: student.motherName || '',
                contactNo: student.contactNo,
                address: student.address || '',
                ...(student.customDetails && typeof student.customDetails === 'object' ? student.customDetails : {})
            };
            setEditFormData(initialData);
        }
    }, [showEditModal, student]);

    if (!student) return <div className="p-8">Student not found</div>;

    const maskContact = (info: string) => {
        if (!info) return '';

        // PROTOCOL RULE 9: No "Ethical" Data Hiding for Authorized Staff
        // Staff needs access to contact numbers for emergency/operational reasons.
        if (currentUser?.role === 'Admin' || currentUser?.role === 'Teacher') {
            return info;
        }

        // Email check
        if (info && info.includes('@')) {
            const parts = info.split('@');
            if (parts.length >= 2) {
                const name = parts[0] || '';
                const domain = parts[1] || '';
                if (name.length <= 3) return `${name}***@${domain}`;
                return `${name.slice(0, 2)}****${name.slice(-1)}@${domain}`;
            }
        }
        // Phone check
        if (info) {
            const clean = info.replace(/\D/g, '');
            if (clean.length >= 10) {
                return `${clean.slice(0, 2)}xxxx${clean.slice(-4)}`;
            }
        }
        return info || '';
    };

    // Find sessions where this specific student was marked absent
    const missedSessions = Array.isArray(classSessions)
        ? classSessions.filter(s => s && Array.isArray(s.absentStudentIds) && s.absentStudentIds.includes(student.id))
        : [];

    // Find Upcoming Exams
    const today = new Date().toISOString().split('T')[0];
    let upcomingExams: { scheduleName: string, entry: ExamEntry }[] = [];

    if (student.classId && Array.isArray(examSchedules)) {
        examSchedules.forEach(schedule => {
            if (schedule && Array.isArray(schedule.entries)) {
                const relevantEntries = schedule.entries.filter(e =>
                    e && e.classId === student.classId &&
                    e.date >= today
                );
                relevantEntries.forEach(entry => {
                    if (entry) {
                        upcomingExams.push({ scheduleName: schedule.title || 'Exam', entry });
                    }
                });
            }
        });
    }
    // Sort by date
    if (Array.isArray(upcomingExams)) {
        upcomingExams.sort((a, b) => {
            const dateA = a?.entry?.date ? new Date(a.entry.date).getTime() : 0;
            const dateB = b?.entry?.date ? new Date(b.entry.date).getTime() : 0;
            return dateA - dateB;
        });
    }

    // Find Eligible Events (Notices) - Events where student can apply (not yet volunteered or selected)
    const eligibleEvents = Array.isArray(events) ? events.filter(ev =>
        ev && ev.targetClassIds &&
        student.classId &&
        Array.isArray(ev.targetClassIds) &&
        ev.targetClassIds.includes(student.classId) &&
        ev.status === 'Upcoming' &&
        Array.isArray(ev.studentRoles) &&
        !ev.studentRoles.some(r => r && r.studentId === student.id) &&
        Array.isArray(ev.volunteers) &&
        !ev.volunteers.some(v => v && v.studentId === student.id)
    ) : [];

    // Events where student has applied (volunteered) but not yet selected
    const appliedEvents = Array.isArray(events) ? events.filter(ev =>
        ev && Array.isArray(ev.volunteers) &&
        ev.volunteers.some(v => v && v.studentId === student.id) &&
        Array.isArray(ev.studentRoles) &&
        !ev.studentRoles.some(r => r && r.studentId === student.id)
    ) : [];

    const handleApplyToEvent = (event: SchoolEvent) => {
        const newVolunteer: EventVolunteer = {
            studentId: student.id,
            studentName: student.name,
            appliedDate: new Date().toISOString().split('T')[0],
            house: student.house
        };
        // Add to volunteers list (not participants yet)
        const existingVolunteers = Array.isArray(event.volunteers) ? event.volunteers : [];
        const updatedEvent = { ...event, volunteers: [...existingVolunteers, newVolunteer] };
        updateEvent(updatedEvent);
        toast.success(`Application submitted for ${event.name}! Status: Applied for.`);
    };

    const handleAiAnalysis = async () => {
        setLoading(true);
        const result = await analyzeStudentFactors(student, missedSessions, student.activities || []);
        setAiAnalysis(result);
        setLoading(false);
    };

    const handleSaveClass = () => {
        updateStudentClass(student.id, selectedClassId);
        setIsEditingClass(false);
    };

    const handleEditInputChange = (fieldId: string, value: string) => {
        setEditFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    // Validation helper functions
    const validateContactNumber = (contact: string): boolean => {
        if (!contact) return true; // Optional field
        const cleaned = contact.replace(/\D/g, '');
        return cleaned.length === 10;
    };

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateDate = (date: string): boolean => {
        if (!date) return true; // Optional field
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj.getTime());
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        // 1. Validate required fields
        const missingRequiredFields: string[] = [];
        admissionSchema.forEach(field => {
            if (field.required) {
                if (field.id === 'name' && (!editFormData['name'] || editFormData['name'].trim() === '')) {
                    missingRequiredFields.push(field.label);
                } else if (field.id === 'admissionNo' && (!editFormData['admissionNo'] || editFormData['admissionNo'].trim() === '')) {
                    missingRequiredFields.push(field.label);
                } else if (!field.isSystem && (!editFormData[field.id] || editFormData[field.id].trim() === '')) {
                    missingRequiredFields.push(field.label);
                }
            }
        });

        if (missingRequiredFields.length > 0) {
            toast.warning(`Please fill in all required fields: ${missingRequiredFields.join(', ')}`);
            return;
        }

        // 2. Check for duplicate admission number (if changed)
        const newAdmissionNo = editFormData['admissionNo'] || student.admissionNo;
        if (newAdmissionNo !== student.admissionNo) {
            if (students.some(s => s.id !== student.id && s.admissionNo === newAdmissionNo)) {
                toast.error(`Admission number ${newAdmissionNo} already exists. Please use a different number.`);
                return;
            }
        }

        // 3. Validate contact number format
        if (editFormData['contactNo'] && !validateContactNumber(editFormData['contactNo'])) {
            toast.error("Contact number must be exactly 10 digits.");
            return;
        }

        // 4. Validate email format (if email field exists)
        const emailField = Array.isArray(admissionSchema) ? admissionSchema.find(f => f && (f.id === 'email' || (f.label && f.label.toLowerCase().includes('email')))) : undefined;
        if (emailField && editFormData[emailField.id] && !validateEmail(editFormData[emailField.id])) {
            toast.error("Please enter a valid email address.");
            return;
        }

        // 5. Validate date fields
        if (editFormData['dob'] && !validateDate(editFormData['dob'])) {
            toast.error("Please enter a valid date of birth.");
            return;
        }

        const updatedStudent: Student = {
            ...student,
            name: editFormData['name'] || student.name,
            admissionNo: newAdmissionNo,
            dob: editFormData['dob'],
            gender: editFormData['gender'],
            guardianName: editFormData['guardianName'],
            motherName: editFormData['motherName'],
            contactNo: editFormData['contactNo'],
            address: editFormData['address'],
            customDetails: { ...(student.customDetails && typeof student.customDetails === 'object' ? student.customDetails : {}) }
        };

        // Populate custom details
        admissionSchema.forEach(field => {
            if (!field.isSystem && editFormData[field.id]) {
                if (!updatedStudent.customDetails) updatedStudent.customDetails = {};
                updatedStudent.customDetails[field.id] = editFormData[field.id];
            }
        });

        updateStudent(updatedStudent);
        toast.success("Student profile updated successfully!");
        setShowEditModal(false);
    };

    const handleIssuePenalty = () => {
        if (!penaltyReason) return;

        let points = -1;
        if (penaltyType === 'Pink') points = -2;
        if (penaltyType === 'Red') points = -3;

        const action: DisciplinaryAction = {
            id: `disc_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: penaltyType,
            reason: penaltyReason,
            issuedBy: currentUser?.name || 'Staff',
            penaltyPoints: points
        };

        issuePenaltyCard(student.id, action);
        toast.success(`${penaltyType} card issued to ${student.name}`);
        setShowPenaltyModal(false);
        setPenaltyReason('');
        setPenaltyType('Yellow');
    };

    const renderEditField = (field: any) => {
        return (
            <div key={field.id} className={`col-span-1 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'textarea' ? (
                    <textarea
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                        rows={3}
                        value={editFormData[field.id] || ''}
                        onChange={e => handleEditInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                ) : field.type === 'select' ? (
                    <select
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 outline-none"
                        value={editFormData[field.id] || ''}
                        onChange={e => handleEditInputChange(field.id, e.target.value)}
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
                        value={editFormData[field.id] || ''}
                        onChange={e => handleEditInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <button onClick={() => navigate('/students')} className="flex items-center text-gray-500 hover:text-school-600 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Directory
                </button>
                <div className="flex gap-2">
                    {canIssuePenalty && (
                        <button
                            onClick={() => setShowPenaltyModal(true)}
                            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                        >
                            <Flag size={14} /> Issue Penalty
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 text-sm font-medium text-school-600 hover:text-school-800 bg-school-50 px-3 py-1.5 rounded-lg border border-school-100"
                        >
                            <Edit2 size={14} /> Edit Details
                        </button>
                    )}
                </div>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-school-100 flex items-center justify-center text-school-600 text-2xl font-bold">
                        {student.name && student.name.length > 0 ? student.name.charAt(0) : '?'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {isEditingClass ? (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {Array.isArray(classes) ? classes.map(c => c ? <option key={c.id} value={c.id}>{c.name}</option> : null) : null}
                                    </select>
                                    <button onClick={handleSaveClass} className="text-green-600 hover:text-green-800"><Save size={18} /></button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    Class {student.className || 'Unassigned'}
                                    {canEdit && (
                                        <button onClick={() => setIsEditingClass(true)} className="text-gray-400 hover:text-school-600" title="Change Class"><Edit2 size={12} /></button>
                                    )}
                                    • {student.stream || 'General'} • Adm: {student.admissionNo}
                                </p>
                            )}
                        </div>
                        {/* GUARDIAN & CONTACT - VISIBILITY CONTROLLED */}
                        <div className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1"><User size={14} /> {student.guardianName}</span>
                            <span className="flex items-center gap-1"><Phone size={14} /> {maskContact(student.contactNo)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="text-right px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Attendance</p>
                        <p className={`text-xl font-bold ${student.attendancePercentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
                            {student.attendancePercentage}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-school-600 text-school-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Daily Logs & Activities
                </button>
                <button
                    onClick={() => setActiveTab('academics')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'academics' ? 'border-b-2 border-school-600 text-school-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Report Cards (Exams)
                </button>
                <button
                    onClick={() => setActiveTab('factors')}
                    className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'factors' ? 'border-b-2 border-school-600 text-school-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BrainCircuit size={16} />
                    AI Observation
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Column 1: Upcoming Exams & Notices */}
                    <div className="md:col-span-1 space-y-6">

                        {/* DISCIPLINARY RECORD - IF EXISTS */}
                        {student.disciplinaryActions && student.disciplinaryActions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                                <div className="bg-red-50 p-3 border-b border-red-100 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Disciplinary Record
                                    </h3>
                                </div>
                                <div className="divide-y divide-red-50">
                                    {student.disciplinaryActions.map(action => (
                                        <div key={action.id} className="p-3 text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${action.type === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                        action.type === 'Pink' ? 'bg-pink-100 text-pink-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {action.type} Card ({action.penaltyPoints})
                                                </span>
                                                <span className="text-xs text-gray-400">{action.date}</span>
                                            </div>
                                            <p className="text-gray-800 font-medium">{action.reason}</p>
                                            <p className="text-xs text-gray-500 mt-1">Issued by: {action.issuedBy}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* UPCOMING EXAMS */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Calendar size={20} className="text-school-600" />
                                Upcoming Exams
                            </h3>
                            <div className="space-y-3">
                                {upcomingExams.length > 0 ? (
                                    upcomingExams.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-school-50 rounded-lg border border-school-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-school-200 text-school-800 text-[10px] px-2 py-0.5 rounded-bl">
                                                {item.scheduleName}
                                            </div>
                                            <div className="mt-2">
                                                <p className="font-bold text-school-900">{item.entry.subject}</p>
                                                <div className="flex justify-between items-end mt-1">
                                                    <p className="text-sm text-school-700 font-mono">{item.entry.date}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} /> {item.entry.startTime}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic text-sm text-center py-4">No exams scheduled.</p>
                                )}
                            </div>
                        </div>

                        {/* ELIGIBLE EVENTS NOTICE BOARD */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Bell size={20} className="text-yellow-600" />
                                New Opportunities
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">Events targeting Class {student.className}</p>
                            <div className="space-y-3">
                                {eligibleEvents.length > 0 ? (
                                    eligibleEvents.map(event => (
                                        <div key={event.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-900 text-sm">{event.name}</p>
                                                {event.type === 'Inter-School' && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1 rounded">External</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-gray-500">{event.date}</p>
                                                <button
                                                    onClick={() => handleApplyToEvent(event)}
                                                    className="text-xs bg-yellow-600 text-white px-2 py-1 rounded font-medium hover:bg-yellow-700"
                                                >
                                                    Apply to Participate
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic text-sm text-center py-4">No new notices.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 2 & 3: Missed Topics & Activities */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <AlertTriangle size={20} className="text-orange-500" />
                                Concepts Missed (Absent)
                            </h3>
                            <div className="space-y-3">
                                {missedSessions.length > 0 ? missedSessions.map(session => (
                                    <div key={session.id} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-gray-800">{session.subject}</span>
                                            <span className="text-xs text-orange-600 font-mono">{session.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">Topic: <span className="font-medium">{session.topic}</span></p>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 italic">No classes missed recently.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Trophy size={20} className="text-purple-500" />
                                Co-Curricular Activities
                            </h3>
                            <div className="space-y-3">
                                {Array.isArray(student.activities) && student.activities.map(activity => (
                                    <div key={activity.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100 relative overflow-hidden">
                                        <div className="flex justify-between items-start relative z-10">
                                            <span className="font-semibold text-gray-800 flex items-center gap-2">
                                                {activity.name || 'Activity'}
                                                {activity.type === 'Inter-School' && (
                                                    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                                                        <Globe size={8} /> External
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-xs text-purple-600 font-mono">{activity.date || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 relative z-10">
                                            <span className="text-xs px-2 py-0.5 bg-white rounded border border-purple-100 text-purple-700">{activity.category || 'General'}</span>
                                            <span className="text-sm text-gray-600">{activity.hoursSpent || 0} hrs spent</span>
                                        </div>
                                        {activity.achievement && (
                                            <p className="text-xs text-green-600 mt-2 font-medium relative z-10">Achievement: {activity.achievement}</p>
                                        )}
                                    </div>
                                ))}
                                {!student.activities?.length && (
                                    <p className="text-gray-500 italic">No activities recorded.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'academics' && (
                <div className="space-y-6">
                    {student.examResults && student.examResults.length > 0 ? (
                        student.examResults.map((exam, idx) => (
                            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{exam.examName}</h3>
                                        <p className="text-xs text-gray-500">Date: {exam.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                                        <p className={`text-xl font-bold ${exam.totalPercentage >= 80 ? 'text-green-600' : exam.totalPercentage >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {exam.totalPercentage}%
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {exam.subjects.map((sub, sIdx) => (
                                            <div key={sIdx} className="p-3 border border-gray-100 rounded-lg">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-semibold text-gray-700 text-sm truncate" title={sub.subject}>{sub.subject}</span>
                                                    <span className="text-xs font-bold text-gray-400">{sub.grade}</span>
                                                </div>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-lg font-bold text-gray-900">{sub.score}</span>
                                                    <span className="text-xs text-gray-400 mb-1">/ {sub.maxScore}</span>
                                                </div>
                                                <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
                                                    <div
                                                        className={`h-full rounded-full ${sub.score >= 80 ? 'bg-green-500' : sub.score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                        style={{ width: `${(sub.score / sub.maxScore) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                            <FileText className="mx-auto text-gray-300 mb-2" size={48} />
                            <p className="text-gray-500">No exam results uploaded yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'factors' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Holistic Observations (AI)</h3>

                        {/* ETHICAL DISCLAIMER */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left flex items-start gap-3">
                            <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-blue-800">
                                <strong>Important Note:</strong> This analysis is generated by AI based on logged data (attendance, activity hours, marks).
                                It is intended to provide <em>suggestions</em> for support, not a definitive psychological or academic diagnosis.
                                Please verify all observations with the student and parents personally.
                            </div>
                        </div>

                        <p className="text-gray-500 mb-6 text-sm">
                            Our AI correlates missed topics (from the Class Log), activity load, and historical exam trends to identify potential patterns in {student.name}'s performance.
                        </p>

                        {!aiAnalysis && !loading && (
                            <button
                                onClick={handleAiAnalysis}
                                disabled={!canRunAnalysis}
                                className={`px-6 py-3 rounded-lg font-medium shadow-md transition-all flex items-center gap-2 mx-auto ${canRunAnalysis
                                        ? 'bg-school-600 text-white hover:bg-school-700'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                title={canRunAnalysis ? "Run AI Analysis" : "Analysis available to Teachers and Admin"}
                            >
                                <Sparkles size={18} />
                                Run Observations
                            </button>
                        )}

                        {loading && (
                            <div className="py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-school-600 mx-auto mb-4"></div>
                                <p className="text-sm text-gray-500">Analyzing patterns in attendance and performance...</p>
                            </div>
                        )}

                        {aiAnalysis && (
                            <div className="text-left mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200 animate-fade-in">
                                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-medium">
                                    {aiAnalysis}
                                </div>
                                {canRunAnalysis && (
                                    <button
                                        onClick={() => setAiAnalysis('')}
                                        className="mt-6 text-sm text-school-600 hover:text-school-800 underline"
                                    >
                                        Run new observation
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden h-[85vh] flex flex-col">
                        <div className="bg-school-900 px-6 py-4 border-b border-school-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-white">Edit Student Profile</h3>
                                <p className="text-xs text-school-200">Updating details for {student.name}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-school-200 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form id="editForm" onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 bg-white overscroll-contain">
                            <div className="space-y-6">
                                {['Personal', 'Parent', 'Other'].map(section => {
                                    const fields = admissionSchema.filter(f => f.section === section);
                                    if (fields.length === 0) return null;

                                    return (
                                        <div key={section} className="space-y-4">
                                            <h4 className="font-bold text-gray-800 border-b pb-2 uppercase text-xs tracking-wide text-school-600">{section} Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {fields.map(field => renderEditField(field))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="editForm"
                                className="px-6 py-2 bg-school-600 text-white rounded-lg font-bold hover:bg-school-700 shadow-sm flex items-center gap-2"
                            >
                                <Check size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PENALTY MODAL */}
            {showPenaltyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle size={18} /> Issue Penalty Card
                            </h3>
                            <button onClick={() => setShowPenaltyModal(false)} className="text-red-400 hover:text-red-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Card Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setPenaltyType('Yellow')}
                                        className={`p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${penaltyType === 'Yellow' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-200'}`}
                                    >
                                        Yellow (-1)
                                        <div className="text-[10px] font-normal normal-case opacity-75 mt-1">Tardiness / Missed Task</div>
                                    </button>
                                    <button
                                        onClick={() => setPenaltyType('Pink')}
                                        className={`p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${penaltyType === 'Pink' ? 'bg-pink-100 border-pink-500 text-pink-800' : 'bg-white border-gray-200 text-gray-500 hover:border-pink-200'}`}
                                    >
                                        Pink (-2)
                                        <div className="text-[10px] font-normal normal-case opacity-75 mt-1">Light Warning</div>
                                    </button>
                                    <button
                                        onClick={() => setPenaltyType('Red')}
                                        className={`p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${penaltyType === 'Red' ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200'}`}
                                    >
                                        Red (-3)
                                        <div className="text-[10px] font-normal normal-case opacity-75 mt-1">Severe Warning</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    rows={3}
                                    placeholder="Describe the incident..."
                                    value={penaltyReason}
                                    onChange={e => setPenaltyReason(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={handleIssuePenalty}
                                    disabled={!penaltyReason}
                                    className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Issue Penalty
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
