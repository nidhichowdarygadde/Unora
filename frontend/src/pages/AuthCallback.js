import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from '@/App';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/');
          return;
        }

        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) throw new Error('Session processing failed');

        const data = await response.json();
        
        document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;

        navigate('/dashboard', { state: { user: data.user }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processSession();
  }, [navigate, location.hash]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Completing sign in...</div>
    </div>
  );
}

export default AuthCallback;