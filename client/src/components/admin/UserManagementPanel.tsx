'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { Users, UserPlus, ShieldAlert, Key, Edit, Trash2, Landmark, Settings, Menu } from 'lucide-react';

export default function UserManagementPanel() {
  const dispatch = useDispatch();
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'departments' | 'teams'>('employees');
  const [loading, setLoading] = useState(false);

  // Lists
  const [employees, setEmployees] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);

  // Editing Reference
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states - Employee
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('employee');

  // Edit states - Employee
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState('employee');
  const [editStatus, setEditStatus] = useState('active');

  // Form states - Department
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Edit states - Department
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');

  // Form states - Team
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamDept, setTeamDept] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  // Edit states - Team
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [editTeamDept, setEditTeamDept] = useState('');
  const [editTeamMembers, setEditTeamMembers] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes, teamsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/departments'),
        apiClient.get('/teams')
      ]);
      setEmployees(usersRes.data);
      setDepts(deptsRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !name || !email || !password) return;

    try {
      await apiClient.post('/users', {
        employeeId,
        name,
        email,
        password,
        department: selectedDept || undefined,
        role: selectedRole
      });
      setShowEmployeeModal(false);
      // Reset form
      setEmployeeId('');
      setName('');
      setEmail('');
      setPassword('');
      setSelectedDept('');
      setSelectedRole('employee');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create employee.');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    try {
      await apiClient.post('/departments', {
        name: deptName,
        description: deptDesc,
        head: deptHead || undefined
      });
      setShowDeptModal(false);
      setDeptName('');
      setDeptDesc('');
      setDeptHead('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    try {
      await apiClient.post('/teams', {
        name: teamName,
        description: teamDesc,
        department: teamDept || undefined,
        members: teamMembers
      });
      setShowTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      setTeamDept('');
      setTeamMembers([]);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create team.');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName || !editEmail) return;

    try {
      await apiClient.put(`/users/${editingId}`, {
        name: editName,
        email: editEmail,
        department: editDept || null,
        role: editRole,
        status: editStatus
      });
      setShowEditEmployeeModal(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update employee.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee account? This action cannot be undone.')) {
      try {
        await apiClient.delete(`/users/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete employee.');
      }
    }
  };

  const handleEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editDeptName) return;

    try {
      await apiClient.put(`/departments/${editingId}`, {
        name: editDeptName,
        description: editDeptDesc,
        head: editDeptHead || null
      });
      setShowEditDeptModal(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update department.');
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (confirm('Are you sure you want to delete this department? Users will be unassigned and the department chat will be removed.')) {
      try {
        await apiClient.delete(`/departments/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete department.');
      }
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTeamName) return;

    try {
      await apiClient.put(`/teams/${editingId}`, {
        name: editTeamName,
        description: editTeamDesc,
        department: editTeamDept || null,
        members: editTeamMembers
      });
      setShowEditTeamModal(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update team.');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm('Are you sure you want to delete this team? The team chat will be removed.')) {
      try {
        await apiClient.delete(`/teams/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete team.');
      }
    }
  };

  const toggleEmployeeStatus = async (user: any) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    if (confirm(`Change status of ${user.name} to ${newStatus}?`)) {
      try {
        await apiClient.put(`/users/${user._id}`, { status: newStatus });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-secondary">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Menu (Mobile only) */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors shrink-0"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h4 className="text-lg font-bold text-text-primary tracking-wide truncate">Enterprise Settings</h4>
            <p className="text-sm text-text-secondary mt-0.5 uppercase tracking-wider font-semibold">Admin portal for organization directory management</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {activeSubTab === 'employees' && (
            <button
              onClick={() => {
                // Fetch depts list first for select dropdown
                apiClient.get('/departments').then(res => setDepts(res.data));
                setShowEmployeeModal(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors btn-premium"
            >
              <UserPlus className="w-5.5 h-5.5" />
              <span className="hidden sm:inline">Add Employee</span>
            </button>
          )}

          {activeSubTab === 'departments' && (
            <button
              onClick={() => {
                // Fetch employees first for head select dropdown
                apiClient.get('/users').then(res => setEmployees(res.data));
                setShowDeptModal(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors btn-premium"
            >
              <Landmark className="w-5.5 h-5.5" />
              <span className="hidden sm:inline">Create Dept</span>
            </button>
          )}

          {activeSubTab === 'teams' && (
            <button
              onClick={() => {
                // Fetch depts list first
                apiClient.get('/departments').then(res => setDepts(res.data));
                setShowTeamModal(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors btn-premium"
            >
              <Settings className="w-5.5 h-5.5" />
              <span className="hidden sm:inline">Create Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs list */}
      <div className="flex border-b border-border-custom px-4 lg:px-6 bg-bg-secondary">
        {(['employees', 'departments', 'teams'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-5 py-4.5 border-b-2 text-sm font-semibold capitalize transition-all cursor-pointer ${
              activeSubTab === tab
                ? 'border-indigo-500 text-text-primary font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Directory Panels */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border-custom rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-bg-tertiary border-b border-border-custom text-xs uppercase font-bold text-text-secondary tracking-wider">
                    {activeSubTab === 'employees' && (
                      <>
                        <th className="p-5">Name</th>
                        <th className="p-5">Employee ID</th>
                        <th className="p-5">Email</th>
                        <th className="p-5">Department</th>
                        <th className="p-5">Role</th>
                        <th className="p-5">Status</th>
                        <th className="p-5 text-right">Actions</th>
                      </>
                    )}

                    {activeSubTab === 'departments' && (
                      <>
                        <th className="p-5">Department Name</th>
                        <th className="p-5">Description</th>
                        <th className="p-5">Department Head</th>
                        <th className="p-5 text-right">Actions</th>
                      </>
                    )}

                    {activeSubTab === 'teams' && (
                      <>
                        <th className="p-5">Team Name</th>
                        <th className="p-5">Description</th>
                        <th className="p-5">Department</th>
                        <th className="p-5">Members Count</th>
                        <th className="p-5 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom text-text-secondary text-sm">
                  {activeSubTab === 'employees' &&
                    employees.map(user => (
                      <tr key={user._id} className="hover:bg-bg-tertiary/10">
                        <td className="p-5 font-semibold text-text-primary">{user.name}</td>
                        <td className="p-5">{user.employeeId}</td>
                        <td className="p-5">{user.email}</td>
                        <td className="p-5">{user.department?.name || 'Unassigned'}</td>
                        <td className="p-5 uppercase text-xs font-bold text-text-secondary">{user.role}</td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingId(user._id);
                                setEditEmployeeId(user.employeeId);
                                setEditName(user.name);
                                setEditEmail(user.email);
                                setEditDept(user.department?._id || '');
                                setEditRole(user.role);
                                setEditStatus(user.status);
                                // Fetch depts list first for select dropdown
                                apiClient.get('/departments').then(res => setDepts(res.data));
                                setShowEditEmployeeModal(true);
                              }}
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleEmployeeStatus(user)}
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                              title={user.status === 'active' ? 'Block Account' : 'Activate Account'}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(user._id)}
                              className="p-1.5 hover:bg-rose-500/10 text-rose-450 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {activeSubTab === 'departments' &&
                    depts.map(dept => (
                      <tr key={dept._id} className="hover:bg-bg-tertiary/10">
                        <td className="p-5 font-semibold text-text-primary">{dept.name}</td>
                        <td className="p-5 text-text-secondary max-w-[200px] truncate">{dept.description || 'No description'}</td>
                        <td className="p-5 text-text-primary font-medium">{dept.head?.name || 'Vacant'}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingId(dept._id);
                                setEditDeptName(dept.name);
                                setEditDeptDesc(dept.description || '');
                                setEditDeptHead(dept.head?._id || '');
                                // Fetch employees for head select dropdown
                                apiClient.get('/users').then(res => setEmployees(res.data));
                                setShowEditDeptModal(true);
                              }}
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                              title="Edit Department"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept._id)}
                              className="p-1.5 hover:bg-rose-500/10 text-rose-450 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {activeSubTab === 'teams' &&
                    teams.map(team => (
                      <tr key={team._id} className="hover:bg-bg-tertiary/10">
                        <td className="p-5 font-semibold text-text-primary">{team.name}</td>
                        <td className="p-5 text-text-secondary max-w-[200px] truncate">{team.description || 'No description'}</td>
                        <td className="p-5">{team.department?.name || 'General'}</td>
                        <td className="p-5 text-text-primary font-bold">{team.members?.length || 0}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingId(team._id);
                                setEditTeamName(team.name);
                                setEditTeamDesc(team.description || '');
                                setEditTeamDept(team.department?._id || '');
                                setEditTeamMembers(team.members?.map((m: any) => m._id) || []);
                                // Fetch departments and employees
                                apiClient.get('/departments').then(res => setDepts(res.data));
                                apiClient.get('/users').then(res => setEmployees(res.data));
                                setShowEditTeamModal(true);
                              }}
                              className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                              title="Edit Team"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team._id)}
                              className="p-1.5 hover:bg-rose-500/10 text-rose-450 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                              title="Delete Team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Add Employee</h4>
            <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP102"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">FullName</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="yyy@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
                  >
                    <option value="">None</option>
                    {depts.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">System Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Create Department</h4>
            <form onSubmit={handleCreateDept} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Department details..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department Head</label>
                <select
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
                >
                  <option value="">Choose head...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Create Team</h4>
            <form onSubmit={handleCreateTeam} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sprint"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Team details..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Linked Department (Optional)</label>
                <select
                  value={teamDept}
                  onChange={(e) => setTeamDept(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                >
                  <option value="">None</option>
                  {depts.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Team Members</label>
                <div className="max-h-32 overflow-y-auto border border-border-custom rounded-lg p-2.5 bg-bg-primary space-y-1.5">
                  {employees.map(emp => (
                    <label key={emp._id} className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={teamMembers.includes(emp._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTeamMembers([...teamMembers, emp._id]);
                          } else {
                            setTeamMembers(teamMembers.filter(id => id !== emp._id));
                          }
                        }}
                        className="rounded border-border-custom text-indigo-650 focus:ring-0"
                      />
                      <span>{emp.name} ({emp.employeeId})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Edit Employee</h4>
            <form onSubmit={handleEditEmployee} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value={editEmployeeId}
                    className="w-full bg-bg-primary/50 border border-border-custom rounded-lg p-3 text-text-secondary cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">FullName</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="yyy@company.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-550 text-text-primary"
                  >
                    <option value="">None</option>
                    {depts.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-550 text-text-primary"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-550 text-text-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Edit Department</h4>
            <form onSubmit={handleEditDept} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Department details..."
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department Head</label>
                <select
                  value={editDeptHead}
                  onChange={(e) => setEditDeptHead(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                >
                  <option value="">Choose head...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowEditDeptModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-custom rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-4">Edit Team</h4>
            <form onSubmit={handleEditTeam} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sprint"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Team details..."
                  value={editTeamDesc}
                  onChange={(e) => setEditTeamDesc(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Linked Department (Optional)</label>
                <select
                  value={editTeamDept}
                  onChange={(e) => setEditTeamDept(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-505 text-text-primary"
                >
                  <option value="">None</option>
                  {depts.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Team Members</label>
                <div className="max-h-32 overflow-y-auto border border-border-custom rounded-lg p-2.5 bg-bg-primary space-y-1.5">
                  {employees.map(emp => (
                    <label key={emp._id} className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={editTeamMembers.includes(emp._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditTeamMembers([...editTeamMembers, emp._id]);
                          } else {
                            setEditTeamMembers(editTeamMembers.filter(id => id !== emp._id));
                          }
                        }}
                        className="rounded border-border-custom text-indigo-650 focus:ring-0"
                      />
                      <span>{emp.name} ({emp.employeeId})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowEditTeamModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
