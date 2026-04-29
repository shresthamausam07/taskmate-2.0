import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Check } from 'lucide-react';
import api from '../services/api';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function ChoresPage() {
  const { groupId } = useParams();
  const { households } = useHousehold();
  const navigate = useNavigate();
  const household = households.find((h) => h._id === groupId);

  const [chores, setChores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', assigned_to: '', frequency: 'weekly', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get(`/chores/${groupId}`);
      setChores(data);
    } catch {}
  };

  useEffect(() => { load(); }, [groupId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/chores', { ...form, household_id: groupId });
      setForm({ title: '', assigned_to: '', frequency: 'weekly', due_date: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add chore');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (chore) => {
    try {
      await api.put(`/chores/${chore._id}`, { is_completed: !chore.is_completed });
      load();
    } catch {}
  };

  const deleteChore = async (id) => {
    try {
      await api.delete(`/chores/${id}`);
      load();
    } catch {}
  };

  const pending = chores.filter((c) => !c.is_completed);
  const done = chores.filter((c) => c.is_completed);

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
            <p className="text-xs text-gray-400">Chores</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <Plus size={15} />
            Add
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" placeholder="Chore title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              <option value="">Assign to...</option>
              {household?.members?.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {pending.length === 0 && done.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No chores yet. Add one.</p>
          </div>
        )}

        <div className="space-y-2">
          {pending.map((chore) => (
            <div key={chore._id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-start gap-3">
              <button onClick={() => toggleComplete(chore)}
                className="w-5 h-5 rounded border-2 border-gray-300 hover:border-indigo-500 flex-shrink-0 mt-0.5 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{chore.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chore.assigned_to?.name} · {chore.frequency}
                  {chore.due_date ? ` · Due ${new Date(chore.due_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <button onClick={() => deleteChore(chore._id)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Completed</p>
            <div className="space-y-2">
              {done.map((chore) => (
                <div key={chore._id} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3 opacity-60">
                  <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 line-through truncate">{chore.title}</p>
                    <p className="text-xs text-gray-400">{chore.assigned_to?.name}</p>
                  </div>
                  <button onClick={() => deleteChore(chore._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
