import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, Globe, Tag, Disc, Building2, Hash, Barcode, Play, Pause, Video } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Extend Window interface for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
  }
}

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
  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

  // Reset playing video when dialog closes
  useEffect(() => {
    if (!open) {
      setPlayingVideoIndex(null);
      pauseAllPlayers();
    }
  }, [open]);

  

  

  // Player control helpers using YouTube postMessage API
  const sendPlayerCommand = (index: number, command: 'playVideo' | 'pauseVideo') => {
    const frame = iframeRefs.current[index];
    try {
      frame?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        'https://www.youtube.com'
      );
    } catch (e) {
      // no-op
    }
  };

  const pauseAllPlayers = () => {
    Object.keys(iframeRefs.current).forEach((key) => {
      const i = Number(key);
      sendPlayerCommand(i, 'pauseVideo');
    });
  };

  const playWithRetry = (index: number, attempts = 6) => {
    if (attempts <= 0) return;
    const frame = iframeRefs.current[index];
    if (frame?.contentWindow) {
      sendPlayerCommand(index, 'playVideo');
    } else {
      setTimeout(() => playWithRetry(index, attempts - 1), 200);
    }
  };

  // Extract YouTube ID from URLs
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Prepare YouTube videos with valid IDs
  const videoItems = (release?.videos ?? [])
    .map((video, originalIndex) => {
      const videoId = getYouTubeVideoId(video.uri);
      return videoId ? { video, videoId, originalIndex } : null;
    })
    .filter(Boolean) as Array<{ video: { uri: string; title: string; duration: number }, videoId: string, originalIndex: number }>;

  // Match tracks with YouTube videos based on title similarity
  const findMatchingVideo = (trackTitle: string): number | null => {
    if (!videoItems.length) return null;
    
    const normalizeTitle = (title: string) => 
      title.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    
    const normalizedTrack = normalizeTitle(trackTitle);
    
    return videoItems.findIndex(({ video }) => {
      const normalizedVideo = normalizeTitle(video.title);
      // Check if track title is in video title or vice versa
      return normalizedVideo.includes(normalizedTrack) || normalizedTrack.includes(normalizedVideo);
    });
  };

  const handleTrackClick = (videoIndex: number) => {
    const videoId = videoItems[videoIndex]?.videoId;
    if (!videoId) return;
    
    if (playingVideoIndex === videoIndex) {
      // Pause currently playing
      sendPlayerCommand(videoIndex, 'pauseVideo');
      setPlayingVideoIndex(null);
    } else {
      // Pause others and play selected
      pauseAllPlayers();
      setPlayingVideoIndex(videoIndex);
      // Ensure player is ready, then play
      playWithRetry(videoIndex);
    }
  };

  if (!release) return null;

  const mainImage = release.images?.find(img => img.type === 'primary')?.uri || release.images?.[0]?.uri;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl line-clamp-2">{release.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Release details and information
          </DialogDescription>
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
                  {release.tracklist.map((track, idx) => {
                    const videoIndex = findMatchingVideo(track.title);
                    const hasVideo = videoIndex !== null && videoIndex >= 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between text-sm py-1 px-2 rounded transition-colors ${
                          hasVideo ? 'hover:bg-accent/50 cursor-pointer' : ''
                        }`}
                        onClick={hasVideo ? () => handleTrackClick(videoIndex) : undefined}
                      >
                      <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-8 text-right">{track.position}</span>
                          {hasVideo && (
                            playingVideoIndex === videoIndex 
                              ? <Pause className="h-3 w-3 text-primary" />
                              : <Play className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>{track.title}</span>
                        </div>
                        {track.duration && (
                          <span className="text-muted-foreground">{track.duration}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  {videoItems.map((item, idx) => (
                    <div 
                      key={idx}
                      id={`video-${idx}`}
                      className="space-y-2 rounded-lg transition-all duration-300"
                    >
                      <p className="text-sm font-medium">{item.video.title}</p>
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary">
                        <iframe
                          ref={(el) => { iframeRefs.current[idx] = el; }}
                          src={`https://www.youtube.com/embed/${item.videoId}?enablejsapi=1&origin=${window.location.origin}&playsinline=1&rel=0&modestbranding=1`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="eager"
                          referrerPolicy="strict-origin-when-cross-origin"
                          title={item.video.title}
                        />
                      </div>
                    </div>
                  ))}
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