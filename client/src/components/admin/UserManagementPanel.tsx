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

  // Form states - Employee
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('employee');

  // Form states - Department
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Form states - Team
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamDept, setTeamDept] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeSubTab === 'employees') {
        const res = await apiClient.get('/users');
        setEmployees(res.data);
      } else if (activeSubTab === 'departments') {
        const res = await apiClient.get('/departments');
        setDepts(res.data);
      } else if (activeSubTab === 'teams') {
        const res = await apiClient.get('/teams');
        setTeams(res.data);
      }
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
        department: teamDept || undefined
      });
      setShowTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      setTeamDept('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create team.');
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
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
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
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
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
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold px-4.5 py-2.5 rounded-lg text-sm cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
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
                      </>
                    )}

                    {activeSubTab === 'teams' && (
                      <>
                        <th className="p-5">Team Name</th>
                        <th className="p-5">Description</th>
                        <th className="p-5">Department</th>
                        <th className="p-5">Members Count</th>
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
                          <button
                            onClick={() => toggleEmployeeStatus(user)}
                            className="p-1.5 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg cursor-pointer transition-colors"
                            title={user.status === 'active' ? 'Block Account' : 'Activate Account'}
                          >
                            <ShieldAlert className="w-5.5 h-5.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {activeSubTab === 'departments' &&
                    depts.map(dept => (
                      <tr key={dept._id} className="hover:bg-bg-tertiary/10">
                        <td className="p-5 font-semibold text-text-primary">{dept.name}</td>
                        <td className="p-5 text-text-secondary max-w-[200px] truncate">{dept.description || 'No description'}</td>
                        <td className="p-5 text-text-primary font-medium">{dept.head?.name || 'Vacant'}</td>
                      </tr>
                    ))}

                  {activeSubTab === 'teams' &&
                    teams.map(team => (
                      <tr key={team._id} className="hover:bg-bg-tertiary/10">
                        <td className="p-5 font-semibold text-text-primary">{team.name}</td>
                        <td className="p-5 text-text-secondary max-w-[200px] truncate">{team.description || 'No description'}</td>
                        <td className="p-5">{team.department?.name || 'General'}</td>
                        <td className="p-5 text-text-primary font-bold">{team.members?.length || 0}</td>
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
                    className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">FullName</label>
                  <input
                    type="text"
                    required
                    placeholder="John Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="john.miller@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
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
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
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
                    className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
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
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Department details..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Department Head</label>
                <select
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
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
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Description</label>
                <textarea
                  placeholder="Team details..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary placeholder-text-secondary/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Linked Department (Optional)</label>
                <select
                  value={teamDept}
                  onChange={(e) => setTeamDept(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-custom rounded-lg p-3 outline-none focus:border-indigo-500 text-text-primary"
                >
                  <option value="">None</option>
                  {depts.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
    </div>
  );
}
