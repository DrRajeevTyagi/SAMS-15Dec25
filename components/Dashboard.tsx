
import React, { useState, useMemo, useEffect } from 'react';
import { Users, CreditCard, CalendarCheck, TrendingUp, BookOpen, BrainCircuit, LayoutGrid, Award, FileText, ChevronLeft, ChevronRight, MapPin, User, RotateCcw, Clock, Briefcase, Smile, Meh, Frown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useSchool } from '../context/SchoolContext';
import { Link } from 'react-router-dom';

const feesData = [
    { month: 'Apr', collection: 40 },
    { month: 'May', collection: 60 },
    { month: 'Jun', collection: 55 },
    { month: 'Jul', collection: 80 },
    { month: 'Aug', collection: 95 },
];

const StatCard: React.FC<{ title: string; value: string; icon: any; trend?: string; color: string }> = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
                {trend && <p className="text-xs text-green-600 mt-2 font-medium flex items-center"><TrendingUp size={12} className="mr-1" /> {trend}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

const FeatureCard: React.FC<{ title: string; desc: string; icon: any }> = ({ title, desc, icon: Icon }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-school-50 border border-school-100">
        <div className="bg-white p-2 rounded-md shadow-sm text-school-600 shrink-0">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

// --- WELLNESS WIDGET (RESTORED) ---
const WellnessWidget: React.FC = () => {
    const [mood, setMood] = useState<'Happy' | 'Neutral' | 'Sad' | null>(null);

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between h-full">
            <div>
                <h3 className="font-bold text-lg mb-1">Daily Check-in</h3>
                <p className="text-indigo-100 text-xs">How are you feeling today?</p>
            </div>

            {!mood ? (
                <div className="flex justify-between gap-2 mt-4">
                    <button onClick={() => setMood('Happy')} className="flex-1 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex justify-center">
                        <Smile size={24} />
                    </button>
                    <button onClick={() => setMood('Neutral')} className="flex-1 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex justify-center">
                        <Meh size={24} />
                    </button>
                    <button onClick={() => setMood('Sad')} className="flex-1 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex justify-center">
                        <Frown size={24} />
                    </button>
                </div>
            ) : (
                <div className="mt-4 bg-white/20 rounded-lg p-3 text-center animate-fade-in">
                    <p className="text-sm font-bold">Thanks for sharing!</p>
                    <p className="text-xs text-indigo-100 mt-1">
                        {mood === 'Happy' ? "Keep shining! 🌟" : mood === 'Neutral' ? "Stay balanced. ⚖️" : "It's okay to have off days. 💙"}
                    </p>
                    <button onClick={() => setMood(null)} className="text-[10px] underline mt-2 text-indigo-200 hover:text-white">Reset</button>
                </div>
            )}
        </div>
    );
};

// --- CALENDAR COMPONENT ---
const SchoolCalendar: React.FC = () => {
    const { events, examSchedules, currentUser, students } = useSchool();
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun, 1 = Mon...

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Determine Student's Class ID for Filtering Exams
    const studentClassId = useMemo(() => {
        if (currentUser?.role === 'Student') {
            return students.find(s => s.id === currentUser.id)?.classId;
        }
        return null;
    }, [currentUser, students]);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CalendarCheck size={20} className="text-school-600" /> School Calendar
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 mr-1"
                        title="Go to Today"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft size={16} /></button>
                        <span className="text-sm font-bold w-32 text-center">{monthName} {year}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden flex-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                ))}

                {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[80px]"></div>)}

                {days.map(d => {
                    const dateStr = `${year}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                    const daysEvents = events.filter(e => e.date === dateStr);

                    // Filter Exams
                    let daysExams: any[] = [];
                    examSchedules.forEach(sch => {
                        const examsOnDate = sch.entries.filter(e => e.date === dateStr);
                        daysExams.push(...examsOnDate);
                    });

                    // Role Filter for Exams
                    if (currentUser?.role === 'Student' && studentClassId) {
                        daysExams = daysExams.filter(e => e.classId === studentClassId);
                    }

                    const hasItems = daysEvents.length > 0 || daysExams.length > 0;

                    return (
                        <div key={d} className="bg-white p-1 min-h-[80px] hover:bg-gray-50 transition-colors border-t border-gray-100 relative group overflow-hidden">
                            <span className={`text-xs font-medium block mb-1 ml-1 ${hasItems ? 'text-gray-900' : 'text-gray-400'}`}>{d}</span>
                            <div className="space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                                {/* Events */}
                                {daysEvents.map(ev => (
                                    <Link key={ev.id} to={`/events/${ev.id}`} className="block">
                                        <div className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 truncate cursor-pointer hover:bg-blue-100" title={`${ev.name} (I/C: ${ev.headTeacherName})`}>
                                            {ev.name}
                                        </div>
                                    </Link>
                                ))}
                                {/* Exams */}
                                {daysExams.map((ex, idx) => (
                                    <div key={`ex-${idx}`} className="text-[10px] bg-red-50 text-red-700 px-1 py-0.5 rounded border border-red-100 truncate cursor-default" title={`Exam: ${ex.subject} (${ex.className})`}>
                                        Exam: {ex.subject} ({ex.className})
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Events</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Exams</div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { students, teachers, classes, currentUser, examSchedules } = useSchool();

    // --- CHART DATA GENERATION ---
    const classDistribution = useMemo(() => {
        // FOR TEACHER: Show My Workload Distribution
        if (currentUser?.role === 'Teacher') {
            const myProfile = teachers.find(t => t.id === currentUser.id);
            if (!myProfile) return [];
            return myProfile.workload.map(w => ({
                name: `Cls ${w.className}`,
                value: w.periods
            }));
        }

        // FOR ADMIN: Show School Distribution
        return classes.reduce((acc: any, cls) => {
            const grade = `Cls ${cls.grade}`;
            const existing = acc.find((d: any) => d.name === grade);
            if (existing) {
                existing.students += cls.studentIds.length;
            } else {
                acc.push({ name: grade, students: cls.studentIds.length });
            }
            return acc;
        }, []).sort((a: any, b: any) => {
            return parseInt(a.name.replace(/\D/g, '') || '0') - parseInt(b.name.replace(/\D/g, '') || '0');
        });
    }, [classes, teachers, currentUser]);

    // --- RENDER LOGIC BASED ON ROLE ---
    const renderMetrics = () => {
        // 1. STUDENT VIEW
        if (currentUser?.role === 'Student') {
            const myProfile = students.find(s => s.id === currentUser.id);

            if (!myProfile) return <div className="text-red-500">Student Profile Not Found</div>;

            // Calc Next Exam
            let nextExamSubject = "No upcoming exams";
            let nextExamDate = "";
            if (myProfile.classId) {
                const today = new Date().toISOString().split('T')[0];
                let allUpcoming: any[] = [];
                examSchedules.forEach(sch => {
                    const relevant = sch.entries.filter(e => e.classId === myProfile.classId && e.date >= today);
                    allUpcoming.push(...relevant);
                });
                allUpcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                if (allUpcoming.length > 0) {
                    nextExamSubject = allUpcoming[0].subject;
                    nextExamDate = allUpcoming[0].date;
                }
            }

            const myPoints = myProfile.activities?.reduce((acc, act) => {
                if (act.achievement?.includes('Winner')) return acc + 10;
                if (act.achievement?.includes('Runner')) return acc + 7;
                if (act.achievement?.includes('Third')) return acc + 5;
                return acc + 1; // Participation
            }, 0) || 0;

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="My Attendance" value={`${myProfile.attendancePercentage}%`} icon={CalendarCheck} trend={myProfile.attendancePercentage < 75 ? "Low Alert" : "Good"} color={myProfile.attendancePercentage < 75 ? "bg-red-500" : "bg-green-500"} />
                    <StatCard title="House Points" value={myPoints.toString()} icon={Award} trend={`${myProfile.house} House`} color="bg-purple-500" />
                    <StatCard title="Next Exam" value={nextExamSubject} icon={BookOpen} trend={nextExamDate} color="bg-blue-500" />
                    {/* REVERTED TO WELLNESS WIDGET - PRIVACY PRESERVED */}
                    <WellnessWidget />
                </div>
            );
        }

        // 2. TEACHER VIEW
        if (currentUser?.role === 'Teacher') {
            const myProfile = teachers.find(t => t.id === currentUser.id);
            if (!myProfile) return <div className="text-red-500">Teacher Profile Not Found</div>;

            const myClassesCount = myProfile.workload.length;
            const totalPeriods = myProfile.workload.reduce((acc, w) => acc + w.periods, 0);

            // Calculate total unique students taught (rough estimate based on class size)
            const studentsTaught = classes
                .filter(c => myProfile.workload.some(w => w.classId === c.id))
                .reduce((acc, c) => acc + c.studentIds.length, 0);

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="My Classes" value={myClassesCount.toString()} icon={Briefcase} trend="Active Sections" color="bg-blue-500" />
                    <StatCard title="Weekly Load" value={totalPeriods.toString()} icon={Clock} trend="/ 40 Periods" color={totalPeriods > 32 ? "bg-red-500" : "bg-green-500"} />
                    <StatCard title="Students Taught" value={studentsTaught.toString()} icon={Users} trend="Total Reach" color="bg-purple-500" />
                    <StatCard title="Next Task" value="Log Daily Class" icon={FileText} trend="Action Required" color="bg-orange-500" />
                </div>
            );
        }

        // 3. ADMIN VIEW
        const totalStudents = students.length;
        const totalTeachers = teachers.length;
        const unpaidFees = students.filter(s => s.feesStatus !== 'Paid').length;
        const averageAttendance = Math.round(students.reduce((acc, s) => acc + s.attendancePercentage, 0) / (totalStudents || 1));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={totalStudents.toString()} icon={Users} trend="Active" color="bg-blue-500" />
                <StatCard title="Total Teachers" value={totalTeachers.toString()} icon={BookOpen} trend="Staff" color="bg-purple-500" />
                <StatCard title="Avg Attendance" value={`${averageAttendance}%`} icon={CalendarCheck} color="bg-green-500" />
                <StatCard title="Pending Fees" value={unpaidFees.toString()} icon={CreditCard} trend="Students" color="bg-orange-500" />
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* MISSION / PRESENTATION BANNER */}
            <div className="bg-gradient-to-r from-school-900 to-school-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">ScholasticAI</h1>
                    <p className="text-school-100 text-lg max-w-2xl font-light">
                        Using AI to measure the impact of attendance, activities, and school culture on academic success.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
                    <BrainCircuit size={400} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FeatureCard
                    title="Causal Factor Analysis"
                    desc="AI correlates missed topics and co-curricular load directly with exam performance."
                    icon={BrainCircuit}
                />
                <FeatureCard
                    title="Zero-Vacancy Engine"
                    desc="Auto-allocates staff to ensure 100% subject coverage across all classes."
                    icon={LayoutGrid}
                />
                <FeatureCard
                    title="360° Holistic Profiles"
                    desc="Integrates sports, arts, and discipline records with academic history."
                    icon={Award}
                />
                <FeatureCard
                    title="Teacher Empowerment"
                    desc="Helps teachers to provide precise, surgical interventions rather than a generic advice"
                    icon={FileText}
                />
            </div>

            {/* STATS ROW */}
            <div className="flex justify-between items-center pt-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {currentUser?.role === 'Student' ? 'My Overview' : currentUser?.role === 'Teacher' ? 'My Dashboard' : 'Real-time Metrics'}
                    </h2>
                </div>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">Session: 2025-26</span>
            </div>

            {/* DYNAMIC METRICS */}
            {renderMetrics()}

            {/* CALENDAR & CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                {/* Calendar takes 2 cols */}
                <div className="lg:col-span-2">
                    <SchoolCalendar />
                </div>

                {/* Chart takes 1 col */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {currentUser?.role === 'Teacher' ? 'My Workload Distribution' : 'Student Distribution'}
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classDistribution} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                {currentUser?.role === 'Teacher' ? (
                                    <Bar dataKey="value" name="Periods" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} />
                                ) : (
                                    <Bar dataKey="students" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={15} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
