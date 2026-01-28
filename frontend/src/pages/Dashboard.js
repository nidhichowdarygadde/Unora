import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/App';
import { toast } from 'sonner';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchGroups();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API}/groups`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      document.cookie = 'session_token=; path=/; max-age=0';
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24"
    >
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight mb-1">Your Groups</h1>
            {user && <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>}
          </div>
          <Button
            data-testid="logout-button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-full"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-muted-foreground mb-6">No groups yet. Create your first one!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`group-card-${group.group_id}`}
                onClick={() => navigate(`/groups/${group.group_id}`)}
                className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
              >
                <h3 className="text-xl font-medium mb-2">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{group.city}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" strokeWidth={1.5} />
                  <span>{group.members.length} members</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          data-testid="create-group-button"
          onClick={() => navigate('/create-group')}
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-2xl"
        >
          <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
          New Group
        </Button>
      </div>
    </motion.div>
  );
}

export default Dashboard;