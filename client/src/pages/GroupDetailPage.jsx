import { useParams, Routes, Route, Navigate } from 'react-router-dom';
import ExpensesPage from './ExpensesPage';
import ShoppingPage from './ShoppingPage';
import ChoresPage from './ChoresPage';
import MessagesPage from './MessagesPage';
import GroupMembersPage from './GroupMembersPage';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  return (
    <Routes>
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="shopping" element={<ShoppingPage />} />
      <Route path="chores" element={<ChoresPage />} />
      <Route path="messages" element={<MessagesPage />} />
      <Route path="members" element={<GroupMembersPage />} />
      <Route path="*" element={<Navigate to={`/groups/${groupId}/expenses`} replace />} />
    </Routes>
  );
}
