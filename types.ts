
export enum StudentStream {
  SCIENCE = 'Science',
  COMMERCE = 'Commerce',
  HUMANITIES = 'Humanities',
  GENERAL = 'General' // For junior classes
}

export type UserRole = 'Admin' | 'Teacher' | 'Student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string; // Optional for display
}

export interface CoCurricularActivity {
  id: string;
  name: string; // e.g., "Inter-school Debate", "Football Zonal"
  date: string;
  category: 'Sports' | 'Visual Arts' | 'Performing Arts' | 'Scientific' | 'Literary' | 'Leadership/Community';
  type?: 'Intra-School' | 'Inter-School'; // Added Scope
  hoursSpent: number; // To calculate time impact
  achievement?: string; // "Winner", "Participant", "Volunteer"
  role?: 'Participant' | 'Organizer/Volunteer';
}

export interface ClassSession {
  id: string;
  date: string;
  subject: string;
  topic: string; // The crucial "What was taught"
  classId: string; // e.g. "12-A"
  absentStudentIds: string[]; // Who missed this specific topic
}

export interface ExamSubjectScore {
  subject: string;
  score: number;
  maxScore: number;
  grade?: string; // A1, B1 etc
}

export interface ExamResult {
  id: string;
  examName: string; // e.g. "Unit Test 1", "Half Yearly"
  date: string;
  subjects: ExamSubjectScore[];
  totalPercentage: number;
}

// --- DISCIPLINARY SYSTEM ---
export interface DisciplinaryAction {
  id: string;
  date: string;
  type: 'Yellow' | 'Pink' | 'Red';
  reason: string;
  issuedBy: string; // Teacher Name
  penaltyPoints: number; // -1, -2, -3
}

// --- DYNAMIC ADMISSION FORM TYPES ---
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

export interface AdmissionField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // Comma separated options for 'select'
  required: boolean;
  isSystem: boolean; // System fields cannot be deleted (Name, AdmNo)
  section: 'Personal' | 'Parent' | 'Academic' | 'Other';
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  classId?: string; // Link to SchoolClass
  className?: string; // e.g. "12-A" (Cached for display)
  stream?: StudentStream;
  guardianName: string; // Primary guardian (usually Father)
  contactNo: string;
  feesStatus: 'Paid' | 'Pending' | 'Overdue';
  attendancePercentage: number;
  house?: 'Red' | 'Blue' | 'Green' | 'Yellow'; // ADDED HOUSE
  examResults: ExamResult[]; // Detailed exam history
  activities?: CoCurricularActivity[];
  disciplinaryActions: DisciplinaryAction[]; // NEW: Manual Penalty Cards
  joiningDate: string;

  // Dynamic fields storage
  customDetails?: Record<string, string>; // e.g. { "religion": "Hindu", "address": "Delhi..." }

  // Standard fields that were previously hardcoded, now part of schema but specific props kept for backward compat
  dob?: string;
  gender?: string;
  motherName?: string;
  address?: string;
}

export interface Workload {
  classId: string;
  className: string;
  subject: string;
  periods: number; // Periods per week
}

export interface Teacher {
  id: string;
  teacherCode: string; // NEW: Login ID (e.g., T-7001)
  name: string;
  qualification: string;
  mainSubject: string; // Primary expertise
  workload: Workload[]; // Classes they teach
  isClassTeacher: boolean;
  classTeacherOf?: string; // Class ID
  joiningDate: string;
  contactNo: string;
  // HOUSE SYSTEM UPDATES
  house?: 'Red' | 'Blue' | 'Green' | 'Yellow';
  isHouseMaster?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  audience: 'All' | 'Parents' | 'Staff' | 'Students';
  postedBy?: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  trend?: number; // percentage change
  trendDirection?: 'up' | 'down';
  iconName: string;
}

// --- CLASS MANAGEMENT TYPES ---

export interface SubjectPeriodAllocation {
  subject: string;
  periods: number; // Periods per week (out of 40)
  assignedTeacherId?: string;
  assignedTeacherName?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "10-A"
  grade: string; // e.g. "10"
  section: string; // e.g. "A"
  classTeacherId?: string;
  studentIds: string[]; // List of students in this class
  periodAllocation: SubjectPeriodAllocation[]; // The curriculum definition
  totalPeriodsPerWeek: number; // e.g., 40 for seniors, 35 for juniors
}

// --- EVENT MODULE TYPES ---

export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface EventStaffRole {
  teacherId: string;
  teacherName: string;
  role: string; // e.g., "Hospitality", "Scoring", "Discipline"
}

