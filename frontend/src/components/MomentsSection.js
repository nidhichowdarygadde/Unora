import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

function MomentsSection({ moments }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  if (!moments || moments.length === 0) {
    return (
      <div className="rounded-3xl border border-border/50 bg-muted/30 p-6">
        <h3 className="text-lg font-medium mb-2">Moments</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Memories from completed plans will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Moments</h3>
      <div className="space-y-4">
        {moments.map((moment, index) => (
          <motion.div
            key={moment.moment_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            data-testid={`moment-${moment.moment_id}`}
            onClick={() => navigate(`/groups/${groupId}/moments/${moment.moment_id}`)}
            className="rounded-3xl border border-border/50 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer"
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
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(moment.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
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
                    {media.type === 'image' && media.url && (
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
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {moment.caption}
              </p>
            )}
            
            {!moment.media?.length && !moment.caption && (
              <p className="text-xs text-muted-foreground italic">
                Tap to add photos and notes
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default MomentsSection;
