import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

function MemberPreferences() {
  const [group, setGroup] = useState(null);
  const [member, setMember] = useState(null);
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState([0, 100]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { groupId, memberId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroup();
  }, [groupId, memberId]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`${API}/groups/${groupId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
        const foundMember = data.members.find(m => m.member_id === memberId);
        if (foundMember) {
          setMember(foundMember);
          setInterests(foundMember.interests || []);
          setBudget([foundMember.budget_min || 0, foundMember.budget_max || 100]);
          setAvailability(foundMember.availability || {});
        }
      }
    } catch (error) {
      toast.error('Failed to load member');
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
      const response = await fetch(`${API}/groups/${groupId}/members/${memberId}/preferences`, {
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

      toast.success('Preferences saved!');
      navigate(`/groups/${groupId}`);
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

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Member not found</div>
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
        <Button
          data-testid="back-to-group-button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/groups/${groupId}`)}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <h1 className="text-3xl font-light tracking-tight mb-2">{member.name}'s Preferences</h1>
        <p className="text-muted-foreground mb-8">Help us plan the perfect meetup</p>

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
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default MemberPreferences;