import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { API } from '@/App';
import { toast } from 'sonner';

const INTEREST_OPTIONS = [
  'Coffee & Cafes',
  'Restaurants',
  'Outdoor Activities',
  'Museums & Art',
  'Music & Concerts',
  'Movies & Theater',
  'Sports & Fitness',
  'Parks & Nature',
  'Shopping',
  'Bars & Nightlife',
  'Games & Arcades',
  'Classes & Workshops',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

function InvitePreferences() {
  const [inviteData, setInviteData] = useState(null);
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState([0, 100]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { groupId, memberToken } = useParams();
  const navigate = useNavigate();
  const joinAttempted = useRef(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, [groupId, memberToken]);

  const checkAuthAndFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const authResponse = await fetch(`${API}/auth/me`, {
        credentials: 'include',
      });
      
      if (!authResponse.ok) {
        const currentUrl = window.location.href;
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(currentUrl)}`;
        return;
      }

      if (!joinAttempted.current) {
        joinAttempted.current = true;
        try {
          const joinResponse = await fetch(`${API}/invite/${groupId}/${memberToken}/join`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (joinResponse.ok) {
            const joinData = await joinResponse.json();
            if (joinData.message === "Already joined") {
              toast.success('Redirecting to group...');
              setTimeout(() => navigate(`/groups/${groupId}`), 1000);
              return;
            }
          }
        } catch (err) {
          // Join may fail if token already claimed - continue to show preferences
        }
      }

      const response = await fetch(`${API}/invite/${groupId}/${memberToken}`);
      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
        const member = data.member;
        setInterests(member.interests || []);
        setBudget([member.budget_min || 0, member.budget_max || 100]);
        setAvailability(member.availability || {});
      } else {
        setError('invite');
      }
    } catch (err) {
      setError('network');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleAvailability = (day, timeBlock) => {
    setAvailability(prev => {
      const dayAvail = prev[day] || [];
      const newDayAvail = dayAvail.includes(timeBlock)
        ? dayAvail.filter(t => t !== timeBlock)
        : [...dayAvail, timeBlock];
      return { ...prev, [day]: newDayAvail };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API}/invite/${groupId}/${memberToken}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          interests,
          budget_min: budget[0],
          budget_max: budget[1],
          availability,
        }),
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      toast.success("You've joined the group!");
      setTimeout(() => {
        navigate('/dashboard', { state: { showJoinMessage: true, groupName: inviteData?.group_name } });
      }, 1500);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="invite-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" data-testid="invite-error-state">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-medium">
            {error === 'network' ? 'Connection issue' : 'Invalid invite link'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {error === 'network'
              ? 'Unable to reach the server. Please check your connection and try again.'
              : 'This invite link may have expired or already been used.'}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              data-testid="invite-retry-button"
              onClick={() => {
                joinAttempted.current = false;
                checkAuthAndFetch();
              }}
              variant="outline"
              className="rounded-full"
            >
              Try again
            </Button>
            <Button
              data-testid="invite-go-home-button"
              onClick={() => navigate('/')}
              variant="ghost"
              className="rounded-full text-muted-foreground"
            >
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24"
    >
      <div className="max-w-md md:max-w-2xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-tight mb-2">Unora</h1>
          <p className="text-muted-foreground">Make time, together.</p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-1">You've been invited to</div>
          <h2 className="text-2xl font-medium mb-1">{inviteData.group_name}</h2>
          <p className="text-muted-foreground">{inviteData.group_city}, {inviteData.group_country}</p>
        </div>

        <h3 className="text-xl font-medium mb-6">Set your preferences</h3>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
              Interests
            </Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
                    interests.includes(interest)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
              Budget Range: ${budget[0]} - ${budget[1]}
            </Label>
            <Slider
              value={budget}
              onValueChange={setBudget}
              min={0}
              max={200}
              step={10}
              className="py-4"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
              Availability
            </Label>
            <div className="space-y-2">
              {DAYS.map(day => (
                <div key={day} className="rounded-2xl border border-border/50 bg-card p-3">
                  <div className="text-sm font-medium mb-2">{day}</div>
                  <div className="flex gap-2">
                    {TIME_BLOCKS.map(timeBlock => (
                      <button
                        key={timeBlock}
                        type="button"
                        onClick={() => toggleAvailability(day, timeBlock)}
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 ${
                          (availability[day] || []).includes(timeBlock)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {timeBlock}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            data-testid="invite-join-button"
            className="w-full rounded-full py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {saving ? 'Joining...' : 'Join Group'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default InvitePreferences;