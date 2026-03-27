import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export function AdminRoute({ children }) {
  const { userRole } = useAuth();
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
