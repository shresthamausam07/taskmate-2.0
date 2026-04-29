import { useParams, Navigate } from 'react-router-dom';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  return <Navigate to={`/groups/${groupId}/expenses`} replace />;
}