export interface EventStudentRole {
  studentId: string;
  studentName: string;
  role: 'Participant' | 'Organizer/Volunteer';
  status: 'volunteered' | 'participant'; // NEW: Tracks volunteer vs selected participant
  specificDuty?: string; // e.g., "Stage Decoration" or "Debate Team A"
  house?: string;
  achievement?: string; // e.g., "1st Position"
  appliedDate?: string; // NEW: When student volunteered
}

export interface EventNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  targetId: string; // ID of student/teacher or event ID
  targetName: string; // Name of student/teacher or "Event Note"
  targetType: 'student' | 'staff' | 'event';
  comment: string;
  date: string;
}

export interface SchoolEvent {
  id: string;
  name: string;
  category: 'Sports' | 'Visual Arts' | 'Performing Arts' | 'Scientific' | 'Literary' | 'Leadership/Community';
  type: 'Intra-School' | 'Inter-School'; // NEW: Scope of event
  date: string;
  venue: string; // If Inter-School, this is the Host School Name
  description: string;
  status: EventStatus;
  headTeacherId: string; // The "Teacher I/C"
  headTeacherName: string;
  targetClassIds: string[]; // IDs of classes eligible for this event (e.g. ['c_10_A', 'c_10_B'])
  staffRoles: EventStaffRole[];
  studentRoles: EventStudentRole[];
  notes: EventNote[]; // NEW: Comments/appreciation for students/staff
  galleryImages?: string[]; // placeholder for image URLs
  hoursSpent?: number; // NEW: Default hours for activity sync
}

// --- EXAM SCHEDULE / DATE SHEET TYPES ---

export interface ExamEntry {
  id: string;
  date: string;
  classId: string;
  className: string;
  subject: string;
  startTime: string; // e.g. "09:00 AM"
  durationMinutes: number; // e.g. 180
}

export interface ExamSchedule {
  id: string;
  title: string; // e.g. "Final Term Examination 2024-25"
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Published' | 'Completed';
  entries: ExamEntry[];
}

// --- COMMUNITY / COMMUNICATION MODULE TYPES ---

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientIds: string[]; // List of user IDs (can be single or multiple)
  recipientGroupLabel?: string; // e.g. "Class 12-A" or "All Staff"
  subject: string;
  content: string;
  timestamp: string;
  readBy: string[]; // List of user IDs who have read it
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  creatorId: string;
  creatorName: string;
  targetAudience: string; // "All", "Staff", "Student", "Class 12-A"
  options: PollOption[];
  votedUserIds: string[]; // Who has voted
  status: 'Active' | 'Closed';
  createdAt: string;
}

export interface SchoolContextType {
  currentUser: User | null;
  login: (userId: string) => boolean; // Updated to return success status
  logout: () => void;

  students: Student[];
  classes: SchoolClass[];
  teachers: Teacher[];
  classSessions: ClassSession[];
  examSchedules: ExamSchedule[];
  events: SchoolEvent[];
  admissionSchema: AdmissionField[];

  // Community Data
  messages: Message[];
  polls: Poll[];

  // Notice Data
  notices: Notice[];

  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  addClass: (newClass: SchoolClass) => void;
  updateStudentClass: (studentId: string, classId: string) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (teacher: Teacher) => void;
  assignTeacherToSubject: (classId: string, subjectName: string, teacherId: string) => void;
  updateClassCurriculum: (classId: string, newAllocation: SubjectPeriodAllocation[], totalPeriods: number) => void;
  assignClassTeacher: (classId: string, teacherId: string) => void;
  addClassSession: (session: ClassSession) => void;
  triggerAutoAllocation: () => void;
  resetData: () => void;
  loadData: (data: any) => void; // IMPORT FEATURE
  // Exam Schedule methods
  createExamSchedule: (schedule: ExamSchedule) => void;
  addExamEntry: (scheduleId: string, entry: ExamEntry) => void;
  deleteExamSchedule: (id: string) => void;
  // Events
  addEvent: (event: SchoolEvent) => void;
  updateEvent: (event: SchoolEvent) => void; // ADDED THIS
  addEventNote: (eventId: string, note: EventNote) => void; // NEW
  deleteEventNote: (eventId: string, noteId: string) => void; // NEW
  syncEventToActivities: (eventId: string) => void; // NEW
  // Form Config
  updateAdmissionSchema: (newSchema: AdmissionField[]) => void;

  // Community Methods
  sendMessage: (msg: Message) => void;
  createPoll: (poll: Poll) => void;
  votePoll: (pollId: string, optionId: string, userId: string) => void;

  // Notice Methods
  addNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;

  // Discipline Methods
  issuePenaltyCard: (studentId: string, action: DisciplinaryAction) => void;
}
