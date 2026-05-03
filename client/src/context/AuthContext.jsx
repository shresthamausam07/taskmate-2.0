import { createContext, useContext, useState } from 'react';
import api from '../services/api';
import socket from '../socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tm_user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('tm_token', data.token);
    localStorage.setItem('tm_user', JSON.stringify(data.user));
    setUser(data.user);
    socket.connect();
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('tm_token', data.token);
    localStorage.setItem('tm_user', JSON.stringify(data.user));
    setUser(data.user);
    socket.connect();
  };

  const updateUser = (userData, token) => {
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
