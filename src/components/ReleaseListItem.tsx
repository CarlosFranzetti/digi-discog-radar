import { Badge } from "@/components/ui/badge";
import { Disc } from "lucide-react";

interface ReleaseListItemProps {
  release: {
    id: number;
    title: string;
    year?: string;
    country?: string;
    format?: string[];
    label?: string[];
    genre?: string[];
    style?: string[];
    thumb?: string;
    cover_image?: string;
  };
  onClick?: () => void;
}

export const ReleaseListItem = ({ release, onClick }: ReleaseListItemProps) => {
  const coverImage = release.thumb || release.cover_image;
  const mainLabel = Array.isArray(release.label) ? release.label[0] : release.label;
  const mainFormat = Array.isArray(release.format) ? release.format[0] : release.format;

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg cursor-pointer group bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
        {coverImage ? (
          <img
            src={coverImage}
            alt={release.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
          {release.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {mainLabel && <span>{mainLabel}</span>}
          {mainLabel && release.year && <span className="mx-1">•</span>}
          {release.year && <span>{release.year}</span>}
        </p>
      </div>
      
      <div className="flex gap-2 flex-wrap justify-end">
        {release.country && (
          <Badge variant="secondary">
            {release.country}
          </Badge>
        )}
        {mainFormat && (
          <Badge variant="outline">
            {mainFormat}
          </Badge>
        )}
      </div>
    </div>
  );
};
