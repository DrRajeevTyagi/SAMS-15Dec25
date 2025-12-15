import React, { useState } from 'react';
import { Database, Download, RefreshCw, AlertTriangle, CheckCircle, Server, ShieldAlert, FileText, Plus, Trash2, Upload, Code, Copy } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { AdmissionField, FieldType } from '../types';

const Settings: React.FC = () => {
  const { students, classes, teachers, classSessions, resetData, admissionSchema, updateAdmissionSchema, loadData, examSchedules, events, messages, polls, notices } = useSchool();
  const [backupStatus, setBackupStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'data' | 'form'>('data');

  // Form Config State
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldSection, setNewFieldSection] = useState<'Personal' | 'Parent' | 'Academic' | 'Other'>('Other');

  const handleBackup = () => {
    const data = {
        timestamp: new Date().toISOString(),
        students,
        classes,
        teachers,
        classSessions,
        examSchedules,
        events,
        messages,
        polls,
        notices,
        admissionSchema
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScholasticAI_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setBackupStatus('Backup downloaded successfully!');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleCopyForCodebase = () => {
      const data = {
        students,
        classes,
        teachers,
        classSessions,
        examSchedules,
        events,
        messages,
        polls,
        notices,
        admissionSchema
    };

    const textToCopy = `export const STATIC_SCHOOL_DATA = ${JSON.stringify(data, null, 2)};`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        setBackupStatus('Copied to Clipboard! Paste this into src/data/staticData.ts');
        setTimeout(() => setBackupStatus(''), 5000);
    }).catch(() => {
        alert("Failed to copy. Please use the Download JSON option instead.");
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (window.confirm("This will overwrite all current data with the imported file. Continue?")) {
                  loadData(json);
              }
          } catch (err) {
              alert("Failed to parse JSON file.");
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  const handleAddField = () => {
      if (!newFieldLabel) return;
      const newField: AdmissionField = {
          id: `field_${Date.now()}`,
          label: newFieldLabel,
          type: newFieldType,
          required: false,
          isSystem: false,
          section: newFieldSection,
          options: newFieldType === 'select' ? ['Option 1', 'Option 2'] : undefined
      };
      updateAdmissionSchema([...admissionSchema, newField]);
      setNewFieldLabel('');
  };

  const handleDeleteField = (id: string) => {
      updateAdmissionSchema(admissionSchema.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-school-100 rounded-lg text-school-600">
            <Server size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
            <p className="text-gray-500">Manage application storage, backups, and configurations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-3 font-medium text-sm transition-colors ${activeTab === 'data' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                  Data Management
              </button>
              <button 
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 font-medium text-sm transition-colors ${activeTab === 'form' ? 'bg-school-50 text-school-700 border-b-2 border-school-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                  Admission Form Config
              </button>
          </div>

          <div className="p-6">
            {activeTab === 'data' && (
                <div className="space-y-6">
                    {/* Stats Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Database size={20} className="text-gray-500"/> Storage Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Students</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Classes</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Staff</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-3xl font-bold text-gray-900">{classSessions.length}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Logs</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Backup Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Download size={20} className="text-green-600"/> Backup & Migration
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Save your data. "Export" creates a file. "Copy for Codebase" generates the code to make your data permanent for everyone.
                            </p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={handleBackup}
                                    className="w-full py-3 bg-school-50 border border-school-200 text-school-700 font-semibold rounded-lg hover:bg-school-100 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Download size={18} /> Export Data File (JSON)
                                </button>
                                
                                <button 
                                    onClick={handleCopyForCodebase}
                                    className="w-full py-3 bg-purple-50 border border-purple-200 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Code size={18} /> Copy Data for Codebase
                                </button>

                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept=".json"
                                        onChange={handleImport}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="w-full py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                                        <Upload size={18} /> Import Data File
                                    </button>
                                </div>
                            </div>

                            {backupStatus && (
                                <p className="mt-3 text-sm text-green-600 flex items-center gap-2 justify-center font-bold">
                                    <CheckCircle size={14} /> {backupStatus}
                                </p>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldAlert size={100} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                                <AlertTriangle size={20}/> Danger Zone
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Resetting the application will <strong>permanently delete</strong> all local data. If you have defined "Static Data" in the code, it will revert to that.
                            </p>
                            <button 
                                onClick={resetData}
                                className="w-full py-3 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCw size={18} /> Factory Reset App
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'form' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-school-600"/> Admission Form Builder
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Customize the fields required during student admission.</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3 text-sm">Add New Field</h4>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="Field Label (e.g. Religion, Blood Group)" 
                                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                value={newFieldLabel}
                                onChange={(e) => setNewFieldLabel(e.target.value)}
                            />
                            <select 
                                className="bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                            >
                                <option value="text">Text Input</option>
                                <option value="number">Number</option>
                                <option value="date">Date Picker</option>
                                <option value="select">Dropdown</option>
                                <option value="textarea">Long Text</option>
                            </select>
                            <select 
                                className="bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-500"
                                value={newFieldSection}
                                onChange={(e) => setNewFieldSection(e.target.value as any)}
                            >
                                <option value="Personal">Personal Details</option>
                                <option value="Parent">Parent Details</option>
                                <option value="Academic">Academic Details</option>
                                <option value="Other">Other</option>
                            </select>
                            <button 
                                onClick={handleAddField}
                                className="bg-school-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-school-700 flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Field
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {['Personal', 'Academic', 'Parent', 'Other'].map(section => {
                            const fields = admissionSchema.filter(f => f.section === section);
                            if (fields.length === 0) return null;
                            
                            return (
                                <div key={section} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <h4 className="font-bold text-gray-600 text-sm uppercase">{section} Section</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {fields.map(field => (
                                            <div key={field.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${field.isSystem ? 'bg-gray-200 text-gray-500' : 'bg-school-100 text-school-600'}`}>
                                                        {field.type.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{field.label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {field.isSystem ? 'System Field (Locked)' : `Custom ${field.type} field`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!field.isSystem && (
                                                    <button 
                                                        onClick={() => handleDeleteField(field.id)}
                                                        className="text-red-400 hover:text-red-600 p-2"
                                                        title="Delete Field"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                {field.isSystem && (
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Required</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Settings;
