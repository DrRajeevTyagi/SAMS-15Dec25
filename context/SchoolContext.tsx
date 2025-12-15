import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Student, SchoolClass, StudentStream, Teacher, Workload, SubjectPeriodAllocation, ClassSession, ExamResult, CoCurricularActivity, SchoolContextType, ExamSchedule, ExamEntry, AdmissionField, SchoolEvent, EventStaffRole, EventStudentRole, EventVolunteer, User, UserRole, Message, Poll, DisciplinaryAction, Notice, ExamSubjectScore, ImportedSchoolData } from '../types';
import { STATIC_SCHOOL_DATA } from '../data/staticData';

// =========================================================================================
// 🗄️ INDEXED DB UTILITIES (The "Local Database" Engine)
// =========================================================================================
const DB_NAME = 'ScholasticDB';
const DB_VERSION = 1;
const STORE_NAME = 'school_data_store';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

const saveToDB = async (key: string, data: ImportedSchoolData) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(data, key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
                console.error("IndexedDB Transaction Error:", tx.error);
                reject(tx.error);
            };
        });
    } catch (err) {
        console.error("IndexedDB Save Error:", err);
        // Graceful degradation: Try localStorage as fallback for critical data
        try {
            localStorage.setItem(`fallback_${key}`, JSON.stringify(data));
            console.warn("Saved to localStorage fallback");
        } catch (fallbackErr) {
            console.error("Fallback save also failed:", fallbackErr);
        }
        // Don't throw - allow app to continue
        return false;
    }
};

const loadFromDB = async (key: string): Promise<ImportedSchoolData | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                // Validate data structure before returning
                if (result && typeof result === 'object') {
                    resolve(result);
                } else {
                    // Try localStorage fallback
                    try {
                        const fallback = localStorage.getItem(`fallback_${key}`);
                        if (fallback) {
                            resolve(JSON.parse(fallback));
                        } else {
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                }
            };
            request.onerror = () => {
                console.error("IndexedDB Request Error:", request.error);
                // Try localStorage fallback
                try {
                    const fallback = localStorage.getItem(`fallback_${key}`);
                    if (fallback) {
                        resolve(JSON.parse(fallback));
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            };
        });
    } catch (err) {
        console.error("IndexedDB Load Error:", err);
        // Try localStorage fallback
        try {
            const fallback = localStorage.getItem(`fallback_${key}`);
            if (fallback) {
                return JSON.parse(fallback);
            }
        } catch (fallbackErr) {
            console.error("Fallback load also failed:", fallbackErr);
        }
        return null;
    }
};

const clearDB = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                // Also clear localStorage fallbacks
                try {
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('fallback_')) {
                            localStorage.removeItem(key);
                        }
                    });
                } catch (e) {
                    console.warn("Could not clear localStorage fallbacks:", e);
                }
                resolve(true);
            };
            tx.onerror = () => {
                console.error("IndexedDB Clear Transaction Error:", tx.error);
                reject(tx.error);
            };
        });
    } catch (err) {
        console.error("IndexedDB Clear Error", err);
        // Still try to clear localStorage fallbacks
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('fallback_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn("Could not clear localStorage fallbacks:", e);
        }
        throw err;
    }
};

// =========================================================================================
// 🏭 DETERMINISTIC DATA GENERATOR (THE "FACTORY DEFAULT" ENGINE)
// =========================================================================================
let seed = 12345;
const seededRandom = () => {
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296;
    seed = (a * seed + c) % m;
    return seed / m;
};
const resetSeed = () => { seed = 12345; };

const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'] as const;

// --- DEFAULT ADMISSION SCHEMA ---
const DEFAULT_ADMISSION_SCHEMA: AdmissionField[] = [
    { id: 'name', label: 'Full Name', type: 'text', required: true, isSystem: true, section: 'Personal' },
    { id: 'admissionNo', label: 'Admission Number', type: 'text', required: true, isSystem: true, section: 'Academic' },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true, isSystem: false, section: 'Personal' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true, isSystem: false, section: 'Personal' },
    { id: 'guardianName', label: "Father's Name", type: 'text', required: true, isSystem: false, section: 'Parent' },
    { id: 'motherName', label: "Mother's Name", type: 'text', required: false, isSystem: false, section: 'Parent' },
    { id: 'contactNo', label: 'Primary Contact No', type: 'number', required: true, isSystem: false, section: 'Parent' },
    { id: 'address', label: 'Residential Address', type: 'textarea', required: false, isSystem: false, section: 'Parent' },
    { id: 'religion', label: 'Religion', type: 'select', options: ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Other'], required: false, isSystem: false, section: 'Other' },
    { id: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], required: false, isSystem: false, section: 'Personal' }
];

// --- DATA LISTS ---
const FIRST_NAMES = [
    "Aarav", "Vihaan", "Aditya", "Arjun", "Reyansh", "Vivaan", "Krishna", "Ishaan", "Shaurya", "Atharv",
    "Anaya", "Myra", "Saanvi", "Aadhya", "Kiara", "Diya", "Pari", "Amaira", "Riya", "Kavya",
    "Rohan", "Vikram", "Neha", "Priya", "Rahul", "Sneha", "Amit", "Pooja", "Suresh", "Anjali",
    "Kabir", "Meera", "Zara", "Yash", "Nikhil", "Tanvi", "Urvi", "Dev", "Rishi", "Tara"
];

const LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Malhotra", "Bhatia", "Saxena", "Mehta", "Jain",
    "Chopra", "Desai", "Reddy", "Nair", "Patel", "Mishra", "Yadav", "Das", "Biswas", "Banerjee",
    "Kapoor", "Khanna", "Joshi", "Chawla", "Narula", "Gill", "Sethi", "Ahluwalia", "Deol", "Rana"
];

const DELHI_LOCALITIES = [
    "Rohini Sector 13, Delhi-85", "Pitampura, FU-Block, Delhi-34", "Vasant Kunj B-Block, New Delhi",
    "Dwarka Sector 10, New Delhi", "Lajpat Nagar IV, New Delhi", "Mayur Vihar Phase 1, Delhi-91",
    "Civil Lines, Delhi-54", "Model Town Part 2, Delhi", "Greater Kailash I, New Delhi",
    "Paschim Vihar, BG-8, New Delhi", "Janakpuri C-Block, New Delhi", "Saket, J-Block, New Delhi",
    "Green Park Main, New Delhi", "Vikas Puri, MG-1, New Delhi", "Rajouri Garden, Main Mkt, Delhi"
];

const SYLLABUS_TOPICS: Record<string, string[]> = {
    'Mathematics': ['Calculus: Chain Rule', 'Matrices & Determinants', 'Probability Distribution', '3D Geometry', 'Integrals: Definite', 'Relations & Functions'],
    'Physics': ['Electrostatics: Field Theory', 'Current Electricity: Kirchhoff Law', 'Optics: Wave Theory', 'Semiconductors: Logic Gates', 'Magnetism: Biot-Savart Law'],
    'Chemistry': ['Solutions: Raoult Law', 'Electrochemistry: Nernst Eq', 'Chemical Kinetics', 'd-and f-Block Elements', 'Coordination Compounds'],
    'English': ['Flamingo: The Last Lesson', 'Vistas: The Third Level', 'Writing: Notice & Invitations', 'Reading Comprehension', 'Debate Writing Skills'],
    'Computer Science': ['Python: Pandas Dataframes', 'SQL: Joins & Group By', 'Computer Networks: TCP/IP', 'Stack Implementation', 'File Handling: CSV'],
    'Accountancy': ['Partnership: Admission', 'Company Accounts: Shares', 'Cash Flow Statement', 'Ratio Analysis', 'Dissolution of Firm'],
    'Economics': ['Macro: National Income', 'Macro: Money & Banking', 'Indian Eco: 1991 Reforms', 'Rural Development', 'Employment & Infrastructure'],
    'Business Studies': ['Principles of Management', 'Marketing Mix (4Ps)', 'Consumer Protection Act', 'Financial Management', 'Staffing & Directing'],
    'History': ['Bricks, Beads and Bones', 'Kings, Farmers and Towns', 'Kinship, Caste and Class', 'Thinkers, Beliefs and Buildings', 'Rebels and the Raj'],
    'Political Science': ['Cold War Era', 'End of Bipolarity', 'US Hegemony', 'Alternative Centres of Power', 'Contemporary South Asia'],
    'Geography': ['Human Geography', 'The World Population', 'Human Development', 'Primary Activities', 'Transport and Communication'],
    'Sociology': ['Demographic Structure', 'Social Institutions', 'Market as Institution', 'Patterns of Social Inequality', 'Challenges of Diversity'],
    'Psychology': ['Intelligence & Aptitude', 'Self and Personality', 'Meeting Life Challenges', 'Psychological Disorders', 'Therapeutic Approaches']
};

const SUBJECT_COMPATIBILITY: Record<string, string[]> = {
    'Social Studies': ['History', 'Geography', 'Political Science', 'Social Science', 'Sociology'],
    'Social Science': ['History', 'Geography', 'Political Science', 'Sociology', 'Social Studies'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'EVS', 'Science'],
    'EVS': ['Science', 'Biology', 'Geography', 'EVS', 'Environmental Science'],
    'Value Education': ['Psychology', 'English', 'Hindi', 'History', 'Value Education', 'Life Skills', 'General Studies'],
    'Activity': ['Art/Craft', 'Music', 'Dance', 'Games', 'Physical Education', 'SUPW'],
    'Games': ['Physical Education', 'Games', 'Sports'],
    'General Studies': ['English', 'History', 'Political Science', 'General Studies', 'Social Studies'],
    'SUPW': ['Art/Craft', 'Science', 'SUPW', 'Work Experience', 'Computer Science'],
    'Library': ['English', 'Hindi', 'Library', 'Librarian', 'History'],
    'Unit Test': ['Mathematics', 'English', 'Science', 'Physics', 'Chemistry'], // Usually taken by Class Teacher or subject expert
    'Math': ['Mathematics'],
    'Maths': ['Mathematics'],
    'Computer Science': ['Computer Science', 'I.P.', 'Informatics Practices'],
    'English': ['English', 'English Core', 'English Elective'],
    'Hindi': ['Hindi', 'Hindi Core', 'Hindi Elective']
};

const CURRICULUM_TEMPLATES: Record<string, SubjectPeriodAllocation[]> = {
    'PRIMARY': [
        { subject: 'English', periods: 9 }, { subject: 'Mathematics', periods: 8 }, { subject: 'Hindi', periods: 5 },
        { subject: 'EVS', periods: 4 }, { subject: 'Value Education', periods: 1 }, { subject: 'Music', periods: 1 },
        { subject: 'Art/Craft', periods: 2 }, { subject: 'Games', periods: 1 }, { subject: 'Computer Science', periods: 2 },
        { subject: 'Dance', periods: 1 }, { subject: 'Activity', periods: 1 }
    ],
    'MIDDLE': [
        { subject: 'English', periods: 7 }, { subject: 'Mathematics', periods: 7 }, { subject: 'Hindi', periods: 6 },
        { subject: 'EVS', periods: 6 }, { subject: 'Social Studies', periods: 5 },
        { subject: 'Computer Science', periods: 2 }, { subject: 'Art/Craft', periods: 2 }, { subject: 'Games', periods: 2 },
        { subject: 'Music', periods: 2 }, { subject: 'Library', periods: 1 }
    ],
    'UPPER_MIDDLE': [
        { subject: 'English', periods: 6 }, { subject: 'Mathematics', periods: 6 }, { subject: 'Science', periods: 5 },
        { subject: 'Social Science', periods: 5 }, { subject: 'Hindi', periods: 5 }, { subject: '3rd Language', periods: 3 },
        { subject: 'Computer Science', periods: 2 }, { subject: 'SUPW', periods: 2 }, { subject: 'Games', periods: 2 },
        { subject: 'Library', periods: 1 }, { subject: 'Value Education', periods: 1 }, { subject: 'Activity', periods: 1 }, { subject: 'Unit Test', periods: 1 }
    ],
    'SECONDARY': [
        { subject: 'Mathematics', periods: 7 }, { subject: 'English', periods: 5 }, { subject: '2nd Language', periods: 5 },
        { subject: 'History', periods: 4 }, { subject: 'Physics', periods: 3 }, { subject: 'Chemistry', periods: 3 },
        { subject: 'Biology', periods: 3 }, { subject: 'Geography', periods: 3 },
        { subject: 'SUPW', periods: 2 }, { subject: 'Games', periods: 1 }, { subject: 'Library', periods: 1 },
        { subject: 'Activity', periods: 1 }, { subject: 'Value Education', periods: 1 }, { subject: 'Unit Test', periods: 1 }
    ],
    'SENIOR_SCI': [
        { subject: 'English', periods: 5 }, { subject: 'Physics', periods: 7 }, { subject: 'Chemistry', periods: 7 },
        { subject: 'Mathematics', periods: 7 }, { subject: 'Computer Science', periods: 7 },
        { subject: 'SUPW', periods: 2 }, { subject: 'General Studies', periods: 1 }, { subject: 'Value Education', periods: 1 },
        { subject: 'Library', periods: 1 }, { subject: 'Activity', periods: 1 }, { subject: 'Unit Test', periods: 1 }
    ],
    'SENIOR_COMM': [
        { subject: 'English', periods: 5 }, { subject: 'Accountancy', periods: 7 }, { subject: 'Business Studies', periods: 7 },
        { subject: 'Economics', periods: 7 }, { subject: 'Mathematics', periods: 7 },
        { subject: 'SUPW', periods: 2 }, { subject: 'General Studies', periods: 1 }, { subject: 'Value Education', periods: 1 },
        { subject: 'Library', periods: 1 }, { subject: 'Activity', periods: 1 }, { subject: 'Unit Test', periods: 1 }
    ],
    'SENIOR_HUM': [
        { subject: 'English', periods: 5 }, { subject: 'Political Science', periods: 7 }, { subject: 'Sociology', periods: 7 },
        { subject: 'Psychology', periods: 7 }, { subject: 'Economics', periods: 7 },
        { subject: 'SUPW', periods: 2 }, { subject: 'General Studies', periods: 1 }, { subject: 'Value Education', periods: 1 },
        { subject: 'Library', periods: 1 }, { subject: 'Activity', periods: 1 }, { subject: 'Unit Test', periods: 1 }
    ]
};

const sortClassesHelper = (classes: SchoolClass[]) => {
    const gradeMap: Record<string, number> = { 'Nur': -3, 'LKG': -2, 'UKG': -1 };

    const getGradeValue = (grade: string) => {
        const num = parseInt(grade);
        return isNaN(num) ? (gradeMap[grade] || -10) : num;
    };

    return [...classes].sort((a, b) => {
        const valA = getGradeValue(a.grade);
        const valB = getGradeValue(b.grade);

        if (valA !== valB) return valB - valA;
        return a.section.localeCompare(b.section);
    });
};

// --- ENHANCED ALLOCATION ENGINE ---
const GENERIC_SUBJECTS = ['Library', 'Unit Test', 'Value Education', 'General Studies', 'Activity', 'SUPW', 'Games', 'Work Experience', 'Art/Craft', 'Music', 'Dance'];

