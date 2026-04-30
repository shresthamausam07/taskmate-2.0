import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogIn, ChevronRight, Users, Bell } from 'lucide-react';
import api from '../services/api';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function GroupsPage() {
  const { households, loadAll } = useHousehold();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [invites, setInvites] = useState([]);
  const [inviteLoading, setInviteLoading] = useState({});

  const loadInvites = async () => {
    try {
      const { data } = await api.get('/households/invites');
      setInvites(data);
    } catch {}
  };

  useEffect(() => { loadInvites(); }, []);

  const handleAcceptInvite = async (inviteId) => {
    setInviteLoading((p) => ({ ...p, [inviteId]: 'accept' }));
    try {
      await api.put(`/households/invites/${inviteId}/accept`);
      await loadAll();
      await loadInvites();
    } catch {} finally {
      setInviteLoading((p) => ({ ...p, [inviteId]: null }));
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    setInviteLoading((p) => ({ ...p, [inviteId]: 'decline' }));
    try {
      await api.delete(`/households/invites/${inviteId}`);
      await loadInvites();
    } catch {} finally {
      setInviteLoading((p) => ({ ...p, [inviteId]: null }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/households', { name });
      setName('');
      setMode(null);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/households/join/${code}`);
      setCode('');
      setMode(null);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Groups</h1>
          <div className="flex gap-2">
            <button onClick={() => { setMode(mode === 'join' ? null : 'join'); setError(''); }}
              className="border border-indigo-600 text-indigo-600 px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
              <LogIn size={15} />
              Join
            </button>
            <button onClick={() => { setMode(mode === 'create' ? null : 'create'); setError(''); }}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
              <Plus size={15} />
              New
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

        {invites.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Bell size={12} /> Pending Invites
            </p>
            {invites.map((inv) => (
              <div key={inv._id} className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{inv.household_id?.name}</p>
                <p className="text-xs text-gray-500 mb-3">Invited by {inv.inviter_id?.name} ({inv.inviter_id?.email})</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeclineInvite(inv._id)}
                    disabled={!!inviteLoading[inv._id]}
                    className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-sm disabled:opacity-60"
                  >
                    {inviteLoading[inv._id] === 'decline' ? 'Declining...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleAcceptInvite(inv._id)}
                    disabled={!!inviteLoading[inv._id]}
                    className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-semibold disabled:opacity-60"
                  >
                    {inviteLoading[inv._id] === 'accept' ? 'Joining...' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">Create a new group</p>
            <input type="text" placeholder="Group name" value={name}
              onChange={(e) => setName(e.target.value)} required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">Join with invite code</p>
            <input type="text" placeholder="Enter 6-character code" value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())} required autoFocus maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {households.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No groups yet. Create or join one.</p>
            </div>
          )}
          {households.map((h) => (
            <button key={h._id} onClick={() => navigate(`/groups/${h._id}/expenses`)}
              className="w-full bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                {h.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{h.name}</p>
                <p className="text-xs text-gray-400">{h.members?.length} member{h.members?.length !== 1 ? 's' : ''} · Code: {h.invite_code}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
