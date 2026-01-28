import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API } from '@/App';
import { toast } from 'sonner';

function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [city, setCity] = useState('');
  const [memberNames, setMemberNames] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addMember = () => {
    if (memberNames.length < 10) {
      setMemberNames([...memberNames, '']);
    }
  };

  const removeMember = (index) => {
    if (memberNames.length > 3) {
      setMemberNames(memberNames.filter((_, i) => i !== index));
    }
  };

  const updateMemberName = (index, value) => {
    const newNames = [...memberNames];
    newNames[index] = value;
    setMemberNames(newNames);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const filledNames = memberNames.filter(name => name.trim() !== '');
    if (filledNames.length < 3) {
      toast.error('Please add at least 3 members');
      return;
    }
    if (filledNames.length > 10) {
      toast.error('Maximum 10 members allowed');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: groupName,
          city: city,
          member_names: filledNames,
        }),
      });

      if (!response.ok) throw new Error('Failed to create group');

      const group = await response.json();
      toast.success('Group created!');
      navigate(`/groups/${group.group_id}`);
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
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
        <Button
          data-testid="back-button"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <h1 className="text-3xl font-light tracking-tight mb-8">Create a Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="groupName" className="text-sm font-medium text-muted-foreground mb-2 block">
              Group Name
            </Label>
            <Input
              id="groupName"
              data-testid="group-name-input"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="rounded-2xl bg-input border-transparent focus:border-primary focus:ring-0 h-14 px-4 text-lg transition-all duration-200"
              placeholder="Weekend Adventures"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-sm font-medium text-muted-foreground mb-2 block">
              City
            </Label>
            <Input
              id="city"
              data-testid="city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="rounded-2xl bg-input border-transparent focus:border-primary focus:ring-0 h-14 px-4 text-lg transition-all duration-200"
              placeholder="San Francisco"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-muted-foreground">
                Members ({memberNames.length}/10)
              </Label>
              {memberNames.length < 10 && (
                <Button
                  data-testid="add-member-button"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMember}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {memberNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    data-testid={`member-name-input-${index}`}
                    type="text"
                    value={name}
                    onChange={(e) => updateMemberName(index, e.target.value)}
                    placeholder={`Member ${index + 1}`}
                    className="rounded-2xl bg-input border-transparent focus:border-primary focus:ring-0 h-12 px-4 transition-all duration-200"
                  />
                  {memberNames.length > 3 && (
                    <Button
                      data-testid={`remove-member-button-${index}`}
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(index)}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Minimum 3 members required</p>
          </div>

          <Button
            data-testid="submit-create-group-button"
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default CreateGroup;