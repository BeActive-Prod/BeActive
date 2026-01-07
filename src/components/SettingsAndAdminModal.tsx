'use client';

import { useState, useEffect } from 'react';
import TimePicker from './TimePicker';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/apiUrl';

interface SettingsAndAdminModalProps {
  onClose: () => void;
  listId: string;
  token: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function SettingsAndAdminModal({
  onClose,
  listId,
  token,
  currentUserId,
  isAdmin = false,
}: SettingsAndAdminModalProps) {
  const { } = useAuth();
  const apiUrl = getApiUrl();
  const [activeTab, setActiveTab] = useState<'settings' | 'admin'>('settings');
  const [rolloverHour, setRolloverHour] = useState(4);
  const [rolloverMinute, setRolloverMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [showExpiredInvites, setShowExpiredInvites] = useState(false);
  const [showActiveInvites, setShowActiveInvites] = useState(true);

  // Fetch settings
  useEffect(() => {
    fetch(`${apiUrl}/api/lists/${listId}/rollover`)
      .then(res => res.json())
      .then(data => {
        setRolloverHour(data.rolloverHour);
        setRolloverMinute(data.rolloverMinute);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [listId, apiUrl]);

  // Fetch users (admin tab)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        setError(null);
                const response = await fetch(`${apiUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Users fetch error response:', data);
          throw new Error(data.error || 'Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Users fetch error:', errorMsg);
        setError(errorMsg);
      } finally {
        setUsersLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token, apiUrl, isAdmin]);

  // Fetch invites (admin tab)
  useEffect(() => {
    if (!isAdmin || !showInviteModal) return;

    const fetchInvites = async () => {
      try {
        setInvitesLoading(true);
        const response = await fetch(`${apiUrl}/api/invites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invites');
        }

        const data = await response.json();
        setInvites(data);
      } catch (err) {
        console.error('Failed to fetch invites:', err);
      } finally {
        setInvitesLoading(false);
      }
    };

    if (token) {
      fetchInvites();
    }
  }, [token, apiUrl, isAdmin, showInviteModal]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/lists/${listId}/rollover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloverHour, rolloverMinute }),
      });
      onClose();
      window.location.reload();
    } catch (e) {
      console.error('Failed to save settings', e);
      setSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers([...users, newUser]);
      setNewUsername('');
      setNewPassword('');
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/users/${userId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isAdmin: !currentAdmin,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentAdmin } : u
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('Admin') || errorMessage.includes('admin')) {
        setError('Your permissions have been updated. Please refresh the page to see the changes.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('Admin') || errorMessage.includes('admin')) {
        setError('Your permissions have been updated. Please refresh the page to see the changes.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setIsGeneratingInvite(true);
      const response = await fetch(`${apiUrl}/api/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxUses: inviteMaxUses,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create invite');
      }

      const newInvite = await response.json();
      setInvites([newInvite, ...invites]);
      setInviteMaxUses(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invite');
      }

      setInvites(invites.filter((i) => i.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const copyInviteLink = (token: string, inviteId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const inviteLink = `${baseUrl}/register?invite=${token}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteLink).catch(() => {
        // Fallback: try to copy using the old method
        copyToClipboardFallback(inviteLink);
      });
    } else {
      // Fallback for browsers that don't support clipboard API
      copyToClipboardFallback(inviteLink);
    }
    
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border-2 border-slate-700 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            User Settings
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'admin'
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Admin Settings
            </button>
          )}
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-gray-400 text-center py-4">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Day Rollover Time
                  </label>
                  <TimePicker
                    value={{ hour: rolloverHour, minute: rolloverMinute }}
                    onChange={(time) => {
                      setRolloverHour(time.hour);
                      setRolloverMinute(time.minute);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tasks will reset and become unchecked at this time each day
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {usersLoading ? (
              <div className="text-gray-400 text-center py-8">Loading users...</div>
            ) : (
              <>
                {/* Users list */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Users</h3>
                  <p className="text-gray-400 text-xs mb-4">Manage all system users</p>

                  {/* Add user and Generate invite buttons */}
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                    >
                      Add New User
                    </button>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Generate Invite Link
                    </button>
                  </div>

                  {users.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">No users yet</div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="bg-slate-700/50 p-3 rounded flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{u.username}</span>
                              {u.isAdmin && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-600/30 text-purple-300 border border-purple-500">
                                  Admin
                                </span>
                              )}
                              {u.id === currentUserId && (
                                <span className="text-xs text-gray-400">(You)</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {u.id !== currentUserId && (
                              <>
                                <button
                                  onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                                  disabled={u.isAdmin && u.id === users.reduce((min, user) => user.isAdmin && user.id < min ? user.id : min, u.id)}
                                  className="px-2 py-1 bg-blue-600/20 border border-blue-500 text-blue-300 rounded text-xs hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={u.isAdmin && u.id === users.reduce((min, user) => user.isAdmin && user.id < min ? user.id : min, u.id) ? "Cannot demote the original admin" : ""}
                                >
                                  {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={u.id === users.reduce((min, user) => user.isAdmin && user.id < min ? user.id : min, u.id)}
                                  className="px-2 py-1 bg-red-600/20 border border-red-500 text-red-300 rounded text-xs hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={u.id === users.reduce((min, user) => user.isAdmin && user.id < min ? user.id : min, u.id) ? "Cannot delete the original admin" : ""}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add user sub-modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-slate-800 border border-purple-500/20 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Add New User</h3>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Username"
                    disabled={isCreating}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password"
                    disabled={isCreating}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-slate-700 text-gray-300 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
            <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border-2 border-slate-700" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-white mb-6">Generate Invite Links 🔗</h3>

              <div className="space-y-6">
                {/* Generate new invite */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      How many people can use this link?
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inviteMaxUses}
                      onChange={(e) => setInviteMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={isGeneratingInvite}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      The link will work for {inviteMaxUses} registration{inviteMaxUses !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateInvite}
                    disabled={isGeneratingInvite}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingInvite ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>

                {/* Existing invites */}
                {invitesLoading ? (
                  <div className="text-gray-400 text-center py-4">Loading invites...</div>
                ) : invites.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">No invite links yet</div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Invites */}
                    {invites.filter(i => i.isActive).length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowActiveInvites(!showActiveInvites)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-green-600/20 hover:bg-green-600/30 rounded transition-colors"
                        >
                          <h4 className="text-sm font-semibold text-green-400">
                            Active Invite Links ✓ ({invites.filter(i => i.isActive).length})
                          </h4>
                          <span className={`text-gray-400 transition-transform ${showActiveInvites ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {showActiveInvites && (
                          <div className="space-y-3 pl-2">
                            {invites.filter(i => i.isActive).map((invite) => (
                              <div key={invite.id} className="bg-slate-700/50 p-4 rounded space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-400 mb-2">
                                      {invite.currentUses}/{invite.maxUses} uses
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteInvite(invite.id)}
                                    className="px-3 py-1 bg-red-600/20 border border-red-500 text-red-300 rounded text-xs hover:bg-red-600/30 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/register?invite=${invite.token}`}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-xs text-gray-300 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => copyInviteLink(invite.token, invite.id)}
                                    className={`px-3 py-2 rounded text-xs font-semibold transition-colors ${
                                      copiedInviteId === invite.id
                                        ? 'bg-green-600 text-white'
                                        : 'bg-purple-600/20 border border-purple-500 text-purple-300 hover:bg-purple-600/30'
                                    }`}
                                  >
                                    {copiedInviteId === invite.id ? '✓ Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expired Invites */}
                    {invites.filter(i => !i.isActive).length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowExpiredInvites(!showExpiredInvites)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <h4 className="text-sm font-semibold text-red-400">
                            Expired Invite Links ✕ ({invites.filter(i => !i.isActive).length})
                          </h4>
                          <span className={`text-gray-400 transition-transform ${showExpiredInvites ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {showExpiredInvites && (
                          <div className="space-y-3 pl-2">
                            <p className="text-xs text-gray-400">These links have reached their usage limit</p>
                            {invites.filter(i => !i.isActive).map((invite) => (
                              <div key={invite.id} className="bg-slate-700/30 p-4 rounded space-y-3 opacity-75">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-400 mb-2">
                                      {invite.currentUses}/{invite.maxUses} uses (Expired)
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteInvite(invite.id)}
                                    className="px-3 py-1 bg-red-600/20 border border-red-500 text-red-300 rounded text-xs hover:bg-red-600/30 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/register?invite=${invite.token}`}
                                    readOnly
                                    disabled
                                    className="flex-1 px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-xs text-gray-500 focus:outline-none"
                                  />
                                  <button
                                    disabled
                                    className="px-3 py-2 rounded text-xs font-semibold bg-gray-600/20 border border-gray-500 text-gray-400 cursor-not-allowed"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full px-4 py-3 bg-slate-700 text-white font-semibold rounded hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
