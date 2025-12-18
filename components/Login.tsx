import React, { useState } from 'react';
import { ShieldCheck, User, GraduationCap, School, LogIn, Key } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const Login: React.FC = () => {
    const { login, students, teachers } = useSchool();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState(''); // Visual only
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setError("Please enter a User ID");
            return;
        }
        const success = login(userId);
        if (!success) {
            setError("Invalid User ID. Please check the ID and try again.");
        }
    };

    // --- SMART DEMO CREDENTIAL PICKER ---
    // Student: Prefer Class 11/12 for showing senior features (Streams, etc)
    const demoStudent = students.find(s => s.className && (s.className.startsWith('11') || s.className.startsWith('12'))) || students[0];

    // Teacher: Prefer a Class Teacher who is also a House Master (Power User)
    const demoTeacher = teachers.find(t => t.isClassTeacher && t.isHouseMaster) || teachers.find(t => t.isClassTeacher) || teachers[0];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-school-900 mb-2 flex items-center justify-center gap-2">
                    <School size={40} /> ScholasticAI
                </h1>
                <p className="text-gray-500">Holistic School Intelligence System</p>
                <p className="text-xs text-gray-400 mt-1">Designed by Rajeev with ❤️ for education</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl grid md:grid-cols-2 gap-8">
                {/* Left Side: Branding / Info */}
                <div className="bg-gradient-to-br from-school-800 to-school-600 rounded-xl p-8 text-white flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-school-100 leading-relaxed">
                            Access your personalized dashboard to manage academic records, track holistic progress, and generate AI-driven insights.
                        </p>
                    </div>
                    <div className="mt-8">
                        <h3 className="font-bold border-b border-school-500 pb-2 mb-3 text-sm uppercase tracking-wide opacity-80">Demo Credentials (Copy ID)</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20" onClick={() => setUserId('admin')}>
                                <span className="flex items-center gap-2"><ShieldCheck size={16} /> Admin</span>
                                <code className="font-mono bg-black/20 px-2 py-0.5 rounded">admin</code>
                            </div>
                            {demoTeacher && (
                                <div className="flex items-center justify-between bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20" onClick={() => setUserId(demoTeacher.teacherCode)}>
                                    <span className="flex items-center gap-2"><User size={16} /> Teacher</span>
                                    <code className="font-mono bg-black/20 px-2 py-0.5 rounded">{demoTeacher.teacherCode}</code>
                                </div>
                            )}
                            {demoStudent && (
                                <div className="flex items-center justify-between bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20" onClick={() => setUserId(demoStudent.admissionNo)}>
                                    <span className="flex items-center gap-2"><GraduationCap size={16} /> Student ({demoStudent.className})</span>
                                    <code className="font-mono bg-black/20 px-2 py-0.5 rounded">{demoStudent.admissionNo}</code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Login to Portal</h3>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User ID / Admission No</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-school-500 text-gray-900 font-medium"
                                    placeholder="e.g. A-2025001 or T-7001"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-school-500 text-gray-900"
                                    placeholder="Leave blank for demo"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-school-600 text-white font-bold py-3 rounded-lg hover:bg-school-700 transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <LogIn size={20} /> Login
                        </button>
                    </form>

                    <p className="mt-6 text-xs text-center text-gray-400">
                        Hover over any Name in the lists to see their Login ID.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;