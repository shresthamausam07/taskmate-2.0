import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const CATEGORIES = ['general', 'food', 'housing', 'transport', 'utilities', 'entertainment', 'health', 'other'];

export default function FriendDetailPage() {
  const { friendId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friend, setFriend] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'general', paidBy: 'me' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);

  const load = async () => {
    try {
      const [expRes, balRes] = await Promise.all([
        api.get(`/friends/${friendId}/expenses`),
        api.get('/friends/balances'),
      ]);
      setExpenses(expRes.data);
      const entry = balRes.data.find((b) => b.friend._id === friendId);
      if (entry) { setFriend(entry.friend); setBalance(entry.balance); }
    } catch {}
  };

  useEffect(() => { load(); }, [friendId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/friends/${friendId}/expenses`, {
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        paidBy: form.paidBy,
      });
      setForm({ description: '', amount: '', category: 'general', paidBy: 'me' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (splitId) => {
    try { await api.put(`/splits/${splitId}/pay`); load(); } catch {}
  };

  const handleSettle = async () => {
    if (!window.confirm(`Mark all debts with ${friend?.name} as settled?`)) return;
    setSettling(true);
    try { await api.post(`/friends/${friendId}/settle`); load(); } catch {}
    setSettling(false);
  };

  const eachOwes = form.amount ? (parseFloat(form.amount) / 2).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/friends')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
            {friend?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{friend?.name || '...'}</h1>
            <p className="text-xs text-gray-400">{friend?.email}</p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 mb-4 text-white ${balance > 0 ? 'bg-green-600' : balance < 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
          {balance > 0 && <p className="text-lg font-bold">{friend?.name} owes you ${balance.toFixed(2)}</p>}
          {balance < 0 && <p className="text-lg font-bold">You owe {friend?.name} ${Math.abs(balance).toFixed(2)}</p>}
          {balance === 0 && <p className="text-lg font-bold">All settled up</p>}
          {balance !== 0 && (
            <button onClick={handleSettle} disabled={settling}
              className="mt-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
              {settling ? 'Settling...' : 'Settle Up'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Expenses</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <Plus size={15} />
            Add
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input type="number" placeholder="Total amount ($)" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required min="0.01" step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Who paid?</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, paidBy: 'me' })}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${form.paidBy === 'me' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}>
                  You paid
                </button>
                <button type="button" onClick={() => setForm({ ...form, paidBy: 'friend' })}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${form.paidBy === 'friend' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}>
                  {friend?.name?.split(' ')[0] || 'Friend'} paid
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">Split equally — each pays ${eachOwes}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {expenses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No expenses yet</p>
            </div>
          )}
          {expenses.map((exp) => {
            const mySplit = exp.splits?.find((s) => s.user_id?._id === user?._id);
            return (
              <div key={exp._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{exp.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Paid by {exp.payer_id?.name} · {new Date(exp.date).toLocaleDateString()}
                    </p>
                    {exp.category && exp.category !== 'general' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                        {exp.category}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900 ml-2">${parseFloat(exp.amount).toFixed(2)}</p>
                </div>
                {mySplit && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-600">Your share: ${parseFloat(mySplit.amount_owed).toFixed(2)}</p>
                    {mySplit.is_paid ? (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Paid</span>
                    ) : (
                      <button onClick={() => handleMarkPaid(mySplit._id)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                        Mark paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
