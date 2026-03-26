import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Clock, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/App';

function Demo() {
  const [demoGroup, setDemoGroup] = useState(null);
  const [demoMoments, setDemoMoments] = useState([]);
  const [inviteToken, setInviteToken] = useState('permanent_demo_invite_token_unora');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDemoData();
  }, []);

  const fetchDemoData = async () => {
    try {
      const [groupRes, momentsRes, tokenRes] = await Promise.all([
        fetch(`${API}/demo/group`),
        fetch(`${API}/demo/moments`),
        fetch(`${API}/demo/invite-token`)
      ]);

      if (groupRes.ok) setDemoGroup(await groupRes.json());
      if (momentsRes.ok) setDemoMoments(await momentsRes.json());
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        setInviteToken(tokenData.invite_token);
      }
      
      if (!groupRes.ok) setFetchError(true);
    } catch (error) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTryYourself = () => {
    if (inviteToken && demoGroup) {
      navigate(`/invite/${demoGroup.group_id}/${inviteToken}`);
    } else {
      navigate(`/invite/demo_group_showcase/permanent_demo_invite_token_unora`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading demo...</div>
      </div>
    );
  }

  if (!demoGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" data-testid="demo-error-state">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-medium">
            {fetchError ? 'Unable to load demo' : 'Demo not available'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {fetchError
              ? 'We had trouble connecting. Please try again.'
              : 'The demo group could not be found.'}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              data-testid="demo-retry-button"
              onClick={() => {
                setLoading(true);
                setFetchError(false);
                fetchDemoData();
              }}
              variant="outline"
              className="rounded-full"
            >
              Try again
            </Button>
            <Button
              data-testid="demo-go-home-button"
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

  const currentPlan = demoGroup.current_plan;
  const planStatus = currentPlan?.status;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24"
    >
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-4">
            This is a demo preview
          </div>
          <h1 className="text-4xl font-light tracking-tight mb-3">Unora Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Unora helps small groups of friends decide what to do and when to meet — fairly and effortlessly.
          </p>
          
          {/* How It Works */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 md:p-8 max-w-2xl mx-auto mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-6">How It Works</h3>
            <div className="space-y-4 text-left">
              {[
                { num: '1', text: 'Create a group' },
                { num: '2', text: 'Everyone shares preferences' },
                { num: '3', text: 'AI suggests a balanced plan' },
                { num: '4', text: 'Meet offline' },
                { num: '5', text: 'Save memories as Moments' }
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">{step.num}</span>
                  </div>
                  <span className="text-sm">{step.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Group Info */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <h2 className="text-2xl font-medium mb-2">{demoGroup.name}</h2>
          <p className="text-muted-foreground mb-4">{demoGroup.city}, {demoGroup.country}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" strokeWidth={1.5} />
            <span>{demoGroup.members.length} members</span>
          </div>
        </div>

        {/* Members Section */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4">Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {demoGroup.members.map((member, index) => (
              <motion.div
                key={member.member_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.interests.slice(0, 2).join(', ')}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Plan */}
        {currentPlan && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">
              {planStatus === 'completed' ? 'Completed Plan' : 'Active Plan'}
            </h3>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              {planStatus === 'completed' && (
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium mb-3">
                  Completed
                </span>
              )}
              <h4 className="text-lg font-medium mb-3">{currentPlan.activity}</h4>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" strokeWidth={1.5} />
                  <span>{currentPlan.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                  <span>{currentPlan.suggested_time}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-2">Why this plan?</div>
                <p className="text-sm leading-relaxed">{currentPlan.explanation}</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Moments */}
        {demoMoments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">Moments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoMoments.map((moment, index) => (
                <motion.div
                  key={moment.moment_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{moment.plan_data.activity}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" strokeWidth={1.5} />
                        <span>{moment.plan_data.location}</span>
                      </div>
                    </div>
                  </div>

                  {moment.media && moment.media.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {moment.media.slice(0, 4).map((media, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl overflow-hidden bg-muted aspect-square"
                        >
                          {media.type === 'image' && (
                            <img
                              src={media.url}
                              alt="Moment"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {moment.caption && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {moment.caption}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Try It Yourself CTA */}
        <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
          <h3 className="text-2xl font-medium mb-3">Try Unora Yourself</h3>
          <p className="text-muted-foreground mb-6">
            Join our demo group and experience the full app
          </p>
          <Button
            onClick={handleTryYourself}
            size="lg"
            data-testid="join-demo-group-button"
            className="rounded-full px-8 py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <ExternalLink className="w-5 h-5 mr-2" strokeWidth={1.5} />
            Join Demo Group
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default Demo;