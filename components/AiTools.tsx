import React, { useState } from 'react';
import { Sparkles, FileText, Send, Copy, Check, BrainCircuit, Search } from 'lucide-react';
import { generateSchoolNotice, analyzeStudentFactors } from '../services/geminiService';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';

const AiTools: React.FC = () => {
  const { students, classSessions } = useSchool();
  const [activeTab, setActiveTab] = useState<'circular' | 'analysis'>('circular');
  
  // Notice Generator State
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Parents');
  const [generatedNotice, setGeneratedNotice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Analysis State
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerateNotice = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedNotice('');
    const result = await generateSchoolNotice(topic, audience);
    setGeneratedNotice(result);
    setIsGenerating(false);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNotice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAnalysis = async () => {
      if (!selectedStudent) return;
      setIsAnalyzing(true);
      // Get real data for this student
      const missedSessions = classSessions.filter(s => s.absentStudentIds.includes(selectedStudent.id));
      const activities = selectedStudent.activities || [];
      
      const result = await analyzeStudentFactors(selectedStudent, missedSessions, activities);
      setAnalysisResult(result);
      setIsAnalyzing(false);
  };

  const filteredStudents = studentSearch 
    ? students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNo.includes(studentSearch))
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Sparkles className="text-school-500" />
          AI Administrative Assistant
        </h2>
        <p className="text-gray-500 mt-2">Powered by Gemini. Draft notices, analyze results, and more.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('circular')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'circular' 
                ? 'bg-school-50 text-school-600 border-b-2 border-school-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} />
            Circular Generator
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'analysis' 
                ? 'bg-school-50 text-school-600 border-b-2 border-school-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BrainCircuit size={18} />
            Holistic Factor Analysis
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'circular' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">1. Notice Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Subject</label>
                  <input
                    type="text"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                    placeholder="e.g., Winter Vacation Dates, Annual Day"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-school-500 focus:outline-none"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  >
                    <option value="Parents">Parents</option>
                    <option value="Students (All)">Students (All)</option>
                    <option value="Senior Students (11-12)">Senior Students (11-12)</option>
                    <option value="Staff / Teachers">Staff / Teachers</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateNotice}
                  disabled={isGenerating || !topic}
                  className={`w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
                    isGenerating || !topic ? 'bg-gray-300 cursor-not-allowed' : 'bg-school-600 hover:bg-school-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isGenerating ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Drafting...
                    </>
                  ) : (
                    <>
                        <Sparkles size={18} />
                        Generate Draft
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 relative min-h-[300px]">
                <h3 className="font-semibold text-gray-800 mb-2">2. Generated Output</h3>
                {generatedNotice ? (
                  <>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-4 right-4 text-gray-500 hover:text-school-600 p-1 bg-white rounded shadow-sm border border-gray-200"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                    </button>
                    <div className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed bg-white p-4 rounded border border-gray-100 shadow-sm h-full">
                      {generatedNotice}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Send size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Enter details and click Generate</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
             <div className="grid md:grid-cols-12 gap-6 h-full">
                {/* Left Panel: Search */}
                <div className="md:col-span-4 border-r border-gray-100 pr-4 flex flex-col h-[500px]">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            className="w-full bg-white text-gray-900 pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-school-500 text-sm"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {filteredStudents.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setSelectedStudent(s); setAnalysisResult(''); }}
                                className={`w-full text-left p-3 rounded-lg text-sm border transition-colors ${
                                    selectedStudent?.id === s.id 
                                    ? 'bg-school-50 border-school-200 ring-1 ring-school-400' 
                                    : 'bg-white border-gray-100 hover:bg-gray-50'
                                }`}
                            >
                                <p className="font-semibold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.className} • {s.admissionNo}</p>
                            </button>
                        ))}
                        {studentSearch && filteredStudents.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-4">No match found.</p>
                        )}
                        {!studentSearch && !selectedStudent && (
                            <p className="text-center text-gray-400 text-sm py-10 px-4">Search and select a student to begin analysis.</p>
                        )}
                    </div>
                </div>

                {/* Right Panel: Analysis */}
                <div className="md:col-span-8 flex flex-col">
                    {selectedStudent ? (
                        <>
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                                    <p className="text-sm text-gray-500">Class {selectedStudent.className} • Attendance: {selectedStudent.attendancePercentage}%</p>
                                </div>
                                <button 
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing}
                                    className="bg-school-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-school-700 flex items-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Analyze Factors
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Data Snapshot Preview */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Recent Absences</p>
                                    <p className="text-2xl font-semibold text-gray-800">
                                        {classSessions.filter(s => s.absentStudentIds.includes(selectedStudent.id)).length}
                                        <span className="text-xs font-normal text-gray-500 ml-1">sessions</span>
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Activity Load</p>
                                    <p className="text-2xl font-semibold text-gray-800">
                                        {selectedStudent.activities?.reduce((acc, curr) => acc + curr.hoursSpent, 0) || 0}
                                        <span className="text-xs font-normal text-gray-500 ml-1">hours</span>
                                    </p>
                                </div>
                            </div>

                            {/* Result Area */}
                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-6 overflow-y-auto">
                                {analysisResult ? (
                                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-medium">
                                        {analysisResult}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <BrainCircuit size={48} className="mb-4 opacity-20" />
                                        <p>Click "Analyze Factors" to let AI find correlations.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <Sparkles size={64} className="mb-6 opacity-20" />
                            <p className="text-lg font-medium">Select a student from the list</p>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTools;