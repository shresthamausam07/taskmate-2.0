import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, UserPlus, LogOut, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function GroupMembersPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaveHousehold, loadAll } = useHousehold();

  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);

  const [copied, setCopied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null); // { type: 'success'|'error', text }

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmAction, setConfirmAction] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  useEffect(() => {
    api.get(`/households/${groupId}`)
      .then(({ data }) => setHousehold(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg(null);
    setInviteLoading(true);
    try {
      const { data } = await api.post(`/households/${groupId}/invite`, { email: inviteEmail });
      setInviteMsg({ type: 'success', text: data.message });
      setInviteEmail('');
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send invite' });
    } finally {
      setInviteLoading(false);
    }
  };

  const isCreator = household && user && household.created_by?.toString() === user._id;

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setRenameLoading(true);
    try {
      const { data } = await api.put(`/households/${groupId}`, { name: newName.trim() });
      setHousehold(data);
      await loadAll();
      setRenaming(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not rename group');
    } finally {
      setRenameLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await leaveHousehold(groupId);
      navigate('/groups');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not leave group');
      setConfirmAction(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await api.delete(`/households/${groupId}`);
      await loadAll();
      navigate('/groups');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not delete group');
      setConfirmAction(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-400 text-sm">Group not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
            {household.name[0]?.toUpperCase()}
          </div>
          {renaming ? (
            <form onSubmit={handleRename} className="flex-1 flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="submit" disabled={renameLoading}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                {renameLoading ? '...' : 'Save'}
              </button>
              <button type="button" onClick={() => setRenaming(false)}
                className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-xl font-bold text-gray-900">{household.name}</h1>
              {isCreator && (
                <button onClick={() => { setNewName(household.name); setRenaming(true); }}
                  className="text-gray-300 hover:text-indigo-500 transition-colors">
                  <Pencil size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Invite Code */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Invite Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-2xl font-bold tracking-widest text-indigo-700 text-center">
              {household.invite_code}
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this code so others can join via the Join button on the Groups page.</p>
        </div>

        {/* Invite by Email */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Invite by Email</p>
          <form onSubmit={handleInvite} className="space-y-3">
            <input
              type="email"
              placeholder="Enter their email address"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteMsg(null); }}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {inviteMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${inviteMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {inviteMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={inviteLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <UserPlus size={15} />
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Members ({household.members.length})
          </p>
          <div className="space-y-2">
            {household.members.map((member) => {
              const isMe = member._id === user?._id;
              return (
                <div key={member._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {member.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      {member.name}
                      {isMe && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">you</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave / Delete Group */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {actionError && (
            <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm text-red-600">
              {actionError}
            </div>
          )}
          {!confirmAction ? (
            isCreator ? (
              <button
                onClick={() => { setConfirmAction(true); setActionError(''); }}
                className="w-full border border-red-300 text-red-500 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
                Delete Group
              </button>
            ) : (
              <button
                onClick={() => { setConfirmAction(true); setActionError(''); }}
                className="w-full border border-red-300 text-red-500 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Leave Group
              </button>
            )
          ) : (
            <div className="space-y-2">
              {isCreator ? (
                <p className="text-sm text-gray-600 text-center">
                  Delete <span className="font-semibold">{household.name}</span>? This will permanently remove all expenses, chores, messages, and shopping items.
                </p>
              ) : (
                <p className="text-sm text-gray-600 text-center">
                  Are you sure you want to leave <span className="font-semibold">{household.name}</span>?
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreator ? handleDelete : handleLeave}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                >
                  {actionLoading
                    ? (isCreator ? 'Deleting...' : 'Leaving...')
                    : (isCreator ? 'Yes, Delete' : 'Yes, Leave')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
