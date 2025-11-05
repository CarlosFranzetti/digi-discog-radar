import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LabelCardProps {
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

export const LabelCard = ({ label, onClick }: LabelCardProps) => {
  const logoImage = label.thumb;
  const displayCountry = label.country || 'Unknown';

  return (
    <Card 
      className="overflow-hidden cursor-pointer group bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-secondary">
        {logoImage ? (
          <img
            src={logoImage}
            alt={label.title}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {label.releaseCount && (
          <Badge className="absolute top-2 right-2 bg-primary/90">
            {label.releaseCount}
          </Badge>
        )}
        {label.matchedCount && !label.releaseCount && (
          <Badge className="absolute top-2 right-2 bg-accent/90">
            {label.matchedCount} matched
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {label.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {displayCountry}
        </p>
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <span className="text-xs text-muted-foreground">Label</span>
      </CardFooter>
    </Card>
  );
};