const autoAllocateWorkload = (classes: SchoolClass[], teachers: Teacher[]) => {
    // Clone to avoid mutation
    const newClasses = classes.map(c => ({ ...c, periodAllocation: c.periodAllocation.map(p => ({ ...p })) }));
    const newTeachers = teachers.map(t => ({ ...t, workload: [...t.workload] }));

    const getTeacherLoad = (t: Teacher) => t.workload.reduce((sum, w) => sum + w.periods, 0);
    // OPTIMIZED CAP: Push existing teachers to ~36 periods before hiring new ones.
    const WORKLOAD_CAP = 38;

    const generateNewTeacher = (subject: string) => {
        const nextId = newTeachers.length + 100;
        const fName = FIRST_NAMES[Math.floor(seededRandom() * FIRST_NAMES.length)];
        const lName = LAST_NAMES[Math.floor(seededRandom() * LAST_NAMES.length)];
        const newTeacher: Teacher = {
            id: `t_auto_${nextId}_${Date.now()}`,
            teacherCode: `T-${8000 + nextId}`,
            name: `Mr/Ms ${fName} ${lName}`,
            qualification: 'M.Sc, B.Ed (Ad-hoc)',
            mainSubject: subject,
            workload: [],
            isClassTeacher: false,
            joiningDate: new Date().toISOString().split('T')[0],
            contactNo: '0000000000'
        };
        newTeachers.push(newTeacher);
        return newTeacher;
    };

    // --- ALLOCATION STRATEGY ---
    newClasses.forEach(cls => {
        cls.periodAllocation.forEach(period => {
            if (period.assignedTeacherId) return; // Already assigned

            let candidate: Teacher | undefined;

            // 1. Strict Match (Subject == Subject)
            let candidates = newTeachers.filter(t => t.mainSubject === period.subject && getTeacherLoad(t) + period.periods <= WORKLOAD_CAP);

            // 2. Compatibility Match (Physics -> Science)
            if (candidates.length === 0) {
                candidates = newTeachers.filter(t =>
                    SUBJECT_COMPATIBILITY[period.subject]?.includes(t.mainSubject) &&
                    getTeacherLoad(t) + period.periods <= WORKLOAD_CAP
                );
            }

            // 3. Fallback for Generics (Library, Values) -> Assign to any underloaded teacher
            if (candidates.length === 0 && GENERIC_SUBJECTS.includes(period.subject)) {
                candidates = newTeachers.filter(t => getTeacherLoad(t) + period.periods <= WORKLOAD_CAP);
            }

            // SELECTION: Prioritize teacher who already has classes but is not full (Efficient packing)
            if (candidates.length > 0) {
                // Sort by load descending (fill up teachers who are already working)
                // But check if they already teach this class to minimize movement? No, focus on load.
                candidate = candidates.sort((a, b) => getTeacherLoad(b) - getTeacherLoad(a))[0];
            }

            // 4. Last Resort: Hire New
            if (!candidate && !GENERIC_SUBJECTS.includes(period.subject)) {
                candidate = generateNewTeacher(period.subject);
            }

            // Assign
            if (candidate) {
                period.assignedTeacherId = candidate.id;
                period.assignedTeacherName = candidate.name;
                candidate.workload.push({ classId: cls.id, className: cls.name, subject: period.subject, periods: period.periods });
            }
        });
    });

    // --- PASS 3: ASSIGN CLASS TEACHERS ---
    newClasses.forEach(cls => {
        if (!cls.classTeacherId) {
            // Find teacher with max interaction with this class
            const teachersInClass = newTeachers.filter(t => t.workload.some(w => w.classId === cls.id));
            const ctCandidate = teachersInClass.sort((a, b) => {
                const periodsA = a.workload.find(w => w.classId === cls.id)?.periods || 0;
                const periodsB = b.workload.find(w => w.classId === cls.id)?.periods || 0;
                return periodsB - periodsA;
            }).find(t => !t.isClassTeacher) || teachersInClass[0];

            if (ctCandidate) {
                cls.classTeacherId = ctCandidate.id;
                ctCandidate.isClassTeacher = true;
                ctCandidate.classTeacherOf = cls.name;
            }
        }
    });

    return { classes: newClasses, teachers: newTeachers };
};

const getCurriculumForClass = (grade: string, section: string): SubjectPeriodAllocation[] => {
    const g = parseInt(grade);
    if (isNaN(g)) return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['PRIMARY']));
    if (g >= 1 && g <= 3) return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['PRIMARY']));
    if (g >= 4 && g <= 6) return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['MIDDLE']));
    if (g >= 7 && g <= 8) return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['UPPER_MIDDLE']));
    if (g >= 9 && g <= 10) return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['SECONDARY']));
    if (g >= 11) {
        if (section === 'A') return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['SENIOR_HUM']));
        if (section === 'B') return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['SENIOR_SCI']));
        if (section === 'C') return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['SENIOR_COMM']));
        return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES['SENIOR_SCI']));
    }
    return [];
};

