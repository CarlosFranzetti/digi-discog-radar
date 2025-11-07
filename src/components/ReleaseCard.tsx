import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DiscogsRelease } from "@/services/discogsService";
import { Music } from "lucide-react";

interface ReleaseCardProps {
  release: DiscogsRelease;
  onClick?: () => void;
}

export const ReleaseCard = ({ release, onClick }: ReleaseCardProps) => {
  const coverImage = release.cover_image || release.thumb;
  const displayYear = release.year || 'Year Unknown';
  const labels = Array.isArray(release.label) ? release.label : (release.label ? [release.label] : []);
  const displayLabel = labels[0] || 'Unknown Label';
  const formats = Array.isArray(release.format) ? release.format : (release.format ? [release.format] : []);
  const genres = Array.isArray(release.genre) ? release.genre : (release.genre ? [release.genre] : []);

  return (
    <Card 
      className="overflow-hidden cursor-pointer group bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-secondary">
        {coverImage ? (
          <img
            src={coverImage}
            alt={release.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {release.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {displayLabel}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {genres.slice(0, 2).map((genre, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
            >
              {genre}
            </span>
          ))}
          {formats.slice(0, 1).map((format, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full border border-accent/20"
            >
              {format}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <span className="text-xs text-muted-foreground">{displayYear}</span>
      </CardFooter>
    </Card>
  );
};
