import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/App';
import { toast } from 'sonner';

function PlanDisplay() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`${API}/groups/${groupId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      }
    } catch (error) {
      toast.error('Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`${API}/groups/${groupId}/generate-plan`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to regenerate plan');
      
      const newPlan = await response.json();
      setGroup(prev => ({ ...prev, current_plan: newPlan }));
      toast.success('Plan regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate plan');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch(`${API}/groups/${groupId}/accept-plan`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to accept plan');
      
      toast.success('Plan accepted!');
      fetchGroup();
    } catch (error) {
      toast.error('Failed to accept plan');
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const response = await fetch(`${API}/groups/${groupId}/complete-plan`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to complete plan');
      
      const data = await response.json();
      toast.success('Plan marked as done! Memory created.');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      toast.error('Failed to complete plan');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!group || !group.current_plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-muted-foreground mb-4">No plan available</div>
        <Button onClick={() => navigate(`/groups/${groupId}`)} className="rounded-full">
          Go Back
        </Button>
      </div>
    );
  }

  const plan = group.current_plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-32"
    >
      <div className="max-w-md mx-auto px-6 py-8">
        <Button
          data-testid="back-to-group-button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/groups/${groupId}`)}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <h1 className="text-3xl font-light tracking-tight mb-2">Your Plan</h1>
        <p className="text-muted-foreground mb-8">{group.name}</p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          data-testid="plan-card"
          className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-6"
        >
          <h2 className="text-2xl font-medium mb-4">{plan.activity}</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" strokeWidth={1.5} />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{plan.location}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" strokeWidth={1.5} />
              <div>
                <div className="text-sm text-muted-foreground">Time</div>
                <div className="font-medium">{plan.suggested_time}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground mb-2">Why this plan?</div>
            <p className="text-sm leading-relaxed">{plan.explanation}</p>
          </div>
        </motion.div>

        <div className="flex gap-3">
          <Button
            data-testid="regenerate-plan-button"
            onClick={handleRegenerate}
            disabled={regenerating}
            variant="outline"
            className="flex-1 rounded-full py-6 text-lg border-2"
          >
            <RefreshCw className="w-5 h-5 mr-2" strokeWidth={1.5} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
          
          <Button
            data-testid="accept-plan-button"
            onClick={handleAccept}
            className="flex-1 rounded-full py-6 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <CheckCircle className="w-5 h-5 mr-2" strokeWidth={1.5} />
            Accept
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default PlanDisplay;