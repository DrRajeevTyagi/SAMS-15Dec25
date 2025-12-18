
import React from 'react';
import { LayoutDashboard, Users, GraduationCap, FileText, Settings, Sparkles, Trophy, Building2, Briefcase, Flag, LogOut, User, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useSchool();

  if (!currentUser) return null;

  // Define all possible items
  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Admin', 'Teacher', 'Student'] },
    { name: 'My Profile', icon: User, path: `/my-profile`, roles: ['Teacher'] }, // NEW: Teacher Profile
    { name: 'My Profile', icon: GraduationCap, path: `/students/${currentUser.id}`, roles: ['Student'] }, // Existing Student Profile
    { name: 'Academic Console', icon: Building2, path: '/admin-console', roles: ['Admin'] },
    { name: 'Community', icon: MessageSquare, path: '/community', roles: ['Admin', 'Teacher', 'Student'] }, // NEW: Community
    { name: 'Students', icon: Users, path: '/students', roles: ['Admin', 'Teacher'] },
    { name: 'Staff Directory', icon: Briefcase, path: '/staff', roles: ['Admin', 'Teacher'] },
    { name: 'House System', icon: Flag, path: '/houses', roles: ['Admin', 'Teacher', 'Student'] },
    { name: 'Daily Class Logs', icon: GraduationCap, path: '/academics', roles: ['Admin', 'Teacher'] },
    { name: 'Events', icon: Trophy, path: '/events', roles: ['Admin', 'Teacher', 'Student'] },
    { name: 'AI Assistant', icon: Sparkles, path: '/ai-tools', roles: ['Admin', 'Teacher'] },
    { name: 'Circulars', icon: FileText, path: '/circulars', roles: ['Admin', 'Teacher', 'Student'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['Admin'] },
  ];

  // Filter based on Role
  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="h-screen w-64 bg-school-900 text-white flex flex-col fixed left-0 top-0 overflow-y-auto z-20">
      <div className="p-6 border-b border-school-800">
        <h1 className="text-2xl font-bold tracking-tight">ScholasticAI</h1>
        <p className="text-xs text-school-100 mt-1 opacity-70">Holistic School Intelligence</p>
        <p className="text-[10px] text-school-100 mt-0.5 opacity-50">Designed by Rajeev with ❤️ for education</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && item.path !== '/' || location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-school-600 text-white shadow-md'
                  : 'text-school-100 hover:bg-school-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-school-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-school-900 ${currentUser.role === 'Admin' ? 'bg-red-200' : currentUser.role === 'Teacher' ? 'bg-blue-200' : 'bg-green-200'
            }`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{currentUser.name}</span>
            <span className="text-xs text-school-200">{currentUser.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-school-800 hover:bg-school-700 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
