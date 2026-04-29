import { useParams, Routes, Route, Navigate } from 'react-router-dom';
import ExpensesPage from './ExpensesPage';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  return (
    <Routes>
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="*" element={<Navigate to={`/groups/${groupId}/expenses`} replace />} />
    </Routes>
  );
}