const generateMockData = () => {
    resetSeed();

    const classes: SchoolClass[] = [];
    const students: Student[] = [];
    const teachers: Teacher[] = [];
    const sessions: ClassSession[] = [];
    const schedules: ExamSchedule[] = [];
    const events: SchoolEvent[] = [];
    const messages: Message[] = [];
    const polls: Poll[] = [];
    const notices: Notice[] = [];

    let studentCounter = 1;

    const JUNIOR_LEVELS = ['Nur', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString())];
    const SENIOR_LEVELS = ['11', '12'];

    const createClass = (level: string, section: string, stream?: StudentStream) => {
        const classId = `c_${level}_${section}`;
        const className = `${level}-${section}`;
        const classStudents: string[] = [];
        const numStudents = Math.floor(seededRandom() * 10) + 25;

        const curriculum = getCurriculumForClass(level, section);
        const examSubjects = curriculum.map(c => c.subject).filter(s => s !== 'Library' && s !== 'Games' && s !== 'SUPW' && s !== 'Activity' && s !== 'Value Education');

        let totalPeriods = 40;
        const g = parseInt(level);
        if (isNaN(g) || g <= 3) totalPeriods = 35;

        const schoolClass: SchoolClass = {
            id: classId, name: className, grade: level, section: section,
            studentIds: [], periodAllocation: curriculum, totalPeriodsPerWeek: totalPeriods
        };

        for (let i = 0; i < numStudents; i++) {
            const sId = `s_${studentCounter}`;
            const fName = FIRST_NAMES[Math.floor(seededRandom() * FIRST_NAMES.length)];
            const lName = LAST_NAMES[Math.floor(seededRandom() * LAST_NAMES.length)];
            const birthYear = 2025 - 5 - parseInt(level) || 2018;
            const safeContactNo = `00000${Math.floor(seededRandom() * 100000).toString().padStart(5, '0')}`;
            const address = DELHI_LOCALITIES[i % DELHI_LOCALITIES.length];

            // --- STUDENT ARCHETYPE LOGIC (Sensible History) ---
            const roll = seededRandom();
            let archetype = 'General';
            if (roll > 0.85) archetype = 'Scholar';
            else if (roll > 0.70) archetype = 'Athlete';
            else if (roll > 0.55) archetype = 'Artist';

            // Disciplinary logic (Athletes & General sometimes get in trouble, Scholars rarely)
            const disciplinaryActions: DisciplinaryAction[] = [];
            if (archetype !== 'Scholar' && seededRandom() > 0.90) {
                disciplinaryActions.push({
                    id: `d_${Date.now()}_${i}`,
                    date: '2025-05-15',
                    type: 'Yellow',
                    reason: archetype === 'Athlete' ? 'Late for assembly (Sports practice)' : 'Uniform violation',
                    issuedBy: 'Class Teacher',
                    penaltyPoints: -1
                });
            }

            // Attendance Logic
            let attendance = 0;
            if (archetype === 'Scholar') attendance = 90 + Math.floor(seededRandom() * 10); // 90-100%
            else if (archetype === 'Athlete') attendance = 75 + Math.floor(seededRandom() * 15); // 75-90% (Matches/Practice)
            else attendance = 80 + Math.floor(seededRandom() * 15);

            // --- EXAM RESULT GENERATION (Consistent with Archetype) ---
            const scores: ExamSubjectScore[] = examSubjects.map(sub => {
                const max = 100;
                let baseScore = 60;
                if (archetype === 'Scholar') baseScore = 85;
                if (archetype === 'Athlete' && sub === 'Physical Education') baseScore = 90;

                let score = Math.min(100, Math.floor(baseScore + seededRandom() * 15));
                // Ensure no >100
                if (score > 100) score = 98;

                return { subject: sub, score, maxScore: max, grade: score >= 90 ? 'A1' : score >= 80 ? 'A2' : score >= 70 ? 'B1' : 'B2' };
            });
            const totalScore = scores.reduce((acc, curr) => acc + curr.score, 0);
            const maxTotal = scores.length * 100;
            const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

            const examResult: ExamResult = {
                id: `ex_res_${Date.now()}_${i}`,
                examName: 'Half Yearly Examination 2024',
                date: '2024-09-20',
                subjects: scores,
                totalPercentage: percentage
            };

            students.push({
                id: sId,
                admissionNo: `A-${2025000 + studentCounter}`,
                name: `${fName} ${lName}`,
                guardianName: `Mr. ${lName}`,
                contactNo: safeContactNo,
                feesStatus: seededRandom() > 0.90 ? 'Pending' : 'Paid',
                attendancePercentage: attendance,
                joiningDate: '2025-04-01',
                classId: classId,
                className: className,
                stream: stream || StudentStream.GENERAL,
                house: HOUSES[i % 4],
                examResults: scores.length > 0 ? [examResult] : [],
                activities: [], // Populated later
                disciplinaryActions: disciplinaryActions,
                customDetails: {},
                gender: seededRandom() > 0.5 ? "Male" : "Female",
                dob: `${birthYear}-05-15`,
                address: address
            });
            classStudents.push(sId);
            studentCounter++;
        }
        schoolClass.studentIds = classStudents;
        classes.push(schoolClass);
    };

    JUNIOR_LEVELS.forEach(l => { createClass(l, 'A'); createClass(l, 'B'); });
    SENIOR_LEVELS.forEach(l => {
        createClass(l, 'A', StudentStream.HUMANITIES);
        createClass(l, 'B', StudentStream.SCIENCE);
        createClass(l, 'C', StudentStream.COMMERCE);
    });

    // OPTIMIZED STAFF GENERATION (Reduced count, Better distribution)
    // We need approx 55 teachers for 30 classes to maintain ~28 periods/week load.
    for (let i = 0; i < 55; i++) {
        const fName = FIRST_NAMES[Math.floor(seededRandom() * FIRST_NAMES.length)];
        const lName = LAST_NAMES[Math.floor(seededRandom() * LAST_NAMES.length)];

        // Expanded Subjects for Realistic Staff Room
        const subjects = [
            'Mathematics', 'Physics', 'English', 'Hindi', 'Chemistry', 'Biology',
            'History', 'Geography', 'Political Science', 'Economics', 'Computer Science',
            'Accountancy', 'Business Studies', 'Psychology', 'Sociology', 'Physical Education',
            'Art/Craft', 'Music'
        ];

        // Weighted random to ensure more Core subjects (English/Math) than Electives
        let subj = subjects[Math.floor(seededRandom() * subjects.length)];
        if (i < 10) subj = 'English';
        else if (i < 20) subj = 'Mathematics';

        // Random Join Date between 2015 and 2024
        const joinYear = 2015 + Math.floor(seededRandom() * 10);
        const safeTeacherContact = `00000${Math.floor(seededRandom() * 100000).toString().padStart(5, '0')}`;

        teachers.push({
            id: `t_${i}`,
            teacherCode: `T-70${i.toString().padStart(2, '0')}`,
            name: `Mr/Ms ${fName} ${lName}`,
            qualification: 'M.Sc, B.Ed',
            mainSubject: subj,
            workload: [],
            isClassTeacher: false,
            joiningDate: `${joinYear}-04-01`,
            contactNo: safeTeacherContact,
            house: HOUSES[i % 4]
        });
    }

    const allocated = autoAllocateWorkload(classes, teachers);
    const allocatedClasses = allocated.classes;
    const allocatedTeachers = allocated.teachers;

    HOUSES.forEach(h => {
        const teacher = allocatedTeachers.find(t => t.house === h && !t.isHouseMaster && parseInt(t.teacherCode.split('-')[1]) < 7030);
        if (teacher) teacher.isHouseMaster = true;
    });

    // --- GENERATE PAST CLASS SESSIONS (LOGS) with REAL TOPICS ---
    allocatedClasses.forEach(cls => {
        const subjects = cls.periodAllocation.map(p => p.subject).filter(s => s !== 'Library' && s !== 'Games' && s !== 'SUPW');
        if (subjects.length === 0) return;

        for (let i = 1; i <= 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 2));
            const subj = subjects[i % subjects.length];
            const absentees: string[] = [];

            if (cls.studentIds.length > 0) {
                const numAbsent = Math.floor(seededRandom() * 3);
                for (let k = 0; k < numAbsent; k++) {
                    absentees.push(cls.studentIds[Math.floor(seededRandom() * cls.studentIds.length)]);
                }
            }

            // INTELLIGENT TOPIC PICKER
            let topic = `Chapter ${i}: Introduction to ${subj}`;
            const topicList = SYLLABUS_TOPICS[subj];
            if (topicList && topicList.length > 0) {
                topic = topicList[i % topicList.length];
            }

            sessions.push({
                id: `sess_${cls.id}_${i}`,
                classId: cls.id,
                date: date.toISOString().split('T')[0],
                subject: subj,
                topic: topic,
                absentStudentIds: [...new Set(absentees)]
            });
        }
    });

    // --- COMPREHENSIVE EVENT GENERATION SYSTEM ---
    // Age-appropriate event templates by grade level
    const eventTemplates: Array<{
        name: string;
        category: SchoolEvent['category'];
        type: 'Intra-School' | 'Inter-School';
        minGrade: number; // Minimum grade (e.g., 1 = Class 1)
        maxGrade: number; // Maximum grade (e.g., 12 = Class 12)
        venue: string;
        description: string;
    }> = [
        // NURSERY & PRIMARY (Nur-5) - Simple, fun activities
        { name: 'Coloring Competition', category: 'Visual Arts', type: 'Intra-School', minGrade: 0, maxGrade: 2, venue: 'Art Room', description: 'Creative coloring activity for young students' },
        { name: 'Story Telling Session', category: 'Literary', type: 'Intra-School', minGrade: 0, maxGrade: 3, venue: 'Library', description: 'Encouraging imagination through stories' },
        { name: 'Rhyme Recitation', category: 'Performing Arts', type: 'Intra-School', minGrade: 0, maxGrade: 2, venue: 'Assembly Hall', description: 'Fun rhyme recitation competition' },
        { name: 'Fun Run (50m)', category: 'Sports', type: 'Intra-School', minGrade: 1, maxGrade: 3, venue: 'School Ground', description: 'Short distance fun run for primary students' },
        { name: 'Clay Modeling Workshop', category: 'Visual Arts', type: 'Intra-School', minGrade: 0, maxGrade: 4, venue: 'Art Room', description: 'Creative clay modeling activity' },
        
        // MIDDLE SCHOOL (6-8) - More structured activities
        { name: 'Inter-House Quiz Competition', category: 'Scientific', type: 'Intra-School', minGrade: 6, maxGrade: 8, venue: 'Auditorium', description: 'General knowledge quiz competition' },
        { name: 'Poster Making Competition', category: 'Visual Arts', type: 'Intra-School', minGrade: 4, maxGrade: 8, venue: 'Art Room', description: 'Theme-based poster making' },
        { name: 'Debate Competition', category: 'Literary', type: 'Intra-School', minGrade: 7, maxGrade: 12, venue: 'Auditorium', description: 'Inter-house debate on current topics' },
        { name: 'Science Model Exhibition', category: 'Scientific', type: 'Intra-School', minGrade: 6, maxGrade: 10, venue: 'Science Block', description: 'Display of science models and experiments' },
        { name: 'Inter-House Football', category: 'Sports', type: 'Intra-School', minGrade: 6, maxGrade: 12, venue: 'Football Ground', description: 'Inter-house football tournament' },
        { name: 'Dance Competition', category: 'Performing Arts', type: 'Intra-School', minGrade: 4, maxGrade: 12, venue: 'Auditorium', description: 'Cultural dance performances' },
        { name: 'Cleanliness Drive', category: 'Leadership/Community', type: 'Intra-School', minGrade: 5, maxGrade: 10, venue: 'School Campus', description: 'Community service activity' },
        
        // SENIOR SCHOOL (9-12) - Advanced competitions
        { name: 'Model United Nations (MUN)', category: 'Literary', type: 'Intra-School', minGrade: 9, maxGrade: 12, venue: 'Conference Hall', description: 'Simulated UN conference' },
        { name: 'Robotics Championship', category: 'Scientific', type: 'Intra-School', minGrade: 9, maxGrade: 12, venue: 'Computer Lab', description: 'Robotics competition and exhibition' },
        { name: 'Math Olympiad', category: 'Scientific', type: 'Intra-School', minGrade: 9, maxGrade: 12, venue: 'Exam Hall', description: 'Advanced mathematics competition' },
        { name: 'Cricket Tournament', category: 'Sports', type: 'Intra-School', minGrade: 8, maxGrade: 12, venue: 'Cricket Ground', description: 'Inter-house cricket matches' },
        { name: 'Theatre / Street Play', category: 'Performing Arts', type: 'Intra-School', minGrade: 9, maxGrade: 12, venue: 'Auditorium', description: 'Dramatic performances' },
        { name: 'Creative Writing Competition', category: 'Literary', type: 'Intra-School', minGrade: 7, maxGrade: 12, venue: 'Library', description: 'Essay and creative writing contest' },
        { name: 'Art Exhibition', category: 'Visual Arts', type: 'Intra-School', minGrade: 6, maxGrade: 12, venue: 'Art Gallery', description: 'Display of student artwork' },
        { name: 'Student Council Election', category: 'Leadership/Community', type: 'Intra-School', minGrade: 9, maxGrade: 12, venue: 'Assembly Hall', description: 'Democratic election process' },
        
        // INTER-SCHOOL EVENTS (Senior students)
        { name: 'Zonal Basketball Championship', category: 'Sports', type: 'Inter-School', minGrade: 9, maxGrade: 12, venue: 'DPS RK Puram', description: 'Inter-school basketball tournament' },
        { name: 'Inter-School Science Fair', category: 'Scientific', type: 'Inter-School', minGrade: 9, maxGrade: 12, venue: 'DPS Vasant Kunj', description: 'Multi-school science exhibition' },
        { name: 'Delhi State Debate Championship', category: 'Literary', type: 'Inter-School', minGrade: 10, maxGrade: 12, venue: 'Modern School', description: 'State-level debate competition' },
        { name: 'National Art Competition', category: 'Visual Arts', type: 'Inter-School', minGrade: 9, maxGrade: 12, venue: 'Lalit Kala Akademi', description: 'National level art contest' },
        { name: 'Inter-School Music Fest', category: 'Performing Arts', type: 'Inter-School', minGrade: 8, maxGrade: 12, venue: 'Kamani Auditorium', description: 'Multi-school music competition' },
        
        // ALL-GRADE EVENTS
        { name: 'Annual Sports Day', category: 'Sports', type: 'Intra-School', minGrade: 1, maxGrade: 12, venue: 'School Ground', description: 'Annual athletic meet for all classes' },
        { name: 'Annual Day Celebration', category: 'Performing Arts', type: 'Intra-School', minGrade: 1, maxGrade: 12, venue: 'Auditorium', description: 'Annual cultural program' },
        { name: 'Plantation Drive', category: 'Leadership/Community', type: 'Intra-School', minGrade: 4, maxGrade: 12, venue: 'School Campus', description: 'Tree plantation activity' },
        { name: 'Health Checkup Camp', category: 'Leadership/Community', type: 'Intra-School', minGrade: 1, maxGrade: 12, venue: 'School Clinic', description: 'Health awareness and checkup' },
    ];

    // Helper: Convert grade string to number (handles Nur, LKG, UKG, and numeric)
    const getGradeNum = (grade: string): number => {
        const gradeLower = grade.toLowerCase();
        if (gradeLower.includes('nur') || gradeLower === 'nursery') return 0;
        if (gradeLower.includes('lkg') || gradeLower === 'lower kindergarten') return 0;
        if (gradeLower.includes('ukg') || gradeLower === 'upper kindergarten') return 0;
        const match = grade.match(/(\d+)/);
        return match ? parseInt(match[1]) : 12;
    };

    // Helper: Get classes for a grade range
    const getClassesForGradeRange = (minGrade: number, maxGrade: number): SchoolClass[] => {
        return allocatedClasses.filter(c => {
            const gradeNum = getGradeNum(c.grade);
            return gradeNum >= minGrade && gradeNum <= maxGrade;
        });
    };

    // Generate events from templates
    const generatedEvents: SchoolEvent[] = [];
    let eventCounter = 1;
    const usedTeachers = new Set<string>(); // Track teachers already assigned as In-Charge
    const availableTeachers = [...allocatedTeachers].filter(t => t && t.id);

    // Shuffle teachers for random assignment
    const shuffledTeachers = [...availableTeachers].sort(() => 0.5 - seededRandom());

    // Generate events ensuring variety
    eventTemplates.forEach((template, idx) => {
        const targetClasses = getClassesForGradeRange(template.minGrade, template.maxGrade);
        if (targetClasses.length === 0) return; // Skip if no classes match

        // Find available teacher for In-Charge (prefer not already used)
        let headTeacher = shuffledTeachers.find(t => !usedTeachers.has(t.id));
        if (!headTeacher && shuffledTeachers.length > 0) {
            // If all teachers used, reuse but ensure variety
            headTeacher = shuffledTeachers[idx % shuffledTeachers.length];
        }
        if (!headTeacher) return; // Skip if no teachers available

        usedTeachers.add(headTeacher.id);

        // Add 1-3 staff members (different from In-Charge)
        const staffPool = shuffledTeachers.filter(t => t.id !== headTeacher.id);
        const numStaff = Math.min(Math.floor(seededRandom() * 3) + 1, staffPool.length);
        const selectedStaff = staffPool.slice(0, numStaff).map(t => ({
            teacherId: t.id,
            teacherName: t.name,
            role: ['Scoring', 'Discipline', 'Hospitality', 'Judging', 'Coordination'][Math.floor(seededRandom() * 5)]
        }));

        // Create event
        const eventDate = new Date(2024, 8 + (idx % 4), 15 + (idx % 15)); // Spread across Sep-Dec 2024
        const event: SchoolEvent = {
            id: `ev_${eventCounter++}`,
            name: template.name,
            category: template.category,
            type: template.type,
            date: eventDate.toISOString().split('T')[0],
            venue: template.venue,
            description: template.description,
            status: 'Completed',
            headTeacherId: headTeacher.id,
            headTeacherName: headTeacher.name,
            targetClassIds: targetClasses.map(c => c.id),
            staffRoles: selectedStaff,
            studentRoles: [],
            volunteers: []
        };

        generatedEvents.push(event);
    });

    // Assign students to events
    students.forEach(student => {
        if (!student.classId) return;
        const studentClass = allocatedClasses.find(c => c && c.id === student.classId);
        if (!studentClass) return;
        const studentGrade = getGradeNum(studentClass.grade);

        // Find events suitable for this student's grade
        const suitableEvents = generatedEvents.filter(ev => {
            const evClasses = allocatedClasses.filter(c => ev.targetClassIds.includes(c.id));
            return evClasses.some(c => {
                const grade = getGradeNum(c.grade);
                return grade === studentGrade || Math.abs(grade - studentGrade) <= 2; // Allow ±2 grades
            });
        });

        if (suitableEvents.length === 0) return;

        // Assign student to 1-3 events
        const numEvents = Math.floor(seededRandom() * 3) + 1;
        const selectedEvents = [...suitableEvents].sort(() => 0.5 - seededRandom()).slice(0, numEvents);

        selectedEvents.forEach((ev, evIdx) => {
            const marks = Array.isArray(student.examResults) && student.examResults.length > 0 
                ? student.examResults[0]?.totalPercentage || 0 
                : 0;

            // Determine if student participates or just volunteers
            // 70% participate, 30% volunteer only (to show exclusion)
            const participate = evIdx === 0 || seededRandom() < 0.7;

            if (participate) {
                // Student participates - assign result
                let achievement = '';
                let winChance = 0.1;

                if (ev.category === 'Scientific' || ev.category === 'Literary') {
                    if (marks > 90) winChance = 0.6;
                }
                if (ev.category === 'Sports') {
                    if (student.attendancePercentage < 85 && student.attendancePercentage > 70) winChance = 0.5;
                }

                if (seededRandom() < winChance) achievement = 'Winner (1st)';
                else if (seededRandom() < winChance + 0.1) achievement = 'Runner Up (2nd)';
                else if (seededRandom() < winChance + 0.2) achievement = 'Third Place';

                ev.studentRoles.push({
                    studentId: student.id,
                    studentName: student.name,
                    role: 'Participant',
                    specificDuty: 'Participant',
                    house: student.house,
                    achievement: achievement
                });

                // Add to Student Profile Activities
                if (!student.activities) student.activities = [];
                student.activities.push({
                    id: `act_${Date.now()}_${Math.floor(seededRandom() * 1000)}`,
                    name: ev.name,
                    date: ev.date,
                    category: ev.category,
                    type: ev.type,
                    hoursSpent: Math.floor(seededRandom() * 10) + 2,
                    achievement: achievement,
                    role: 'Participant'
                });
            } else {
                // Student volunteers but not selected (shows exclusion)
                ev.volunteers.push({
                    studentId: student.id,
                    studentName: student.name,
                    appliedDate: ev.date,
                    house: student.house
                });
            }
        });
    });

    events.push(...generatedEvents);

    // --- EXAM SCHEDULE GENERATION ---
    // Term End Exams March 2026
    const termEndSchedule: ExamSchedule = {
        id: 'sch_term_end_2026',
        title: 'Term End Examination 2025-26',
        startDate: '2026-03-02',
        endDate: '2026-03-25',
        status: 'Published',
        entries: []
    };

    // Generate for classes 9-12 (Senior Secondary context)
    const examClasses = allocatedClasses.filter(c => {
        const g = parseInt(c.grade);
        return !isNaN(g) && g >= 9;
    });

    examClasses.forEach(cls => {
        // Subjects excluding non-exam ones
        const subjects = cls.periodAllocation.map(p => p.subject).filter(s =>
            !['Library', 'Games', 'SUPW', 'Activity', 'Value Education', 'General Studies', 'Work Experience'].includes(s)
        );

        subjects.forEach((subj, idx) => {
            // Stagger exams
            // Start March 2nd 2026 (Monday).
            const date = new Date(2026, 2, 2 + (idx * 3)); // Every 3 days
            // Skip Sundays (0)
            if (date.getDay() === 0) date.setDate(date.getDate() + 1);

            const dateStr = date.toISOString().split('T')[0];

            termEndSchedule.entries.push({
                id: `entry_${cls.id}_${idx}`,
                date: dateStr,
                classId: cls.id,
                className: cls.name,
                subject: subj,
                startTime: '09:30 AM',
                durationMinutes: 180
            });
        });
    });

    schedules.push(termEndSchedule);

    return { students, classes: allocatedClasses, teachers: allocatedTeachers, classSessions: sessions, examSchedules: schedules, events, messages, polls, notices };
};

