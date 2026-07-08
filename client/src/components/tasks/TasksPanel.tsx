'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Trash2,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  Play
} from 'lucide-react';

interface ITask {
  _id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    avatar?: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    avatar?: string;
  };
  status: 'todo' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
}

export default function TasksPanel() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'assigned_to_me' | 'created_by_me'>('assigned_to_me');
  
  // Modal Creation Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P3');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/tasks?filter=${filterType}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/users');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterType]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim() || !assignedTo) {
      setFormError('Title and Assignee are required.');
      return;
    }

    try {
      await apiClient.post('/tasks', {
        title,
        description,
        priority,
        assignedTo,
        dueDate: dueDate || undefined
      });
      setFormSuccess('Task assigned successfully!');
      setTitle('');
      setDescription('');
      setPriority('P3');
      setAssignedTo('');
      setDueDate('');
      fetchTasks();
      setTimeout(() => setShowCreateModal(false), 800);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await apiClient.delete(`/tasks/${taskId}`);
        fetchTasks();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const getPriorityBadgeStyles = (p: 'P1' | 'P2' | 'P3' | 'P4') => {
    switch (p) {
      case 'P1':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500 font-black';
      case 'P2':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold';
      case 'P3':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-650 dark:text-indigo-400 font-semibold';
      default:
        return 'bg-bg-tertiary border-border-custom text-text-secondary font-medium';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-secondary shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors shrink-0"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h4 className="text-lg font-bold text-text-primary tracking-wide truncate flex items-center gap-2">
              <CheckSquare className="w-5.5 h-5.5 text-indigo-650" />
              <span>Priority Tasks Board</span>
            </h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Track P1 to P4 priorities and tasks queue</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          <span className="hidden sm:inline">Assign Task</span>
        </button>
      </div>

      {/* Sub tabs and Filters */}
      <div className="flex border-b border-border-custom px-4 lg:px-6 bg-bg-secondary shrink-0">
        {['assigned_to_me', 'created_by_me', 'all'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-5 py-4.5 border-b-2 text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              filterType === type
                ? 'border-indigo-500 text-text-primary font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Board Scroll Workspace */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading && tasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center bg-bg-secondary border border-border-custom rounded-xl p-8 max-w-md mx-auto mt-8">
            <CheckSquare className="w-16 h-16 text-text-secondary/20 mb-4" />
            <h5 className="text-base font-bold text-text-primary">No tasks found</h5>
            <p className="text-sm text-text-secondary mt-1">Select a different tab or assign a new task to get started.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Priority Tasks List */}
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-bg-secondary border border-border-custom rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-border-custom/80 transition-colors"
              >
                {/* Task Meta details */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 ${getPriorityBadgeStyles(task.priority)}`}>
                      {task.priority === 'P1' ? 'P1 • Critical' : task.priority === 'P2' ? 'P2 • High' : task.priority === 'P3' ? 'P3 • Medium' : 'P4 • Low'}
                    </span>
                    
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-555'
                        : task.status === 'in_progress'
                        ? 'bg-indigo-500/10 text-indigo-650'
                        : 'bg-bg-tertiary text-text-secondary'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>

                    {task.dueDate && (
                      <span className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h5 className="text-base font-bold text-text-primary leading-snug break-words">{task.title}</h5>
                  {task.description && (
                    <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">{task.description}</p>
                  )}

                  {/* Task Participants */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary pt-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text-primary">Assignee:</span>
                      <div className="w-5 h-5 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-[9px] text-indigo-650 shrink-0 border border-border-custom overflow-hidden">
                        {task.assignedTo.avatar ? (
                          <img src={task.assignedTo.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          task.assignedTo.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="truncate">{task.assignedTo.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">By:</span>
                      <span>{task.assignedBy.name}</span>
                    </div>
                  </div>
                </div>

                {/* Status Toggles and Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 border-border-custom pt-3.5 md:pt-0 shrink-0 self-end md:self-center">
                  {task.status !== 'in_progress' && task.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(task._id, 'in_progress')}
                      className="flex items-center gap-1.5 bg-bg-tertiary hover:bg-indigo-500/10 text-indigo-650 border border-border-custom font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                      title="Start Task"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start</span>
                    </button>
                  )}

                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(task._id, 'completed')}
                      className="flex items-center gap-1.5 bg-bg-tertiary hover:bg-emerald-500/10 text-emerald-555 border border-border-custom font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                      title="Complete Task"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <button
                      onClick={() => handleStatusChange(task._id, 'todo')}
                      className="flex items-center gap-1.5 bg-bg-tertiary hover:bg-text-secondary/15 text-text-secondary border border-border-custom font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                      title="Reopen Task"
                    >
                      <span>Reopen</span>
                    </button>
                  )}

                  {(task.assignedBy._id === currentUser?._id || currentUser?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg cursor-pointer transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex justify-between items-center border-b border-border-custom pb-3">
              <h4 className="text-base font-bold text-text-primary">Assign Priority Task</h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-455 p-3 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 p-3 rounded-lg text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Socket Reconnections"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Provide scope, files to edit, and requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                  >
                    <option value="P1">P1 (Urgent)</option>
                    <option value="P2">P2 (High)</option>
                    <option value="P3">P3 (Medium)</option>
                    <option value="P4">P4 (Low)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Assignee</label>
                <select
                  value={assignedTo}
                  required
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
