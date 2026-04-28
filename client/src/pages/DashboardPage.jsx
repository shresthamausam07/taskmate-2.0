import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-gray-400">Welcome back to TaskMate</p>
          </div>
          <button onClick={logout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
        <div className="bg-indigo-600 rounded-2xl p-5 text-white mb-4">
          <p className="text-sm text-indigo-200 mb-1">You're all set up!</p>
          <p className="text-lg font-bold">Create or join a group to get started</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-indigo-600">0</p>
            <p className="text-xs text-gray-400 mt-1">Groups</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-indigo-600">0</p>
            <p className="text-xs text-gray-400 mt-1">Friends</p>
          </div>
        </div>
      </div>
    </div>
  );
}
