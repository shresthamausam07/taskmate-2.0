import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: profile.name,
        email: profile.email,
      });
      updateUser(data.user, data.token);
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      updateUser(data.user, data.token);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMsg({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <NavBar />
      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Profile & Settings</h1>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Edit Profile</p>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {profileMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {profileMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Change Password</p>
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full border border-red-300 text-red-500 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
