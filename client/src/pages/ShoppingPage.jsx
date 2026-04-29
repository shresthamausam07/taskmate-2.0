import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Check } from 'lucide-react';
import api from '../services/api';
import socket from '../socket';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function ShoppingPage() {
  const { groupId } = useParams();
  const { households } = useHousehold();
  const navigate = useNavigate();
  const household = households.find((h) => h._id === groupId);

  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/shopping/${groupId}`);
      setItems(data);
    } catch {}
  };

  useEffect(() => {
    load();
    socket.emit('join:room', groupId);
    socket.on('shopping:add', (item) => setItems((prev) => [...prev, item]));
    socket.on('shopping:update', (item) => setItems((prev) => prev.map((i) => i._id === item._id ? item : i)));
    socket.on('shopping:delete', (id) => setItems((prev) => prev.filter((i) => i._id !== id)));
    return () => {
      socket.off('shopping:add');
      socket.off('shopping:update');
      socket.off('shopping:delete');
    };
  }, [groupId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/shopping', { household_id: groupId, name, quantity });
      setName('');
      setQuantity('');
      setShowForm(false);
    } catch {}
    setLoading(false);
  };

  const toggleCheck = async (item) => {
    try {
      await api.put(`/shopping/${item._id}`, { is_checked: !item.is_checked });
    } catch {}
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/shopping/${id}`);
    } catch {}
  };

  const pending = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

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
            <p className="text-xs text-gray-400">Shopping List</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
            <Plus size={15} />
            Add
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
            <input type="text" placeholder="Item name" value={name}
              onChange={(e) => setName(e.target.value)} required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input type="text" placeholder="Quantity (optional)" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Shopping list is empty</p>
          </div>
        )}

        <div className="space-y-2">
          {pending.map((item) => (
            <div key={item._id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <button onClick={() => toggleCheck(item)}
                className="w-5 h-5 rounded border-2 border-gray-300 hover:border-indigo-500 flex-shrink-0 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                {item.quantity && <p className="text-xs text-gray-400">{item.quantity}</p>}
              </div>
              <button onClick={() => deleteItem(item._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {checked.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Checked off</p>
            <div className="space-y-2">
              {checked.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3 opacity-60">
                  <button onClick={() => toggleCheck(item)}
                    className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 line-through">{item.name}</p>
                    {item.quantity && <p className="text-xs text-gray-400">{item.quantity}</p>}
                  </div>
                  <button onClick={() => deleteItem(item._id)} className="text-gray-300 hover:text-red-400 transition-colors">
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
