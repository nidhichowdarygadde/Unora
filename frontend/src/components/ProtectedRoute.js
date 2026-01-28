import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API } from '@/App';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    useLocation().state?.user ? true : null
  );
  const [user, setUser] = useState(useLocation().state?.user || null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}

export default ProtectedRoute;