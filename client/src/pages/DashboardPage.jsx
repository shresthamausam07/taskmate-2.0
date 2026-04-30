import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { households } = useHousehold();
  const navigate = useNavigate();
  const [friendBalances, setFriendBalances] = useState([]);

  useEffect(() => {
    api.get('/friends/balances').then(({ data }) => setFriendBalances(data)).catch(() => {});
  }, []);

  const totalOwed = friendBalances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
  const totalOwe = friendBalances.filter((b) => b.balance < 0).reduce((s, b) => s + Math.abs(b.balance), 0);
  const netBalance = totalOwed - totalOwe;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-gray-400">Welcome back to TaskMate</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>

        <div className={`rounded-2xl p-5 mb-4 text-white ${netBalance > 0 ? 'bg-green-600' : netBalance < 0 ? 'bg-red-500' : 'bg-indigo-600'}`}>
          <p className="text-sm opacity-80 mb-1">Overall balance</p>
          {netBalance > 0 && <p className="text-2xl font-bold">You are owed ${netBalance.toFixed(2)}</p>}
          {netBalance < 0 && <p className="text-2xl font-bold">You owe ${Math.abs(netBalance).toFixed(2)}</p>}
          {netBalance === 0 && <p className="text-2xl font-bold">All settled up</p>}
          {(totalOwed > 0 || totalOwe > 0) && (
            <div className="flex gap-4 mt-2 text-sm opacity-80">
              {totalOwed > 0 && <span>Owed to you: ${totalOwed.toFixed(2)}</span>}
              {totalOwe > 0 && <span>You owe: ${totalOwe.toFixed(2)}</span>}
            </div>
          )}
        </div>

        {households.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Your Groups</p>
              <button onClick={() => navigate('/groups')} className="text-xs text-indigo-600">See all</button>
            </div>
            <div className="space-y-2">
              {households.slice(0, 3).map((h) => (
                <button key={h._id} onClick={() => navigate(`/groups/${h._id}/expenses`)}
                  className="w-full bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {h.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.members?.length} member{h.members?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {friendBalances.filter((b) => b.balance !== 0).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Friend Balances</p>
              <button onClick={() => navigate('/friends')} className="text-xs text-indigo-600">See all</button>
            </div>
            <div className="space-y-2">
              {friendBalances.filter((b) => b.balance !== 0).slice(0, 3).map(({ friendship_id, friend, balance }) => (
                <button key={friendship_id} onClick={() => navigate(`/friends/${friend._id}`)}
                  className="w-full bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {friend.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{friend.name}</p>
                  </div>
                  {balance > 0 && <p className="text-sm font-semibold text-green-600">owes ${balance.toFixed(2)}</p>}
                  {balance < 0 && <p className="text-sm font-semibold text-red-500">you owe ${Math.abs(balance).toFixed(2)}</p>}
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {households.length === 0 && friendBalances.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Create a group or add friends to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
