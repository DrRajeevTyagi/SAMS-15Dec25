
import React, { useState, useMemo } from 'react';
import { Plus, Calendar, MapPin, ChevronRight, User, Palette, Microscope, Trophy, Music, BookOpen, Users as UsersIcon, Award, TrendingUp, CheckSquare, Square, AlertTriangle, Flame, Globe, Building2, Check, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SchoolEvent } from '../types';
import { useSchool } from '../context/SchoolContext';

// Define the "Intelligent" Categories and Sub-types
const EVENT_CATEGORIES: Record<SchoolEvent['category'], { icon: any, color: string, types: string[] }> = {
    'Literary': {
        icon: BookOpen,
        color: 'text-blue-600 bg-blue-50',
        types: ['Debate Competition', 'Creative Writing', 'Poetry Recitation', 'Extempore', 'Model United Nations (MUN)', 'School Magazine Launch']
    },
    'Visual Arts': {
        icon: Palette,
        color: 'text-pink-600 bg-pink-50',
        types: ['Painting Competition', 'Poster Making', 'Clay Modelling', 'Digital Art Fest', 'Rangoli Making', 'Art Exhibition']
    },
    'Performing Arts': {
        icon: Music,
        color: 'text-purple-600 bg-purple-50',
        types: ['Annual Day Dance', 'Western Music Fest', 'Classical Singing', 'Theatre / Street Play', 'Instrumental Recital']
    },
    'Scientific': {
        icon: Microscope,
        color: 'text-teal-600 bg-teal-50',
        types: ['Robotics Championship', 'Aero-modelling Workshop', 'Science Exhibition', 'App Development Hackathon', '3D Printing Fair', 'Math Olympiad']
    },
    'Sports': {
        icon: Trophy,
        color: 'text-orange-600 bg-orange-50',
        types: ['Annual Sports Day', 'Inter-House Football', 'Cricket Tournament', 'Athletics Meet', 'Basketball Zonal', 'Yoga Camp']
    },
    'Leadership/Community': {
        icon: UsersIcon,
        color: 'text-green-600 bg-green-50',
        types: ['Student Council Election', 'Cleanliness Drive', 'Charity Fair', 'Plantation Drive', 'Health Checkup Camp']
    },
    'Academic': {
        icon: Award,
        color: 'text-indigo-600 bg-indigo-50',
        types: ['Quiz Competition', 'Math Olympiad', 'Spell Bee', 'General Knowledge Contest', 'Academic Excellence Awards']
    },
    'Technology': {
        icon: Sparkles,
        color: 'text-cyan-600 bg-cyan-50',
        types: ['Coding Hackathon', 'Robotics Workshop', 'App Development', 'AI/ML Workshop', 'Tech Fest']
    },
    'Social Service': {
        icon: UsersIcon,
        color: 'text-emerald-600 bg-emerald-50',
        types: ['Community Service', 'Cleanliness Drive', 'Awareness Campaign', 'Charity Work', 'Social Outreach']
    }
};

