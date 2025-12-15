
import React, { useState, useMemo } from 'react';
import { MessageSquare, BarChart2, Plus, Send, CheckCircle, Users, Mail, Vote, Clock } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Message, Poll, PollOption } from '../types';

const Community: React.FC = () => {
  const { currentUser, messages, polls, sendMessage, createPoll, votePoll, classes, teachers, students } = useSchool();
  const [activeTab, setActiveTab] = useState<'inbox' | 'polls'>('inbox');
  
  // MESSAGING STATE
  const [messageFilter, setMessageFilter] = useState<'received' | 'sent'>('received');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ subject: '', content: '' });
  
  // Compose Target State
  const [targetType, setTargetType] = useState<'Individual' | 'Group' | 'Class'>('Individual');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]); // For grid

  // POLL STATE
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollData, setPollData] = useState({ question: '', targetAudience: 'All' });
  const [pollOptions, setPollOptions] = useState(['Yes', 'No']);

  if (!currentUser) return null;
  const isStudent = currentUser.role === 'Student';

  // --- MESSAGING LOGIC ---

  // Filter messages
  const displayedMessages = useMemo(() => {
      if (messageFilter === 'received') {
          return messages.filter(m => 
              m.recipientIds.includes(currentUser.id) || 
              m.recipientIds.includes('ALL_USERS') ||
              (m.recipientGroupLabel && m.recipientGroupLabel.includes('All Staff') && currentUser.role === 'Teacher') ||
              (m.recipientGroupLabel && m.recipientGroupLabel.includes('All Students') && currentUser.role === 'Student')
          );
      } else {
          return messages.filter(m => m.senderId === currentUser.id);
      }
  }, [messages, messageFilter, currentUser]);

  const handleSendMessage = () => {
      if (!composeData.subject || !composeData.content) return;

      let recipients: string[] = [];
      let groupLabel = '';

      if (isStudent) {
          // Students can only send to specific Teacher/Admin
          if (!selectedRecipientId) return;
          recipients = [selectedRecipientId];
          const r = teachers.find(t => t.id === selectedRecipientId) || { name: 'Admin' };
          groupLabel = r.name; // Display name
      } else {
          // Admin/Teacher Logic
          if (targetType === 'Individual') {
              if (!selectedRecipientId) return;
              recipients = [selectedRecipientId];
          } else if (targetType === 'Group') {
              if (selectedGroup === 'ALL_USERS') {
                  recipients = ['ALL_USERS'];
                  groupLabel = 'Everyone';
              } else if (selectedGroup === 'STAFF') {
                  recipients = teachers.map(t => t.id); // In real app, use logical group ID
                  groupLabel = 'All Staff';
              }
          } else if (targetType === 'Class') {
              if (selectedClassIds.length === 0) return;
              // Add all students from selected classes
              classes.filter(c => selectedClassIds.includes(c.id)).forEach(c => {
                  recipients.push(...c.studentIds);
              });
              groupLabel = `Students of ${selectedClassIds.length} Class(es)`;
          }
      }

      const newMessage: Message = {
          id: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          recipientIds: recipients,
          recipientGroupLabel: groupLabel,
          subject: composeData.subject,
          content: composeData.content,
          timestamp: new Date().toISOString(),
          readBy: []
      };

      sendMessage(newMessage);
      setShowCompose(false);
      setComposeData({ subject: '', content: '' });
      setSelectedClassIds([]);
      setSelectedRecipientId('');
  };

  // --- POLL LOGIC ---
  const displayedPolls = useMemo(() => {
      return polls.filter(p => {
          if (p.targetAudience === 'All') return true;
          if (p.targetAudience === 'Staff' && (currentUser.role === 'Teacher' || currentUser.role === 'Admin')) return true;
          if (p.targetAudience === 'Students' && currentUser.role === 'Student') return true;
          return false;
      });
  }, [polls, currentUser]);

  const handleCreatePoll = () => {
      if (!pollData.question || pollOptions.some(o => !o.trim())) return;

      const newPoll: Poll = {
          id: `poll_${Date.now()}`,
          question: pollData.question,
          creatorId: currentUser.id,
          creatorName: currentUser.name,
          targetAudience: pollData.targetAudience,
          options: pollOptions.map((opt, i) => ({ id: `opt_${i}`, label: opt, votes: 0 })),
          votedUserIds: [],
          status: 'Active',
          createdAt: new Date().toISOString()
      };
      
      createPoll(newPoll);
      setShowCreatePoll(false);
      setPollData({ question: '', targetAudience: 'All' });
      setPollOptions(['Yes', 'No']);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Hub</h2>
          <p className="text-gray-500">Connect, communicate, and collaborate.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {/* TABS */}
        <div className="flex border-b border-gray-200 shrink-0">
            <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'inbox' ? 'border-school-600 text-school-700 bg-school-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
                <Mail size={18} /> Communication
            </button>
            <button
                onClick={() => setActiveTab('polls')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'polls' ? 'border-school-600 text-school-700 bg-school-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
                <BarChart2 size={18} /> Collective Knowledge (Polls)
            </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden p-6 bg-gray-50">
            
            {/* --- INBOX TAB --- */}
            {activeTab === 'inbox' && (
                <div className="flex h-full gap-6">
                    {/* Left: Message List */}
                    <div className="w-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => setMessageFilter('received')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${messageFilter === 'received' ? 'bg-school-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Inbox
                                </button>
                                <button 
                                    onClick={() => setMessageFilter('sent')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${messageFilter === 'sent' ? 'bg-school-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Sent
                                </button>
                             </div>
                             <button 
                                onClick={() => setShowCompose(true)}
                                className="bg-school-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-school-700 shadow-sm flex items-center gap-2"
                             >
                                <Plus size={16}/> Compose
                             </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {displayedMessages.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                                    <p>No messages found.</p>
                                </div>
                            ) : (
                                displayedMessages.map(msg => (
                                    <div key={msg.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-school-100 flex items-center justify-center text-xs font-bold text-school-700">
                                                    {msg.senderName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{msg.senderName} <span className="text-xs font-normal text-gray-500">({msg.senderRole})</span></p>
                                                    <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {msg.recipientGroupLabel && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                                                    To: {msg.recipientGroupLabel}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{msg.subject}</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- POLLS TAB --- */}
            {activeTab === 'polls' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-end mb-4">
                        {!isStudent && (
                            <button 
                                onClick={() => setShowCreatePoll(true)}
                                className="bg-school-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-700 shadow-sm flex items-center gap-2"
                            >
                                <Plus size={16}/> Create New Poll
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
                        {displayedPolls.map(poll => {
                            const hasVoted = poll.votedUserIds.includes(currentUser.id);
                            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

                            return (
                                <div key={poll.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold text-school-600 bg-school-50 px-2 py-1 rounded">
                                            {poll.targetAudience === 'All' ? 'School-Wide' : `${poll.targetAudience} Only`}
                                        </span>
                                        <span className="text-xs text-gray-400">{new Date(poll.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{poll.question}</h3>
                                    <p className="text-xs text-gray-500 mb-4">Created by {poll.creatorName}</p>

                                    <div className="space-y-3">
                                        {poll.options.map(opt => {
                                            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt.id} className="relative">
                                                    {hasVoted ? (
                                                        <div className="w-full bg-gray-100 rounded-lg h-10 relative overflow-hidden">
                                                            <div className="bg-school-200 h-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                                            <div className="absolute inset-0 flex items-center justify-between px-3">
                                                                <span className="text-sm font-medium text-gray-800 z-10">{opt.label}</span>
                                                                <span className="text-sm font-bold text-school-800 z-10">{percentage}%</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => votePoll(poll.id, opt.id, currentUser.id)}
                                                            className="w-full py-2 px-4 rounded-lg border border-gray-300 hover:border-school-500 hover:bg-school-50 text-left text-sm font-medium transition-colors"
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                        <Vote size={14} /> {totalVotes} votes total
                                        {hasVoted && <span className="ml-auto text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Voted</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- COMPOSE MODAL --- */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-school-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><Send size={18}/> New Message</h3>
                    <button onClick={() => setShowCompose(false)} className="hover:text-gray-300"><Users size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* RECIPIENT SELECTION */}
                    {isStudent ? (
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">To (Teacher/Admin)</label>
                             <select 
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                                value={selectedRecipientId}
                                onChange={(e) => setSelectedRecipientId(e.target.value)}
                             >
                                <option value="">Select Recipient</option>
                                <option value="admin_1">Principal (Admin)</option>
                                <optgroup label="Teachers">
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.mainSubject})</option>
                                    ))}
                                </optgroup>
                             </select>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                                <button onClick={() => setTargetType('Individual')} className={`flex-1 py-1.5 text-xs font-bold rounded ${targetType === 'Individual' ? 'bg-white shadow text-school-800' : 'text-gray-500'}`}>Individual</button>
                                <button onClick={() => setTargetType('Class')} className={`flex-1 py-1.5 text-xs font-bold rounded ${targetType === 'Class' ? 'bg-white shadow text-school-800' : 'text-gray-500'}`}>Class Group</button>
                                <button onClick={() => setTargetType('Group')} className={`flex-1 py-1.5 text-xs font-bold rounded ${targetType === 'Group' ? 'bg-white shadow text-school-800' : 'text-gray-500'}`}>Broad Group</button>
                            </div>

                            {targetType === 'Individual' && (
                                <select 
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedRecipientId}
                                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                                >
                                    <option value="">Select Person</option>
                                    <optgroup label="Staff">
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Students">
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                                    </optgroup>
                                </select>
                            )}

                            {targetType === 'Group' && (
                                <select 
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">Select Group</option>
                                    <option value="ALL_USERS">Whole School (Broadcast)</option>
                                    <option value="STAFF">All Staff Members</option>
                                </select>
                            )}

                            {targetType === 'Class' && (
                                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Select Target Classes</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {classes.map(cls => (
                                            <label key={cls.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedClassIds.includes(cls.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedClassIds(prev => [...prev, cls.id]);
                                                        else setSelectedClassIds(prev => prev.filter(id => id !== cls.id));
                                                    }}
                                                    className="rounded text-school-600"
                                                />
                                                {cls.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <input 
                        type="text" 
                        placeholder="Subject" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-school-500 outline-none"
                        value={composeData.subject}
                        onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    />
                    
                    <textarea 
                        placeholder="Type your message here..." 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:ring-2 focus:ring-school-500 outline-none"
                        value={composeData.content}
                        onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                    />
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                     <button onClick={() => setShowCompose(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                     <button onClick={handleSendMessage} className="px-4 py-2 bg-school-600 text-white rounded-lg text-sm font-bold hover:bg-school-700 shadow-sm flex items-center gap-2">
                        <Send size={16} /> Send Message
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CREATE POLL MODAL --- */}
      {showCreatePoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Vote size={20}/> Create New Poll</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Question</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                            placeholder="e.g. Should we change the canteen vendor?"
                            value={pollData.question}
                            onChange={(e) => setPollData({...pollData, question: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                            value={pollData.targetAudience}
                            onChange={(e) => setPollData({...pollData, targetAudience: e.target.value})}
                        >
                            <option value="All">Everyone (School-Wide)</option>
                            <option value="Staff">Staff Only</option>
                            <option value="Students">Students Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Options</label>
                        <div className="space-y-2">
                            {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions];
                                            newOpts[idx] = e.target.value;
                                            setPollOptions(newOpts);
                                        }}
                                    />
                                    {pollOptions.length > 2 && (
                                        <button 
                                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 px-2"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button 
                                onClick={() => setPollOptions([...pollOptions, ''])}
                                className="text-xs text-school-600 font-bold hover:underline mt-1"
                            >
                                + Add Option
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCreatePoll(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200">Cancel</button>
                    <button onClick={handleCreatePoll} className="flex-1 px-4 py-2 bg-school-600 text-white rounded-lg font-bold hover:bg-school-700">Launch Poll</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Community;
