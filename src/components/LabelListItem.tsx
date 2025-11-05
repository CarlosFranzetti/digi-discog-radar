import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LabelListItemProps {
  label: {
    id: number | string;
    title: string;
    thumb?: string;
    country?: string;
    resource_url?: string;
    releaseCount?: number;
    matchedCount?: number;
  };
  onClick?: () => void;
}

export const LabelListItem = ({ label, onClick }: LabelListItemProps) => {
  const logoImage = label.thumb;
  const displayCountry = label.country || 'Unknown';

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg cursor-pointer group bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
        {logoImage ? (
          <img
            src={logoImage}
            alt={label.title}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
          {label.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {displayCountry}
        </p>
      </div>
      
      <div className="flex gap-2">
        {label.releaseCount && (
          <Badge variant="secondary">
            {label.releaseCount} releases
          </Badge>
        )}
        {label.matchedCount && (
          <Badge variant="outline">
            {label.matchedCount} matched
          </Badge>
        )}
      </div>
    </div>
  );
};
