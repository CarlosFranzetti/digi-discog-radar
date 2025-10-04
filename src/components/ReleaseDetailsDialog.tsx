import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Music, Calendar, Globe, Tag, Disc, Building2, Hash, Barcode, Play, Pause, Video } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ReleaseDetails {
  id: number;
  title: string;
  artists?: Array<{ name: string }>;
  year?: number;
  country?: string;
  released?: string;
  genres?: string[];
  styles?: string[];
  formats?: Array<{ name: string; qty: string; descriptions?: string[] }>;
  labels?: Array<{ name: string; catno: string }>;
  tracklist?: Array<{ position: string; title: string; duration?: string }>;
  images?: Array<{ uri: string; type: string }>;
  notes?: string;
  identifiers?: Array<{ type: string; value: string }>;
  companies?: Array<{ name: string; entity_type_name: string }>;
  videos?: Array<{ uri: string; title: string; duration: number }>;
}

interface ReleaseDetailsDialogProps {
  release: ReleaseDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReleaseDetailsDialog = ({ release, open, onOpenChange }: ReleaseDetailsDialogProps) => {
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const [trackPreviews, setTrackPreviews] = useState<Record<number, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!release) return null;

  const mainImage = release.images?.find(img => img.type === 'primary')?.uri || release.images?.[0]?.uri;

  const searchAppleMusicPreview = async (trackTitle: string, artistName: string) => {
    try {
      const searchQuery = encodeURIComponent(`${trackTitle} ${artistName}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${searchQuery}&media=music&limit=1`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].previewUrl;
      }
    } catch (error) {
      console.error('Error fetching Apple Music preview:', error);
    }
    return null;
  };

  const handleTrackClick = async (trackIndex: number) => {
    const track = release.tracklist?.[trackIndex];
    if (!track) return;

    if (playingTrack === trackIndex) {
      audioRef.current?.pause();
      setPlayingTrack(null);
      return;
    }

    if (!trackPreviews[trackIndex]) {
      const artistName = release.artists?.[0]?.name || '';
      const previewUrl = await searchAppleMusicPreview(track.title, artistName);
      
      if (previewUrl) {
        setTrackPreviews(prev => ({ ...prev, [trackIndex]: previewUrl }));
        
        if (audioRef.current) {
          audioRef.current.src = previewUrl;
          audioRef.current.play();
        }
        setPlayingTrack(trackIndex);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = trackPreviews[trackIndex];
        audioRef.current.play();
      }
      setPlayingTrack(trackIndex);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl line-clamp-2">{release.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Cover Image */}
            {mainImage && (
              <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-secondary">
                <img
                  src={mainImage}
                  alt={release.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Artists */}
            {release.artists && release.artists.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Artists</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {release.artists.map((artist, idx) => (
                    <Badge key={idx} variant="secondary">{artist.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Release Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {release.year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="text-sm font-medium">{release.year}</p>
                  </div>
                </div>
              )}
              
              {release.country && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="text-sm font-medium">{release.country}</p>
                  </div>
                </div>
              )}
              
              {release.released && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Released</p>
                    <p className="text-sm font-medium">{release.released}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Genres & Styles */}
            {(release.genres || release.styles) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Genres & Styles</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {release.genres?.map((genre, idx) => (
                    <Badge key={`genre-${idx}`} className="bg-primary/10 text-primary border-primary/20">{genre}</Badge>
                  ))}
                  {release.styles?.map((style, idx) => (
                    <Badge key={`style-${idx}`} variant="outline">{style}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {release.labels && release.labels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Labels</h3>
                </div>
                <div className="space-y-1">
                  {release.labels.map((label, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{label.name}</span>
                      {label.catno && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{label.catno}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formats */}
            {release.formats && release.formats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Disc className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Formats</h3>
                </div>
                <div className="space-y-2">
                  {release.formats.map((format, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{format.qty}× {format.name}</span>
                      {format.descriptions && format.descriptions.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({format.descriptions.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracklist */}
            {release.tracklist && release.tracklist.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Tracklist</h3>
                </div>
                <div className="space-y-1">
                  {release.tracklist.map((track, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-sm py-1 hover:bg-accent/50 px-2 rounded cursor-pointer transition-colors"
                      onClick={() => handleTrackClick(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-8 text-right">{track.position}</span>
                        {playingTrack === idx ? (
                          <Pause className="h-3 w-3 text-primary" />
                        ) : (
                          <Play className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={playingTrack === idx ? "text-primary font-medium" : ""}>{track.title}</span>
                      </div>
                      {track.duration && (
                        <span className="text-muted-foreground">{track.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
                <audio 
                  ref={audioRef} 
                  onEnded={() => setPlayingTrack(null)}
                  className="hidden"
                />
              </div>
            )}

            {/* Videos */}
            {release.videos && release.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Videos</h3>
                </div>
                <div className="space-y-3">
                  {release.videos.map((video, idx) => {
                    const videoId = getYouTubeVideoId(video.uri);
                    if (!videoId) return null;
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm font-medium">{video.title}</p>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Identifiers */}
            {release.identifiers && release.identifiers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Barcode className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Identifiers</h3>
                </div>
                <div className="space-y-1">
                  {release.identifiers.map((id, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="text-muted-foreground">{id.type}:</span>{' '}
                      <span className="font-mono">{id.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {release.companies && release.companies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Companies</h3>
                </div>
                <div className="space-y-1">
                  {release.companies.map((company, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{company.name}</span>
                      <span className="text-muted-foreground ml-2">- {company.entity_type_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {release.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{release.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};