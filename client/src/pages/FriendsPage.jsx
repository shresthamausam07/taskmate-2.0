import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronRight } from 'lucide-react';
import api from '../services/api';
import NavBar from '../components/NavBar';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [bRes, rRes] = await Promise.all([
        api.get('/friends/balances'),
        api.get('/friends/requests'),
      ]);
      setBalances(bRes.data);
      setRequests(rRes.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/friends/request', { email: email.trim() });
      setSuccess(data.message);
      setEmail('');
      setShowAdd(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try { await api.put(`/friends/${id}/accept`); load(); } catch {}
  };

  const handleDecline = async (id) => {
    try { await api.delete(`/friends/${id}`); load(); } catch {}
  };

  const totalOwedToMe = balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
  const totalIOwe = balances.filter((b) => b.balance < 0).reduce((s, b) => s + Math.abs(b.balance), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Friends</h1>
          <button onClick={() => { setShowAdd(!showAdd); setError(''); setSuccess(''); }}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <UserPlus size={15} />
            Add
          </button>
        </div>

        {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{success}</p>}
        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

        {showAdd && (
          <form onSubmit={handleSendRequest} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            <p className="font-semibold text-gray-700">Add Friend by Email</p>
            <input type="email" placeholder="their@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}

        {(totalOwedToMe > 0 || totalIOwe > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {totalOwedToMe > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-green-600 mb-0.5">You are owed</p>
                <p className="text-lg font-bold text-green-700">${totalOwedToMe.toFixed(2)}</p>
              </div>
            )}
            {totalIOwe > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-red-500 mb-0.5">You owe</p>
                <p className="text-lg font-bold text-red-600">${totalIOwe.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        {requests.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Pending Requests</p>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r._id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.requester_id?.name}</p>
                    <p className="text-xs text-gray-400">{r.requester_id?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecline(r._id)} className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg">Decline</button>
                    <button onClick={() => handleAccept(r._id)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg">Accept</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {balances.length === 0 && requests.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No friends yet. Add one above.</p>
            </div>
          )}
          {balances.map(({ friendship_id, friend, balance }) => (
            <button key={friendship_id} onClick={() => navigate(`/friends/${friend._id}`)}
              className="w-full bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                {friend.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{friend.name}</p>
                <p className="text-xs text-gray-400 truncate">{friend.email}</p>
              </div>
              {balance > 0 && <p className="text-sm font-semibold text-green-600 flex-shrink-0">owes ${balance.toFixed(2)}</p>}
              {balance < 0 && <p className="text-sm font-semibold text-red-500 flex-shrink-0">you owe ${Math.abs(balance).toFixed(2)}</p>}
              {balance === 0 && <p className="text-sm text-gray-400 flex-shrink-0">settled</p>}
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
