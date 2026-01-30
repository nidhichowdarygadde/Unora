import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { API } from '@/App';
import { toast } from 'sonner';

function MomentDetail() {
  const [moment, setMoment] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const { groupId, momentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMoment();
  }, [groupId, momentId]);

  const fetchMoment = async () => {
    try {
      const response = await fetch(`${API}/groups/${groupId}/moments`, {
        credentials: 'include',
      });
      if (response.ok) {
        const moments = await response.json();
        const foundMoment = moments.find(m => m.moment_id === momentId);
        if (foundMoment) {
          setMoment(foundMoment);
          setCaption(foundMoment.caption || '');
        }
      }
    } catch (error) {
      toast.error('Failed to load moment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result;
          const mediaItem = {
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: base64,
            filename: file.name,
            uploaded_at: new Date().toISOString(),
          };

          await fetch(`${API}/groups/${groupId}/moments/${momentId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ media_item: mediaItem }),
          });
        };
        reader.readAsDataURL(file);
      }

      setTimeout(() => {
        fetchMoment();
        toast.success('Media added');
      }, 500);
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCaption = async () => {
    try {
      await fetch(`${API}/groups/${groupId}/moments/${momentId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caption }),
      });
      toast.success('Note saved');
      fetchMoment();
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteMedia = async () => {
    if (deleteIndex === null) return;
    
    try {
      const response = await fetch(`${API}/groups/${groupId}/moments/${momentId}/media/${deleteIndex}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete media');
      
      toast.success('Media deleted');
      setDeleteIndex(null);
      fetchMoment();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-muted-foreground mb-4">Moment not found</div>
        <Button onClick={() => navigate(`/groups/${groupId}`)} className="rounded-full">
          Go Back
        </Button>
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
      <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-6 py-8">
        <Button
          data-testid="back-to-group-button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/groups/${groupId}`)}
          className="rounded-full mb-6"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-light tracking-tight mb-1">
              {moment.plan_data.activity}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
              <span>{moment.plan_data.location}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(moment.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Media Grid */}
          {moment.media && moment.media.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                Photos & Videos
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {moment.media.map((media, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl overflow-hidden bg-muted aspect-square relative group cursor-pointer"
                    onClick={() => setSelectedMedia({ media, index: idx })}
                  >
                    {media.type === 'image' && (
                      <img
                        src={media.url}
                        alt="Moment"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {media.type === 'video' && (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Button
                        data-testid={`delete-media-${idx}`}
                        variant="destructive"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteIndex(idx);
                        }}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Media Button */}
          <div>
            <input
              type="file"
              id="media-upload"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              data-testid="add-media-button"
              variant="outline"
              onClick={() => document.getElementById('media-upload').click()}
              disabled={uploading}
              className="w-full rounded-2xl h-14 border-2 border-dashed hover:border-primary transition-colors"
            >
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Add photos or videos
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Max 10MB per file • Images and videos only
            </p>
          </div>

          {/* Caption/Note */}
          <div>
            <Label htmlFor="caption" className="text-sm font-medium text-muted-foreground mb-2 block">
              Note (optional)
            </Label>
            <Textarea
              id="caption"
              data-testid="moment-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a brief note about this moment..."
              className="rounded-2xl bg-input border-transparent focus:border-primary min-h-24 resize-none"
            />
            <Button
              data-testid="save-caption-button"
              onClick={handleSaveCaption}
              className="w-full mt-3 rounded-full py-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Save note
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MomentDetail;