import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, BarChart2 } from 'lucide-react';
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
  const [receipt, setReceipt] = useState(null);
  const [splitAmong, setSplitAmong] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', category: 'general', paid_by_id: '' });
  const [editSplitAmong, setEditSplitAmong] = useState([]);
  const [editReceipt, setEditReceipt] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

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

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const openForm = () => {
    setSplitAmong(household?.members?.map((m) => m._id) || []);
    setForm({ description: '', amount: '', category: 'general', paid_by_id: '' });
    setReceipt(null);
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
      const receipt_url = receipt ? await toBase64(receipt) : null;
      await api.post('/expenses', {
        household_id: groupId,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        paid_by_id: form.paid_by_id || user._id,
        split_among: splitAmong,
        receipt_url,
      });
      setForm({ description: '', amount: '', category: 'general', paid_by_id: '' });
      setReceipt(null);
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

  const openEdit = (exp) => {
    setEditingId(exp._id);
    setEditForm({
      description: exp.description,
      amount: String(exp.amount),
      category: exp.category || 'general',
      paid_by_id: exp.payer_id?._id || '',
    });
    setEditSplitAmong(exp.splits?.map((s) => s.user_id?._id).filter(Boolean) || []);
    setEditReceipt(null);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (editSplitAmong.length === 0) return;
    setEditLoading(true);
    try {
      const receipt_url = editReceipt ? await toBase64(editReceipt) : undefined;
      await api.put(`/expenses/${editingId}`, {
        description: editForm.description,
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        paid_by_id: editForm.paid_by_id || user._id,
        split_among: editSplitAmong,
        ...(receipt_url !== undefined && { receipt_url }),
      });
      setEditingId(null);
      load();
    } catch {} finally {
      setEditLoading(false);
    }
  };

  const handleSettleAll = async () => {
    try {
      await api.put(`/expenses/settle-all/${groupId}`);
      load();
    } catch {}
  };

  const balance = myBalance();

  const categoryTotals = CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => (e.category || 'general') === cat)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return { cat, total };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  const CATEGORY_COLORS = {
    food: 'bg-orange-400', housing: 'bg-blue-400', transport: 'bg-yellow-400',
    utilities: 'bg-purple-400', entertainment: 'bg-pink-400', health: 'bg-green-400',
    other: 'bg-gray-400', general: 'bg-indigo-400',
  };

  return (
    <>
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
          {expenses.length > 0 && (
            <button onClick={() => setShowAnalytics(!showAnalytics)}
              className={`p-2 rounded-lg transition-colors ${showAnalytics ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <BarChart2 size={20} />
            </button>
          )}
          <button onClick={() => showForm ? setShowForm(false) : openForm()}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <Plus size={15} />
            Add
          </button>
        </div>

        <div className={`rounded-2xl p-4 mb-4 text-white ${balance > 0 ? 'bg-green-600' : balance < 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              {balance > 0 && <p className="font-bold">You are owed ${balance.toFixed(2)}</p>}
              {balance < 0 && <p className="font-bold">You owe ${Math.abs(balance).toFixed(2)}</p>}
              {balance === 0 && <p className="font-bold">All settled up</p>}
            </div>
            {balance < 0 && (
              <button
                onClick={handleSettleAll}
                className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Settle All
              </button>
            )}
          </div>
        </div>

        {showAnalytics && categoryTotals.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spending by Category</p>
            <div className="space-y-2.5">
              {categoryTotals.map(({ cat, total }) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600 capitalize">{cat}</span>
                    <span className="text-xs text-gray-500">${total.toFixed(2)} · {((total / grandTotal) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${CATEGORY_COLORS[cat] || 'bg-indigo-400'} h-2 rounded-full transition-all`}
                      style={{ width: `${(total / grandTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-right">Total spent: ${grandTotal.toFixed(2)}</p>
          </div>
        )}

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
            <div>
              <p className="text-xs text-gray-500 mb-1">Receipt (optional)</p>
              <input type="file" accept="image/*"
                onChange={(e) => setReceipt(e.target.files[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
              {receipt && <p className="text-xs text-gray-400 mt-1">{receipt.name}</p>}
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
            const iAmPayer = exp.payer_id?._id === user?._id;

            if (editingId === exp._id) {
              return (
                <form key={exp._id} onSubmit={handleEdit} className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-200 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Expense</p>
                  <input type="text" value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input type="number" value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    required min="0.01" step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white capitalize">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Who paid?</p>
                    <select value={editForm.paid_by_id} onChange={(e) => setEditForm({ ...editForm, paid_by_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                      <option value="">You</option>
                      {household?.members?.filter((m) => m._id !== user?._id).map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Split among ({editSplitAmong.length} of {household?.members?.length || 1})</p>
                    <div className="flex flex-wrap gap-2">
                      {household?.members?.map((m) => {
                        const selected = editSplitAmong.includes(m._id);
                        return (
                          <button key={m._id} type="button"
                            onClick={() => setEditSplitAmong((prev) => selected ? prev.filter((id) => id !== m._id) : [...prev, m._id])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-300'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                              {m.name[0]?.toUpperCase()}
                            </span>
                            {m._id === user?._id ? 'You' : m.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                    {editSplitAmong.length > 0 && editForm.amount && (
                      <p className="text-xs text-gray-400 mt-1.5">${(parseFloat(editForm.amount) / editSplitAmong.length).toFixed(2)} each</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Replace receipt (optional)</p>
                    <input type="file" accept="image/*"
                      onChange={(e) => setEditReceipt(e.target.files[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                    <button type="submit" disabled={editLoading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                      {editLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              );
            }

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
                  <div className="flex items-center gap-2 ml-2">
                    {iAmPayer && (
                      <button onClick={() => openEdit(exp)} className="text-gray-300 hover:text-indigo-500 transition-colors">
                        <Pencil size={14} />
                      </button>
                    )}
                    <p className="text-lg font-bold text-gray-900">${parseFloat(exp.amount).toFixed(2)}</p>
                  </div>
                </div>
                {exp.receipt_url && (
                  <button onClick={() => setReceiptModal(exp.receipt_url)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline">
                    📎 View Receipt
                  </button>
                )}
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

    {receiptModal && (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={() => setReceiptModal(null)}>
        <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setReceiptModal(null)}
            className="absolute -top-10 right-0 text-white text-sm font-semibold opacity-80 hover:opacity-100">
            ✕ Close
          </button>
          <img src={receiptModal} alt="Receipt" className="w-full rounded-2xl shadow-xl" />
        </div>
      </div>
    )}
    </>
  );
}
