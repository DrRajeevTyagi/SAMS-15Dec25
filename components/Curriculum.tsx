import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SubjectPeriodAllocation } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Save, AlertTriangle, Plus, Trash2, Copy, ArrowRight } from 'lucide-react';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

const Curriculum: React.FC = () => {
  const { classes, updateClassCurriculum } = useSchool();

  // Sort classes 12 -> Nur for display consistency
  const sortedClasses = useMemo(() => {
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
  }, [classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>(sortedClasses[0]?.id || '');
  const [allocation, setAllocation] = useState<SubjectPeriodAllocation[]>([]);
  const [totalPeriodsTarget, setTotalPeriodsTarget] = useState<number>(40);
  const [newSubject, setNewSubject] = useState('');
  const [newPeriods, setNewPeriods] = useState('1');
  const [isDirty, setIsDirty] = useState(false);
  
  // Copy Logic State
  const [copySourceClassId, setCopySourceClassId] = useState('');

  // Update selection if classes load late
  useEffect(() => {
    if (!selectedClassId && sortedClasses.length > 0) {
        setSelectedClassId(sortedClasses[0].id);
    }
  }, [sortedClasses, selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        // Deep copy to prevent reference issues
        setAllocation(cls.periodAllocation.map(item => ({ ...item })));
        setTotalPeriodsTarget(cls.totalPeriodsPerWeek || 40);
        setIsDirty(false);
        setCopySourceClassId('');
      }
    }
  }, [selectedClassId, classes]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const currentTotal = allocation.reduce((sum, item) => sum + item.periods, 0);
  const isValid = currentTotal === totalPeriodsTarget;

  const handleUpdatePeriod = (index: number, val: string) => {
    const newVal = parseInt(val) || 0;
    const updated = allocation.map((item, i) => 
        i === index ? { ...item, periods: newVal } : item
    );
    setAllocation(updated);
    setIsDirty(true);
  };

  const handleUpdateSubjectName = (index: number, val: string) => {
    const updated = allocation.map((item, i) => 
        i === index ? { ...item, subject: val } : item
    );
    setAllocation(updated);
    setIsDirty(true);
  };

  const handleDeleteSubject = (index: number) => {
    const updated = allocation.filter((_, i) => i !== index);
    setAllocation(updated);
    setIsDirty(true);
  };

  const handleAddSubject = () => {
    if (!newSubject) return;
    setAllocation([...allocation, { subject: newSubject, periods: parseInt(newPeriods) }]);
    setNewSubject('');
    setNewPeriods('1');
    setIsDirty(true);
  };

  const handleSave = () => {
    if (selectedClassId) {
        updateClassCurriculum(selectedClassId, allocation, totalPeriodsTarget);
        setIsDirty(false);
    }
  };

  const handleCopyCurriculum = () => {
      const sourceClass = classes.find(c => c.id === copySourceClassId);
      if (sourceClass) {
          const confirmCopy = window.confirm(`Replace curriculum of ${selectedClass?.name} with ${sourceClass.name}?`);
          if (confirmCopy) {
            // Deep copy
            setAllocation(sourceClass.periodAllocation.map(item => ({ ...item })));
            setTotalPeriodsTarget(sourceClass.totalPeriodsPerWeek);
            setIsDirty(true);
          }
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Curriculum & Period Distribution</h2>
          <p className="text-gray-500">Manage subject allocation per week</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
             <select 
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500 w-full md:w-auto"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
             >
                {sortedClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
             </select>
             <button 
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isDirty 
                    ? 'bg-school-600 text-white hover:bg-school-700 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
             >
                <Save size={18} /> Save Changes
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table Editor */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Total Periods/Week:</label>
                    <input 
                        type="number" 
                        className="w-20 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-school-500"
                        value={totalPeriodsTarget}
                        onChange={(e) => { setTotalPeriodsTarget(parseInt(e.target.value) || 0); setIsDirty(true); }}
                    />
                </div>
                
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm text-gray-500 flex items-center gap-1"><Copy size={14}/> Copy from:</span>
                    <select 
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-school-500 flex-1 md:w-40"
                        value={copySourceClassId}
                        onChange={(e) => setCopySourceClassId(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {sortedClasses.filter(c => c.id !== selectedClassId).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleCopyCurriculum}
                        disabled={!copySourceClassId}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 disabled:opacity-50"
                    >
                        Apply
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Subject Allocation</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left w-1/2">Subject</th>
                                <th className="px-4 py-3 text-center">Periods / Week</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allocation.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 group">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                         <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-school-500 bg-white"
                                            value={item.subject}
                                            onChange={(e) => handleUpdateSubjectName(idx, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-school-500 bg-white"
                                            value={item.periods}
                                            onChange={(e) => handleUpdatePeriod(idx, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleDeleteSubject(idx)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Subject"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                            <tr>
                                <td className="px-4 py-3">TOTAL</td>
                                <td className={`px-4 py-3 text-center ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {currentTotal} / {totalPeriodsTarget}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Add Subject Row */}
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                    <input 
                        type="text" 
                        placeholder="New Subject..." 
                        className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                    />
                    <input 
                        type="number" 
                        className="w-20 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                        value={newPeriods}
                        onChange={(e) => setNewPeriods(e.target.value)}
                    />
                    <button 
                        onClick={handleAddSubject}
                        className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-black transition-colors"
                        title="Add Subject"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                
                {!isValid && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Total periods must sum to exactly {totalPeriodsTarget}. You are {currentTotal > totalPeriodsTarget ? 'over' : 'under'} by {Math.abs(totalPeriodsTarget - currentTotal)}.
                    </div>
                )}
            </div>
        </div>

        {/* Right: Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Visual Breakdown</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={allocation as any[]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="periods"
                            nameKey="subject"
                        >
                            {allocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                {allocation.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-gray-600">{item.subject}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.periods}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;