const Events: React.FC = () => {
    const { events, addEvent, teachers, classes, students, currentUser } = useSchool();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form State
    const [eventType, setEventType] = useState<'Intra-School' | 'Inter-School'>('Intra-School');
    const [category, setCategory] = useState<keyof typeof EVENT_CATEGORIES>('Literary');
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [venue, setVenue] = useState('');
    const [headTeacherId, setHeadTeacherId] = useState('');
    const [description, setDescription] = useState('');
    const [targetClassIds, setTargetClassIds] = useState<string[]>([]);

    const isStudent = currentUser?.role === 'Student';
    const isAdmin = currentUser?.role === 'Admin';
    const studentProfile = isStudent ? students.find(s => s.id === currentUser.id) : null;

    // --- HOUSE POINT LOGIC ---
    const houseStats = useMemo(() => {
        // Initial State
        const stats: Record<string, { sports: number, cultural: number, discipline: number, total: number }> = {
            'Red': { sports: 0, cultural: 0, discipline: 0, total: 0 },
            'Blue': { sports: 0, cultural: 0, discipline: 0, total: 0 },
            'Green': { sports: 0, cultural: 0, discipline: 0, total: 0 },
            'Yellow': { sports: 0, cultural: 0, discipline: 0, total: 0 },
        };

        // 1. Calculate Event Points (Sports & Cultural)
        events.forEach(event => {
            // Skip Inter-School events for House Points if strictly internal? 
            // Usually Inter-School winners get huge points for their house too. Let's include them.
            event.studentRoles.forEach(role => {
                // Find house either from role (snapshot) or student (live)
                let house = role.house;
                if (!house) {
                    const s = students.find(stu => stu.id === role.studentId);
                    if (s) house = s.house;
                }

                if (!house || !stats[house]) return;

                let points = 0;
                const ach = role.achievement || '';
                const multiplier = event.type === 'Inter-School' ? 2 : 1; // Double points for Inter-School wins? (Optional rule, keeping 1 for now)

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

        // 2. Calculate Discipline Points (Negative Scoring from Cards)
        students.forEach(s => {
            if (!s.house || !stats[s.house]) return;

            const penalties = s.disciplinaryActions?.reduce((acc, action) => acc + action.penaltyPoints, 0) || 0;
            stats[s.house].discipline += penalties; // penalties are negative
        });

        // 3. Compute Totals
        Object.keys(stats).forEach(h => {
            stats[h].total = stats[h].sports + stats[h].cultural + stats[h].discipline;
        });

        // Convert to sorted array
        return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
    }, [events, students]);

    // Group Classes by Grade for Selection Matrix
    const classesByGrade = useMemo(() => {
        const groups: Record<string, { id: string, section: string }[]> = {};
        classes.forEach(c => {
            if (!groups[c.grade]) groups[c.grade] = [];
            groups[c.grade].push({ id: c.id, section: c.section });
        });
        // Sort grades roughly
        return Object.entries(groups).sort((a, b) => {
            const numA = parseInt(a[0]);
            const numB = parseInt(b[0]);
            if (isNaN(numA)) return 1; // Juniors at bottom
            if (isNaN(numB)) return -1;
            return numB - numA; // 12 first
        });
    }, [classes]);

    // Target Selection Helpers
    const toggleClass = (id: string) => {
        setTargetClassIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleGrade = (gradeClasses: { id: string }[]) => {
        const ids = gradeClasses.map(c => c.id);
        const allSelected = ids.every(id => targetClassIds.includes(id));

        if (allSelected) {
            // Deselect all
            setTargetClassIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            // Select all (union)
            setTargetClassIds(prev => [...new Set([...prev, ...ids])]);
        }
    };

    // Handle Category Change - Smart Auto-fill
    const handleCategoryChange = (cat: string) => {
        setCategory(cat as any);
        // Reset name if switching category to encourage picking a new type
        setName('');
    };

    const handleCreate = () => {
        if (!name || !date || !headTeacherId) return;

        const selectedTeacher = teachers.find(t => t.id === headTeacherId);

        const event: SchoolEvent = {
            id: `e${Date.now()}`,
            name: name,
            category: category,
            type: eventType,
            date: date,
            venue: venue || (eventType === 'Inter-School' ? 'External School' : 'School Campus'),
            description: description || `${name} (${eventType}) organized under the ${category} department.`,
            status: 'Upcoming',
            headTeacherId: headTeacherId,
            headTeacherName: selectedTeacher ? selectedTeacher.name : 'Unknown',
            targetClassIds: targetClassIds,
            staffRoles: [],
            studentRoles: [],
            notes: [], // NEW: Initialize empty notes array
            hoursSpent: 4 // NEW: Default hours for activity sync
        };
        addEvent(event);
        setShowCreateModal(false);

        // Reset Form
        setName('');
        setDate('');
        setVenue('');
        setHeadTeacherId('');
        setDescription('');
        setTargetClassIds([]);
        setEventType('Intra-School');
    };

    // HELPER: Reusable Card Renderer
    const renderEventCard = (event: SchoolEvent) => {
        const CatIcon = EVENT_CATEGORIES[event.category]?.icon || Trophy;
        const catColor = EVENT_CATEGORIES[event.category]?.color || 'bg-gray-100 text-gray-600';
        const isInterSchool = event.type === 'Inter-School';
        const isCompleted = event.status === 'Completed';

        return (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col group h-full">
                <div className={`h-2 w-full ${isCompleted ? 'bg-gray-400' : isInterSchool ? 'bg-purple-600' : 'bg-school-500'}`}></div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${event.status === 'Upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {event.status}
                        </span>
                        <div className="flex gap-1">
                            {isInterSchool && (
                                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600" title="Inter-School Event">
                                    <Globe size={16} />
                                </div>
                            )}
                            <div className={`p-1.5 rounded-lg ${catColor}`}>
                                <CatIcon size={16} />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-school-700 transition-colors">
                        {isInterSchool && <span className="text-purple-600 mr-2 text-sm font-extrabold uppercase">[External]</span>}
                        {event.name}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-4">{event.category}</p>

                    <div className="space-y-2 text-sm text-gray-600 mt-auto">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-school-400" />
                            {event.date}
                        </div>
                        <div className="flex items-center gap-2">
                            {isInterSchool ? <Building2 size={16} className="text-purple-500" /> : <MapPin size={16} className="text-school-400" />}
                            <span className={isInterSchool ? 'font-medium text-purple-700' : ''}>
                                {isInterSchool ? `Host: ${event.venue}` : event.venue}
                            </span>
                        </div>
                        {!isStudent && (
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-school-400" />
                                I/C: {event.headTeacherName}
                            </div>
                        )}
                    </div>
                </div>

                <Link
                    to={`/events/${event.id}`}
                    className="p-4 bg-gray-50 border-t border-gray-100 text-school-600 text-sm font-semibold flex items-center justify-between hover:bg-school-50 transition-colors"
                >
                    {isAdmin ? 'Manage Event' : 'View Details'} <ChevronRight size={16} />
                </Link>
            </div>
        );
    };

    // --- FILTERED LISTS FOR STUDENT VIEW ---
    // Show ALL events targeting student's class (both upcoming and completed)
    const studentUpcomingEvents = isStudent && studentProfile
        ? events.filter(e => e.status !== 'Completed' && e.targetClassIds.includes(studentProfile.classId || ''))
        : [];

    const studentPastEvents = isStudent && studentProfile
        ? events.filter(e => e.status === 'Completed' && e.targetClassIds.includes(studentProfile.classId || ''))
        : [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Co-Curricular Events</h2>
                    <p className="text-gray-500">
                        {isStudent ? 'Explore opportunities and track your participation.' : 'Manage internal activities and inter-school invitations.'}
                    </p>
                </div>

                {/* Declare Button - ONLY ADMIN */}
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-school-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-700 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} /> Declare New Event
                    </button>
                )}
            </div>

            {/* HOUSE CHAMPIONSHIP SCOREBOARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-school-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Flame className="text-orange-500 fill-orange-500" /> House Championship Standings
                    </h3>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded">Session 2025-26</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Rank</th>
                                <th className="px-6 py-3">House</th>
                                <th className="px-6 py-3 text-right">Sports Pts</th>
                                <th className="px-6 py-3 text-right">Cultural Pts</th>
                                <th className="px-6 py-3 text-right">Discipline</th>
                                <th className="px-6 py-3 text-right">Grand Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {houseStats.map(([house, scores], idx) => {
                                let rankColor = 'bg-gray-100 text-gray-600';
                                if (idx === 0) rankColor = 'bg-yellow-100 text-yellow-700';
                                if (idx === 1) rankColor = 'bg-gray-200 text-gray-700';
                                if (idx === 2) rankColor = 'bg-orange-100 text-orange-700';

                                return (
                                    <tr key={house} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${house === 'Red' ? 'bg-red-500' :
                                                house === 'Blue' ? 'bg-blue-500' :
                                                    house === 'Green' ? 'bg-green-500' : 'bg-yellow-500'
                                                }`}></div>
                                            {house} House
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                                            {scores.sports}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                                            {scores.cultural}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            <span className={scores.discipline < 0 ? 'text-red-500' : 'text-gray-600'}>
                                                {scores.discipline}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-lg text-school-900">
                                            {scores.total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 p-3 text-xs text-gray-500 border-t border-gray-200 flex gap-4 justify-end">
                    <span className="flex items-center gap-1 text-gray-400"><AlertTriangle size={12} /> Penalties applied via Manual Cards</span>
                    <span>1st Place: 10 pts</span>
                    <span>2nd Place: 7 pts</span>
                    <span>3rd Place: 5 pts</span>
                </div>
            </div>

            {/* --- GRID VIEW LOGIC --- */}

            {/* 1. STUDENT VIEW */}
            {isStudent ? (
                <div className="space-y-8">
                    {/* Upcoming Section */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-500" /> Upcoming Opportunities
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentUpcomingEvents.length > 0 ? (
                                studentUpcomingEvents.map(renderEventCard)
                            ) : (
                                <div className="col-span-3 text-center py-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
                                    <p>No upcoming events targeted for your class at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-50 px-2 text-gray-500 text-sm font-medium flex items-center gap-2">
                                <History size={16} /> Participation History
                            </span>
                        </div>
                    </div>

                    {/* History Section */}
                    <div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentPastEvents.length > 0 ? (
                                studentPastEvents.map(renderEventCard)
                            ) : (
                                <div className="col-span-3 text-center py-8 bg-gray-100 rounded-xl border border-transparent text-gray-400">
                                    <p>You haven't participated in any events yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* 2. ADMIN / TEACHER VIEW (ALL EVENTS) */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {events.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-gray-400 italic">No events declared yet.</div>
                    ) : (
                        events.map(renderEventCard)
                    )}
                </div>
            )}

            {/* INTELLIGENT DECLARATION MODAL (Restricted to Admin) */}
            {showCreateModal && isAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-school-900 px-6 py-4 border-b border-school-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">Declare New School Event</h3>
                                <p className="text-xs text-school-200">Select category and assign leadership</p>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* 0. EVENT TYPE TOGGLE */}
                            <div className="flex gap-4 bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setEventType('Intra-School')}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'Intra-School' ? 'bg-white shadow text-school-900' : 'text-gray-500 hover:bg-gray-200'}`}
                                >
                                    <Building2 size={16} /> Intra-School (Internal)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEventType('Inter-School')}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'Inter-School' ? 'bg-white shadow text-purple-900' : 'text-gray-500 hover:bg-gray-200'}`}
                                >
                                    <Globe size={16} /> Inter-School (External)
                                </button>
                            </div>

                            {/* 1. CATEGORY SELECTION */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">1. Select Event Category</label>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                    {Object.entries(EVENT_CATEGORIES).map(([cat, config]) => {
                                        const Icon = config.icon;
                                        const isSelected = category === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => handleCategoryChange(cat)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isSelected
                                                    ? `border-school-500 bg-school-50 ring-1 ring-school-500 text-school-800`
                                                    : 'border-gray-200 hover:border-school-300 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <Icon size={20} className={`mb-1 ${isSelected ? 'text-school-600' : 'text-gray-400'}`} />
                                                <span className="text-[10px] font-semibold text-center leading-tight">{cat}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. EVENT DETAILS */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name / Type</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                                            placeholder="Type or select from suggestions..."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    {/* Suggestions Chips */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {EVENT_CATEGORIES[category].types.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setName(type)}
                                                className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-200 transition-colors"
                                            >
                                                + {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {eventType === 'Inter-School' ? 'Host School / Organiser' : 'Venue'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                                        placeholder={eventType === 'Inter-School' ? "e.g. DPS RK Puram" : "e.g. Auditorium"}
                                        value={venue}
                                        onChange={(e) => setVenue(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 3. TARGET AUDIENCE (MATRIX) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">2. Target Classes (Eligibility)</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-4 py-2 w-24">Grade</th>
                                                <th className="px-4 py-2 w-32">Action</th>
                                                <th className="px-4 py-2">Sections</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {classesByGrade.map(([grade, clsList]) => {
                                                const allSelected = clsList.every(c => targetClassIds.includes(c.id));
                                                return (
                                                    <tr key={grade} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 font-bold text-gray-700">Class {grade}</td>
                                                        <td className="px-4 py-2">
                                                            <button
                                                                onClick={() => toggleGrade(clsList)}
                                                                className="text-xs font-medium text-school-600 hover:underline flex items-center gap-1"
                                                            >
                                                                {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} Select All
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex gap-3">
                                                                {clsList.map(c => (
                                                                    <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none">
                                                                        <div className="relative flex items-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded bg-white checked:bg-school-600 checked:border-school-600 focus:ring-2 focus:ring-school-500 focus:ring-offset-1 transition-colors cursor-pointer"
                                                                                checked={targetClassIds.includes(c.id)}
                                                                                onChange={() => toggleClass(c.id)}
                                                                            />
                                                                            <Check size={14} className="absolute left-0.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                                                        </div>
                                                                        <span className="text-sm text-gray-700 font-medium">{c.section}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 4. STAFFING */}
                            <div className="bg-school-50 p-4 rounded-lg border border-school-100">
                                <label className="block text-sm font-bold text-school-900 mb-2 flex items-center gap-2">
                                    <User size={16} /> Teacher In-Charge (I/C)
                                </label>
                                <select
                                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                                    value={headTeacherId}
                                    onChange={(e) => setHeadTeacherId(e.target.value)}
                                >
                                    <option value="">-- Select Staff Member --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.mainSubject})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-school-600 mt-1">
                                    This teacher will lead the event and can assign further duties.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-5 py-2 bg-school-600 text-white rounded-lg font-bold hover:bg-school-700 shadow-sm"
                            >
                                Declare Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
