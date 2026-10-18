import React, { useState } from 'react';
import {
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Share2,
  Copy,
  Mic,
  Calendar,
  AlertCircle,
  Tag,
  Check,
  CheckCircle2,
  Circle,
  Sparkles,
  Clock,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { ExecutableTask, SupportedLanguage, TaskExecutionStatus, UserNote, UserTask } from '../types';
import { AndroidIntentService } from '../services/androidIntents';
import { voiceService } from '../services/voiceService';

interface TasksNotesViewProps {
  notes: UserNote[];
  tasks: UserTask[];
  executableTasks: ExecutableTask[];
  onAddNote: (note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteNote: (id: string) => void;
  onAddTask: (task: Omit<UserTask, 'id' | 'createdAt'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCreateExecutableTask: (task: Omit<ExecutableTask, 'id' | 'creationTime' | 'lastUpdated'>) => void;
  onUpdateExecutableTaskStatus: (id: string, status: TaskExecutionStatus) => void;
  onAskTaskStatus: (taskTitle?: string) => void;
  language: SupportedLanguage;
}

export const TasksNotesView: React.FC<TasksNotesViewProps> = ({
  notes,
  tasks,
  executableTasks,
  onAddNote,
  onDeleteNote,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onCreateExecutableTask,
  onUpdateExecutableTaskStatus,
  onAskTaskStatus,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'notes'>('projects');
  const [showAddModal, setShowAddModal] = useState(false);

  // Executable Project Task form state
  const [execTitle, setExecTitle] = useState('');
  const [execDesc, setExecDesc] = useState('');
  const [execCategory, setExecCategory] = useState<ExecutableTask['category']>('project_build');
  const [execSteps, setExecSteps] = useState<string>('Plan requirements\nExecute implementation\nVerify results');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<UserNote['category']>('personal');
  const [isDictatingNote, setIsDictatingNote] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<UserTask['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = useState('Today');
  const [isDictatingTask, setIsDictatingTask] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice dictation handler
  const handleDictate = (target: 'note' | 'task' | 'exec') => {
    if (target === 'note') {
      if (isDictatingNote) {
        voiceService.stopListening();
        setIsDictatingNote(false);
        return;
      }
      setIsDictatingNote(true);
      voiceService.startListening(
        language,
        (text, isFinal) => {
          setNoteContent((prev) => (isFinal ? `${prev} ${text}`.trim() : prev));
        },
        () => setIsDictatingNote(false),
        () => setIsDictatingNote(false)
      );
    } else if (target === 'task') {
      if (isDictatingTask) {
        voiceService.stopListening();
        setIsDictatingTask(false);
        return;
      }
      setIsDictatingTask(true);
      voiceService.startListening(
        language,
        (text, isFinal) => {
          if (isFinal) setTaskTitle(text);
        },
        () => setIsDictatingTask(false),
        () => setIsDictatingTask(false)
      );
    } else {
      voiceService.startListening(
        language,
        (text, isFinal) => {
          if (isFinal) setExecTitle(text);
        },
        () => {},
        () => {}
      );
    }
  };

  const handleSave = () => {
    if (activeTab === 'projects') {
      if (!execTitle.trim()) return;
      const stepItems = execSteps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title, i) => ({
          id: `step-${Date.now()}-${i}`,
          title,
          status: 'Pending' as const,
        }));

      onCreateExecutableTask({
        title: execTitle.trim(),
        description: execDesc.trim() || 'Executed task on behalf of Boss.',
        category: execCategory,
        status: 'In Progress',
        steps: stepItems.length > 0 ? stepItems : [{ id: 's1', title: 'Task initialization', status: 'In Progress' }],
      });

      setExecTitle('');
      setExecDesc('');
      setShowAddModal(false);
    } else if (activeTab === 'notes') {
      if (!noteTitle.trim()) return;
      onAddNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: noteCategory,
        tags: [noteCategory],
      });
      setNoteTitle('');
      setNoteContent('');
      setShowAddModal(false);
    } else {
      if (!taskTitle.trim()) return;
      onAddTask({
        title: taskTitle.trim(),
        priority: taskPriority,
        dueDate: taskDueDate,
        isCompleted: false,
      });
      setTaskTitle('');
      setShowAddModal(false);
    }
  };

  const getStatusBadge = (status: TaskExecutionStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'Waiting for User Action':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Waiting for Boss Action</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <Circle className="w-3.5 h-3.5 text-slate-400" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto px-4">
      {/* Top Bar with Status check shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Boss Projects ({executableTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Quick Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes ({notes.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Voice Status Question button */}
          <button
            onClick={() => onAskTaskStatus()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 font-bold text-xs transition-colors"
            title="Ask Brain Mate about your project status"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>&quot;Boss, mera kaam hua kya?&quot;</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New {activeTab === 'projects' ? 'Project' : activeTab === 'tasks' ? 'Task' : 'Note'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Real Executable Projects & Tasks */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                <strong>Persistent Real Task Engine:</strong> Brain Mate tracks multi-step execution. Never claims completion without verified results.
              </span>
            </span>
          </div>

          {executableTasks.map((task) => {
            const completedSteps = task.steps?.filter((s) => s.status === 'Completed').length || 0;
            const totalSteps = task.steps?.length || 1;
            const progressPercent = Math.round((completedSteps / totalSteps) * 100);

            return (
              <div
                key={task.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-all shadow-sm"
              >
                {/* Header info & Status */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">{task.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {task.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{task.description}</p>
                  </div>

                  <div>{getStatusBadge(task.status)}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Steps: {completedSteps}/{totalSteps} completed</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.status === 'Completed'
                          ? 'bg-emerald-400'
                          : task.status === 'Failed'
                          ? 'bg-rose-500'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Steps checklist */}
                {task.steps && task.steps.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                    {task.steps.map((step) => (
                      <div key={step.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="flex items-center gap-2 text-slate-300">
                          {step.status === 'Completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : step.status === 'In Progress' ? (
                            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                          ) : step.status === 'Failed' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className={step.status === 'Completed' ? 'line-through text-slate-500' : ''}>
                            {step.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{step.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Result or Error banner */}
                {task.result && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                    <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5 text-emerald-400">
                      Verified Result:
                    </span>
                    <p>{task.result}</p>
                  </div>
                )}

                {task.errorDetails && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
                    <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5 text-rose-400">
                      Execution Blocker:
                    </span>
                    <p>{task.errorDetails}</p>
                  </div>
                )}

                {task.userActionPrompt && task.status === 'Waiting for User Action' && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-300">
                        Action Required by Boss:
                      </span>
                      <p>{task.userActionPrompt}</p>
                    </div>
                    <button
                      onClick={() => onUpdateExecutableTaskStatus(task.id, 'In Progress')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0"
                    >
                      Authorize
                    </button>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] font-mono">
                    Updated: {new Date(task.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={() => onAskTaskStatus(task.title)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>Ask Boss Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Quick Tasks Checklist */}
      {activeTab === 'tasks' && (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                task.isCompleted
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    task.isCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'
                  }`}
                >
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold text-white truncate ${
                      task.isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {task.dueDate || 'No date'}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'text-rose-400'
                          : task.priority === 'high'
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors ml-2"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              No tasks yet, Boss. Tap &quot;New Task&quot; or say &quot;Brain Mate, task add karo&quot;!
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Saved Notes */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2.5 shadow-sm hover:border-indigo-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-white truncate">{note.title}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase shrink-0">
                    {note.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap mt-2 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                      setCopiedId(note.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Copy note"
                  >
                    {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => AndroidIntentService.shareNative(note.title, note.content)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Share note via Android"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs sm:col-span-2">
              No notes saved yet, Boss. Tap &quot;New Note&quot; or dictate in Hindi/English with Brain Mate!
            </div>
          )}
        </div>
      )}

      {/* Creation Modal for Projects / Tasks / Notes */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                Create New {activeTab === 'projects' ? 'Boss Project' : activeTab === 'tasks' ? 'Task' : 'Note'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            {activeTab === 'projects' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Project Title</label>
                  <input
                    type="text"
                    value={execTitle}
                    onChange={(e) => setExecTitle(e.target.value)}
                    placeholder="e.g. Q4 Indian Equity Portfolio Strategy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={execDesc}
                    onChange={(e) => setExecDesc(e.target.value)}
                    placeholder="Describe what Brain Mate should execute..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Steps Breakdown (One per line)</label>
                  <textarea
                    rows={3}
                    value={execSteps}
                    onChange={(e) => setExecSteps(e.target.value)}
                    placeholder="Step 1&#10;Step 2&#10;Step 3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={execCategory}
                    onChange={(e) => setExecCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="project_build">Project Build &amp; Code</option>
                    <option value="market_research">Share Market Research</option>
                    <option value="android_action">Android Phone Action</option>
                    <option value="note_doc">Document / Note Creation</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            ) : activeTab === 'tasks' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Task Title</label>
                    <button
                      onClick={() => handleDictate('task')}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isDictatingTask ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'text-cyan-400'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictatingTask ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Reliance stock report review"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Due Date</label>
                    <input
                      type="text"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      placeholder="e.g. Today, 5:00 PM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Indian Equity Strategy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Content</label>
                    <button
                      onClick={() => handleDictate('note')}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isDictatingNote ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'text-cyan-400'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictatingNote ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write or voice dictate your notes in Hindi, English, or Hinglish..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="personal">Personal</option>
                    <option value="finance">Finance &amp; Stocks</option>
                    <option value="study">Study &amp; Learning</option>
                    <option value="work">Work</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Save {activeTab === 'projects' ? 'Project' : activeTab === 'tasks' ? 'Task' : 'Note'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
