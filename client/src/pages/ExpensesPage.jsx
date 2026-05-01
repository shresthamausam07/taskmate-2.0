import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

const CATEGORIES = ['general', 'food', 'housing', 'transport', 'utilities', 'entertainment', 'health', 'other'];

export default function ExpensesPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { households } = useHousehold();
  const navigate = useNavigate();
  const household = households.find((h) => h._id === groupId);

  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'general', paid_by_id: '' });
  const [splitAmong, setSplitAmong] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/expenses/${groupId}`);
      setExpenses(data);
    } catch {}
  };

  useEffect(() => { load(); }, [groupId]);

  const myBalance = () => {
    let bal = 0;
    expenses.forEach((exp) => {
      const iAmPayer = exp.payer_id?._id === user?._id;
      if (iAmPayer) {
        exp.splits?.forEach((s) => {
          if (s.user_id?._id !== user?._id && !s.is_paid) bal += s.amount_owed;
        });
      } else {
        const mySplit = exp.splits?.find((s) => s.user_id?._id === user?._id);
        if (mySplit && !mySplit.is_paid) bal -= mySplit.amount_owed;
      }
    });
    return bal;
  };

  const openForm = () => {
    setSplitAmong(household?.members?.map((m) => m._id) || []);
    setForm({ description: '', amount: '', category: 'general', paid_by_id: '' });
    setError('');
    setShowForm(true);
  };

  const toggleSplitMember = (memberId) => {
    setSplitAmong((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (splitAmong.length === 0) {
      setError('Select at least one person to split with.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/expenses', {
        household_id: groupId,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        paid_by_id: form.paid_by_id || user._id,
        split_among: splitAmong,
      });
      setForm({ description: '', amount: '', category: 'general', paid_by_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (splitId) => {
    try {
      await api.put(`/expenses/splits/${splitId}/pay`);
      load();
    } catch {}
  };

  const balance = myBalance();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/groups')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{household?.name || 'Group'}</h1>
            <p className="text-xs text-gray-400">Expenses</p>
          </div>
          <button onClick={() => showForm ? setShowForm(false) : openForm()}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <Plus size={15} />
            Add
          </button>
        </div>

        <div className={`rounded-2xl p-4 mb-4 text-white ${balance > 0 ? 'bg-green-600' : balance < 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
          {balance > 0 && <p className="font-bold">You are owed ${balance.toFixed(2)}</p>}
          {balance < 0 && <p className="font-bold">You owe ${Math.abs(balance).toFixed(2)}</p>}
          {balance === 0 && <p className="font-bold">All settled up</p>}
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
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div>
              <p className="text-xs text-gray-500 mb-1">Who paid?</p>
              <select value={form.paid_by_id} onChange={(e) => setForm({ ...form, paid_by_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="">You</option>
                {household?.members?.filter((m) => m._id !== user?._id).map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Split among ({splitAmong.length} of {household?.members?.length || 1})
              </p>
              <div className="flex flex-wrap gap-2">
                {household?.members?.map((m) => {
                  const selected = splitAmong.includes(m._id);
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleSplitMember(m._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-500 border-gray-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                        {m.name[0]?.toUpperCase()}
                      </span>
                      {m._id === user?._id ? 'You' : m.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
              {splitAmong.length > 0 && form.amount && (
                <p className="text-xs text-gray-400 mt-1.5">
                  ${(parseFloat(form.amount) / splitAmong.length).toFixed(2)} each
                </p>
              )}
            </div>
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
