import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Landing() {
  const navigate = useNavigate();
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight mb-4 text-foreground">
            Unora
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground font-light mb-12">
            Make time, together.
          </p>
          
          <div className="mb-16 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <img
              src="https://images.unsplash.com/photo-1653762374114-9ab5d7a7360a?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Friends gathering"
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium mb-2">Private Groups</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invite-only circles. 3-10 friends, no public feeds.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium mb-2">Fair Planning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI finds the best time and activity for everyone.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium mb-2">Offline First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Less screen time. More real-world connection.
              </p>
            </motion.div>
          </div>

          <Button
            data-testid="landing-login-button"
            onClick={handleLogin}
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Continue with Google
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Landing;