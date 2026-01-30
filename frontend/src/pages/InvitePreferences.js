import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CheckCircle } from 'lucide-react';
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
  const [saved, setSaved] = useState(false);
  const { groupId, memberToken } = useParams();

  useEffect(() => {
    fetchInviteData();
  }, [groupId, memberToken]);

  const fetchInviteData = async () => {
    try {
      const response = await fetch(`${API}/invite/${groupId}/${memberToken}`);
      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
        const member = data.member;
        setInterests(member.interests || []);
        setBudget([member.budget_min || 0, member.budget_max || 100]);
        setAvailability(member.availability || {});
        setSaved(member.has_set_preferences);
      } else {
        toast.error('Invalid invite link');
      }
    } catch (error) {
      toast.error('Failed to load invite');
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
        body: JSON.stringify({
          interests,
          budget_min: budget[0],
          budget_max: budget[1],
          availability,
        }),
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      toast.success('Preferences saved! Your group organizer will see this.');
      setSaved(true);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-muted-foreground mb-4">Invalid invite link</div>
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
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-tight mb-2">Unora</h1>
          <p className="text-muted-foreground">Make time, together.</p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-1">You've been invited to</div>
          <h2 className="text-2xl font-medium mb-1">{inviteData.group_name}</h2>
          <p className="text-muted-foreground">{inviteData.group_city}</p>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-primary/10 border border-primary/20 p-4 mb-6 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <div className="text-sm">
              <div className="font-medium">Preferences saved!</div>
              <div className="text-muted-foreground">You can update them anytime.</div>
            </div>
          </motion.div>
        )}

        <h3 className="text-xl font-medium mb-6">Hey {inviteData.member.name}, set your preferences</h3>

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
                  data-testid={`interest-chip-${interest.toLowerCase().replace(/\s+/g, '-')}`}
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
              data-testid="budget-slider"
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
                        data-testid={`availability-${day.toLowerCase()}-${timeBlock.toLowerCase()}`}
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
            data-testid="save-preferences-button"
            type="submit"
            disabled={saving}
            className="w-full rounded-full py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {saving ? 'Saving...' : saved ? 'Update Preferences' : 'Save Preferences'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default InvitePreferences;