import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [household, setHousehold] = useState(null);

  const loadAll = async () => {
    if (!user) { setHouseholds([]); setHousehold(null); return; }
    try {
      const { data } = await api.get('/households');
      setHouseholds(data);
      if (data.length > 0 && !household) setHousehold(data[0]);
    } catch {}
  };

  useEffect(() => { loadAll(); }, [user]);

  const selectHousehold = (h) => setHousehold(h);

  const leaveHousehold = async (id) => {
    await api.post(`/households/${id}/leave`);
    await loadAll();
    if (household?._id === id) setHousehold(null);
  };

  return (
    <HouseholdContext.Provider value={{ households, household, selectHousehold, leaveHousehold, loadAll }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export const useHousehold = () => useContext(HouseholdContext);