// --- DATA MIGRATION HELPER (CRITICAL FIX) ---
const migrateAndPatchData = (legacyData: ImportedSchoolData): ImportedSchoolData | null => {
    try {
        console.log("Starting Data Migration & Feature Patching...");

        // Validate input
        if (!legacyData || typeof legacyData !== 'object') {
            console.error("Invalid legacy data for migration");
            return null;
        }

        const data = { ...legacyData };

        // 1. Ensure new arrays exist with proper defaults
        if (!Array.isArray(data.notices)) data.notices = [];
        if (!Array.isArray(data.classSessions)) data.classSessions = [];
        if (!Array.isArray(data.messages)) data.messages = [];
        if (!Array.isArray(data.polls)) data.polls = [];
        if (!Array.isArray(data.students)) data.students = [];
        if (!Array.isArray(data.classes)) data.classes = [];
        if (!Array.isArray(data.teachers)) data.teachers = [];
        if (!Array.isArray(data.events)) data.events = [];
        if (!Array.isArray(data.examSchedules)) data.examSchedules = [];

        // 2. Backfill Logs (Fixes "Missing AI Analysis")
        if (data.classSessions.length === 0 && Array.isArray(data.classes) && data.classes.length > 0) {
            try {
                console.log("Backfilling Class Logs for AI...");
                const newSessions: ClassSession[] = [];
                data.classes.forEach((cls: SchoolClass) => {
                    try {
                        if (!cls || !cls.id) return;

                        const subjects = Array.isArray(cls.periodAllocation)
                            ? cls.periodAllocation.map((p: SubjectPeriodAllocation) => p?.subject).filter((s: string) => s && s !== 'Library' && s !== 'Games')
                            : ['General'];

                        if (subjects.length === 0) return;

                        for (let i = 1; i <= 5; i++) {
                            const date = new Date();
                            date.setDate(date.getDate() - (i * 2));
                            const subj = subjects[i % subjects.length] || 'General';

                            const absentees: string[] = [];
                            if (Array.isArray(cls.studentIds) && cls.studentIds.length > 0) {
                                const numAbsent = Math.floor(Math.random() * 3);
                                for (let k = 0; k < numAbsent; k++) {
                                    const randomId = cls.studentIds[Math.floor(Math.random() * cls.studentIds.length)];
                                    if (randomId) absentees.push(randomId);
                                }
                            }

                            // Use Real Topic Map if available
                            let topic = `Chapter ${i}: Introduction to ${subj}`;
                            const topicList = SYLLABUS_TOPICS[subj];
                            if (Array.isArray(topicList) && topicList.length > 0) {
                                topic = topicList[i % topicList.length];
                            }

                            newSessions.push({
                                id: `sess_mig_${cls.id}_${i}_${Date.now()}`,
                                classId: cls.id,
                                date: date.toISOString().split('T')[0],
                                subject: subj,
                                topic: topic,
                                absentStudentIds: [...new Set(absentees)]
                            });
                        }
                    } catch (clsErr) {
                        console.error(`Error processing class ${cls?.id} during migration:`, clsErr);
                        // Continue with next class
                    }
                });
                data.classSessions = newSessions;
            } catch (backfillErr) {
                console.error("Error backfilling class sessions:", backfillErr);
                // Continue migration even if backfill fails
            }
        }

        // 3. Backfill Event Targets (Fixes "Missing Opportunities")
        if (Array.isArray(data.events) && data.events.length > 0) {
            try {
                console.log("Backfilling Event Targets...");
                data.events = data.events.map((ev: SchoolEvent) => {
                    try {
                        if (!ev || !ev.id) return ev;

                        if (ev.status === 'Upcoming' && (!Array.isArray(ev.targetClassIds) || ev.targetClassIds.length === 0)) {
                            // Heuristic: If event name contains "Science", target Science classes
                            let targets: string[] = [];

                            if (Array.isArray(data.classes)) {
                                targets = data.classes.map((c: SchoolClass) => c?.id).filter((id: string) => id); // Default to All

                                if (ev.name && (ev.name.includes('Math') || ev.name.includes('Science'))) {
                                    const filtered = data.classes.filter((c: SchoolClass) => c?.name?.includes('B') || c?.section === 'B');
                                    targets = filtered.map((c: SchoolClass) => c?.id).filter((id: string) => id);
                                }
                            }

                            return { ...ev, targetClassIds: targets };
                        }
                        return ev;
                    } catch (evErr) {
                        console.error(`Error processing event ${ev?.id}:`, evErr);
                        return ev;
                    }
                });
            } catch (eventErr) {
                console.error("Error backfilling event targets:", eventErr);
                // Continue migration even if event backfill fails
            }
        }

        // 4. Backfill Exam Results (Fixes "Missing Academic Data")
        if (Array.isArray(data.students) && data.students.length > 0) {
            try {
                console.log("Backfilling Exam Results...");
                data.students = data.students.map((s: Student) => {
                    try {
                        if (!s || !s.id) return s;

                        if (!Array.isArray(s.examResults) || s.examResults.length === 0) {
                            // Determine subjects based on class or defaults
                            let subjects = ['English', 'Math', 'Science'];
                            if (s.classId && Array.isArray(data.classes)) {
                                const cls = data.classes.find((c: SchoolClass) => c?.id === s.classId);
                                if (cls && Array.isArray(cls.periodAllocation)) {
                                    subjects = cls.periodAllocation
                                        .map((p: SubjectPeriodAllocation) => p?.subject)
                                        .filter((sub: string) => sub && sub !== 'Library' && sub !== 'Games');
                                }
                            }

                            if (subjects.length === 0) subjects = ['English', 'Math', 'Science'];

                            const scores: ExamSubjectScore[] = subjects.map(sub => {
                                const score = Math.floor(Math.random() * 30) + 65;
                                return {
                                    subject: sub,
                                    score,
                                    maxScore: 100,
                                    grade: score >= 90 ? 'A1' : score >= 80 ? 'A2' : 'B1'
                                };
                            });

                            const totalScore = scores.reduce((acc, curr) => acc + (curr.score || 0), 0);
                            const maxTotal = scores.length * 100;
                            const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

                            return {
                                ...s,
                                examResults: [{
                                    id: `ex_mig_${s.id}_${Date.now()}`,
                                    examName: 'Half Yearly Examination 2024',
                                    date: '2024-09-20',
                                    subjects: scores,
                                    totalPercentage: percentage
                                }]
                            };
                        }
                        return s;
                    } catch (studentErr) {
                        console.error(`Error processing student ${s?.id}:`, studentErr);
                        return s;
                    }
                });
            } catch (examErr) {
                console.error("Error backfilling exam results:", examErr);
                // Continue migration even if exam backfill fails
            }
        }

        return data;
    } catch (err) {
        console.error("Critical error in data migration:", err);
        // Return null to trigger fallback to mock data generation
        return null;
    }
};

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
    const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [admissionSchema, setAdmissionSchema] = useState<AdmissionField[]>(DEFAULT_ADMISSION_SCHEMA);

    const [messages, setMessages] = useState<Message[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // PRIORITY 1: LOAD USER'S SAVED CHANGES (From Browser DB)
                let storedData = await loadFromDB('school_data_v10');

                // PRIORITY 2: MIGRATION (From Old Versions)
                if (!storedData) {
                    const legacyKeys = ['school_data_v9', 'school_data_v8'];
                    for (const key of legacyKeys) {
                        try {
                            const legacyData = await loadFromDB(key);
                            if (legacyData) {
                                storedData = migrateAndPatchData(legacyData);
                                if (storedData) {
                                    await saveToDB('school_data_v10', storedData);
                                }
                                break;
                            }
                        } catch (migrationErr) {
                            console.error(`Migration from ${key} failed:`, migrationErr);
                            // Continue to next legacy key
                        }
                    }
                }

                // PRIORITY 3: STATIC "GOLDEN RECORD" (If defined in code)
                // If the user has pasted data into staticData.ts, and no local changes exist, load that.
                if (!storedData && STATIC_SCHOOL_DATA) {
                    try {
                        console.log("Loading Static 'Golden Record' Data...");
                        storedData = STATIC_SCHOOL_DATA as unknown as ImportedSchoolData;
                    } catch (staticErr) {
                        console.error("Error loading static data:", staticErr);
                        storedData = null;
                    }
                }

                if (storedData) {
                    // Safely set all state with defaults
                    setStudents(Array.isArray(storedData.students) ? storedData.students : []);
                    setClasses(Array.isArray(storedData.classes) ? storedData.classes : []);
                    setTeachers(Array.isArray(storedData.teachers) ? storedData.teachers : []);
                    setClassSessions(Array.isArray(storedData.classSessions) ? storedData.classSessions : []);
                    setExamSchedules(Array.isArray(storedData.examSchedules) ? storedData.examSchedules : []);
                    setEvents(Array.isArray(storedData.events) ? storedData.events : []);
                    setAdmissionSchema(Array.isArray(storedData.admissionSchema) ? storedData.admissionSchema : DEFAULT_ADMISSION_SCHEMA);
                    setMessages(Array.isArray(storedData.messages) ? storedData.messages : []);
                    setPolls(Array.isArray(storedData.polls) ? storedData.polls : []);
                    setNotices(Array.isArray(storedData.notices) ? storedData.notices : []);

                    // Safely parse user from localStorage
                    try {
                        const savedUser = localStorage.getItem('scholastic_user');
                        if (savedUser) {
                            const parsedUser = JSON.parse(savedUser);
                            if (parsedUser && parsedUser.id && parsedUser.role) {
                                setCurrentUser(parsedUser);
                            }
                        }
                    } catch (userErr) {
                        console.error("Error parsing saved user:", userErr);
                        // Continue without user - they'll need to login again
                    }
                } else {
                    // PRIORITY 4: GENERATE RANDOM MOCK DATA (Fallback)
                    // Only runs if NO local storage AND NO static data file exists
                    console.log("No data found. Generating Random Mock Data...");
                    try {
                        const mock = generateMockData();
                        setStudents(mock.students || []);
                        setClasses(mock.classes || []);
                        setTeachers(mock.teachers || []);
                        setClassSessions(mock.classSessions || []);
                        setExamSchedules(mock.examSchedules || []);
                        setEvents(mock.events || []);
                        setMessages(mock.messages || []);
                        setPolls(mock.polls || []);
                        setNotices(mock.notices || []);
                    } catch (mockErr) {
                        console.error("Error generating mock data:", mockErr);
                        // Set empty arrays as last resort
                        setStudents([]);
                        setClasses([]);
                        setTeachers([]);
                        setClassSessions([]);
                        setExamSchedules([]);
                        setEvents([]);
                        setMessages([]);
                        setPolls([]);
                        setNotices([]);
                    }
                }
            } catch (err) {
                console.error("Critical error in loadData:", err);
                // Set defaults to prevent crash
                setStudents([]);
                setClasses([]);
                setTeachers([]);
                setClassSessions([]);
                setExamSchedules([]);
                setEvents([]);
                setAdmissionSchema(DEFAULT_ADMISSION_SCHEMA);
                setMessages([]);
                setPolls([]);
                setNotices([]);
            } finally {
                setInitialized(true);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (initialized) {
            // Wrap in try-catch to prevent save errors from crashing the app
            saveToDB('school_data_v10', {
                students, classes, teachers, classSessions, examSchedules, events, admissionSchema, messages, polls, notices
            }).catch(err => {
                console.error("Background save failed:", err);
                // Don't throw - app continues to function
            });
        }
    }, [students, classes, teachers, classSessions, examSchedules, events, admissionSchema, messages, polls, notices, initialized]);

    // Auth Methods
    const login = (userId: string): boolean => {
        try {
            if (!userId || typeof userId !== 'string') {
                console.warn("Invalid userId provided to login");
                return false;
            }

            let user: User | null = null;
            const normalizedUserId = userId.trim();

            if (normalizedUserId.toLowerCase() === 'admin') {
                user = { id: 'admin_1', name: 'Principal Admin', role: 'Admin' };
            } else if (normalizedUserId.startsWith('T-')) {
                const t = teachers.find(teacher => teacher.teacherCode === normalizedUserId);
                if (t) {
                    user = { id: t.id, name: t.name || 'Teacher', role: 'Teacher' };
                }
            } else if (normalizedUserId.startsWith('A-')) {
                const s = students.find(student => student.admissionNo === normalizedUserId);
                if (s) {
                    user = { id: s.id, name: s.name || 'Student', role: 'Student' };
                }
            }

            if (user) {
                try {
                    setCurrentUser(user);
                    localStorage.setItem('scholastic_user', JSON.stringify(user));
                    return true;
                } catch (storageErr) {
                    console.error("Error saving user to localStorage:", storageErr);
                    // Still set user in state even if localStorage fails
                    setCurrentUser(user);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("Login error:", err);
            return false;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('scholastic_user');
    };

    // CRUD Wrappers
    const addStudent = (student: Student) => setStudents(prev => [...prev, student]);
    const updateStudent = (updatedStudent: Student) => setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    const addClass = (newClass: SchoolClass) => setClasses(prev => sortClassesHelper([...prev, newClass]));
    const addTeacher = (teacher: Teacher) => setTeachers(prev => [...prev, teacher]);
    const updateTeacher = (updatedTeacher: Teacher) => setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    const addClassSession = (session: ClassSession) => setClassSessions(prev => [...prev, session]);

    const updateStudentClass = (studentId: string, classId: string) => {
        const cls = classes.find(c => c.id === classId);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId, className: cls ? cls.name : 'Unassigned' } : s));
        setClasses(prev => prev.map(c => {
            if (c.id === classId && !c.studentIds.includes(studentId)) {
                return { ...c, studentIds: [...c.studentIds, studentId] };
            }
            if (c.id !== classId && c.studentIds.includes(studentId)) {
                return { ...c, studentIds: c.studentIds.filter(id => id !== studentId) };
            }
            return c;
        }));
    };

    const assignTeacherToSubject = (classId: string, subjectName: string, teacherId: string) => {
        setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                return {
                    ...c,
                    periodAllocation: c.periodAllocation.map(p => {
                        if (p.subject === subjectName) return { ...p, assignedTeacherId: teacherId };
                        return p;
                    })
                };
            }
            return c;
        }));
    };

    const assignClassTeacher = (classId: string, teacherId: string) => {
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, classTeacherId: teacherId } : c));
    };

    const updateClassCurriculum = (classId: string, newAllocation: SubjectPeriodAllocation[], totalPeriods: number) => {
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, periodAllocation: newAllocation, totalPeriodsPerWeek: totalPeriods } : c));
    };

    const triggerAutoAllocation = () => {
        const { classes: newClasses, teachers: newTeachers } = autoAllocateWorkload(classes, teachers);
        setClasses(sortClassesHelper(newClasses));
        setTeachers(newTeachers);
    };

    const resetData = async () => {
        // FACTORY RESET: Clears ALL versions
        await clearDB();

        // RELOAD LOGIC:
        // If STATIC_SCHOOL_DATA exists, it will naturally take over on reload because local DB is now empty.
        // If not, it will fall back to Random Gen.
        window.location.reload();
    };

    const loadData = async (data: ImportedSchoolData) => {
        try {
            if (!data || typeof data !== 'object') {
                alert('❌ Invalid data file: Data is not an object.\n\nPlease ensure you are importing a valid JSON file exported from ScholasticAI.');
                return;
            }

            // Validate required fields
            if (!Array.isArray(data.students) || !Array.isArray(data.classes) || !Array.isArray(data.teachers)) {
                alert('❌ Invalid data file: Missing required arrays.\n\nRequired: students, classes, teachers\n\nPlease ensure you are importing a complete backup file.');
                return;
            }

            // Safely set all data with validation
            setStudents(Array.isArray(data.students) ? data.students : []);
            setClasses(Array.isArray(data.classes) ? data.classes : []);
            setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
            setClassSessions(Array.isArray(data.classSessions) ? data.classSessions : []);
            setExamSchedules(Array.isArray(data.examSchedules) ? data.examSchedules : []);
            setEvents(Array.isArray(data.events) ? data.events : []);
            setMessages(Array.isArray(data.messages) ? data.messages : []);
            setPolls(Array.isArray(data.polls) ? data.polls : []);
            setNotices(Array.isArray(data.notices) ? data.notices : []);

            if (Array.isArray(data.admissionSchema)) {
                setAdmissionSchema(data.admissionSchema);
            }

            // Try to save, but don't fail if save fails
            try {
                await saveToDB('school_data_v10', data);
                alert('✅ Data imported successfully!\n\nAll data has been loaded and saved to your browser storage.');
            } catch (saveErr) {
                console.error("Error saving imported data:", saveErr);
                alert('⚠️ Data imported but could not be saved to database.\n\nYour data is loaded but changes may be lost on refresh. Please try exporting again or contact support.');
            }
        } catch (err) {
            console.error("Error importing data:", err);
            alert('❌ Error importing data.\n\nPlease check:\n1. File is valid JSON format\n2. File was exported from ScholasticAI\n3. File is not corrupted\n\nError: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const createExamSchedule = (schedule: ExamSchedule) => setExamSchedules(prev => [...prev, schedule]);
    const addExamEntry = (scheduleId: string, entry: ExamEntry) => {
        setExamSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, entries: [...s.entries, entry] } : s));
    };
    const deleteExamSchedule = (id: string) => setExamSchedules(prev => prev.filter(s => s.id !== id));

    const addEvent = (event: SchoolEvent) => setEvents(prev => [...prev, event]);
    const updateEvent = (updatedEvent: SchoolEvent) => setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    const updateAdmissionSchema = (newSchema: AdmissionField[]) => setAdmissionSchema(newSchema);

    const sendMessage = (msg: Message) => setMessages(prev => [msg, ...prev]);
    const createPoll = (poll: Poll) => setPolls(prev => [poll, ...prev]);

    const votePoll = (pollId: string, optionId: string, userId: string) => {
        setPolls(prev => prev.map(poll => {
            if (poll.id === pollId && !poll.votedUserIds.includes(userId)) {
                return {
                    ...poll,
                    votedUserIds: [...poll.votedUserIds, userId],
                    options: poll.options.map(opt =>
                        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                    )
                };
            }
            return poll;
        }));
    };

    const addNotice = (notice: Notice) => setNotices(prev => [notice, ...prev]);
    const deleteNotice = (id: string) => setNotices(prev => prev.filter(n => n.id !== id));

    const issuePenaltyCard = (studentId: string, action: DisciplinaryAction) => {
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const currentActions = s.disciplinaryActions || [];
                return { ...s, disciplinaryActions: [action, ...currentActions] };
            }
            return s;
        }));
    };

    return (
        <SchoolContext.Provider value={{
            currentUser, login, logout,
            students, classes, teachers, classSessions, examSchedules, events, admissionSchema,
            messages, polls, notices,
            addStudent, updateStudent, addClass, updateStudentClass, addTeacher, updateTeacher, assignTeacherToSubject,
            updateClassCurriculum, assignClassTeacher, addClassSession, triggerAutoAllocation, resetData, loadData,
            createExamSchedule, addExamEntry, deleteExamSchedule, addEvent, updateEvent, updateAdmissionSchema,
            sendMessage, createPoll, votePoll, addNotice, deleteNotice, issuePenaltyCard
        }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};
