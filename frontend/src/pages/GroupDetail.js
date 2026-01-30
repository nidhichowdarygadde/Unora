import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, CheckCircle, Copy, Check, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MomentsSection from '@/components/MomentsSection';
import { API } from '@/App';
import { toast } from 'sonner';

function GroupDetail() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedMemberId, setCopiedMemberId] = useState(null);
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
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = (member) => {
    const inviteUrl = `${window.location.origin}/invite/${groupId}/${member.member_token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedMemberId(member.member_id);
    toast.success(`Invite link copied for ${member.name}`);
    setTimeout(() => setCopiedMemberId(null), 2000);
  };

  const handleGeneratePlan = async () => {
    const allSet = group.members.every(m => m.has_set_preferences);
    if (!allSet) {
      toast.error('All members must set preferences first');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${API}/groups/${groupId}/generate-plan`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to generate plan');
      
      toast.success('Plan generated!');
      navigate(`/groups/${groupId}/plan`);
    } catch (error) {
      toast.error('Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Group not found</div>
      </div>
    );
  }

  const allPreferencesSet = group.members.every(m => m.has_set_preferences);

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
          data-testid="back-to-dashboard-button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <h1 className="text-3xl font-light tracking-tight mb-2">{group.name}</h1>
        <p className="text-muted-foreground mb-8">{group.city}, {group.country}</p>

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Members</h2>
          <div className="space-y-3">
            {group.members.map((member, index) => (
              <motion.div
                key={member.member_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`member-card-${member.member_id}`}
                className="rounded-2xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  {member.has_set_preferences && (
                    <CheckCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                <Button
                  data-testid={`copy-invite-${member.member_id}`}
                  onClick={() => copyInviteLink(member)}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full text-xs"
                >
                  {copiedMemberId === member.member_id ? (
                    <>
                      <Check className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      Copy invite link
                    </>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {group.current_plan && (
          <Button
            data-testid="view-current-plan-button"
            onClick={() => navigate(`/groups/${groupId}/plan`)}
            variant="outline"
            className="w-full rounded-full py-6 text-lg mb-4 border-2"
          >
            View Current Plan
          </Button>
        )}

        <div className="rounded-3xl border border-border/50 bg-muted/30 p-6 mb-8">
          <h3 className="text-lg font-medium mb-2">Moments</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            After you complete a plan, memories will appear here.
          </p>
          <div className="mt-4 h-32 rounded-2xl bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          data-testid="generate-plan-button"
          onClick={handleGeneratePlan}
          disabled={!allPreferencesSet || generating}
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-2xl"
        >
          <Sparkles className="w-5 h-5 mr-2" strokeWidth={1.5} />
          {generating ? 'Generating...' : 'Generate Plan'}
        </Button>
      </div>
    </motion.div>
  );
}

export default GroupDetail;