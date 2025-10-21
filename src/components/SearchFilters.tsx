import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface FilterValues {
  yearFrom?: string;
  yearTo?: string;
  genre?: string;
  style?: string;
  label?: string;
  artist?: string;
  format?: string;
  country?: string;
}

interface SearchFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onSearch: () => void;
}

export const SearchFilters = ({ filters, onChange, onSearch }: SearchFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="w-full">
      <Button
        variant="glass"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearFilters();
            }}
            className="h-auto p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Button>

      {isExpanded && (
        <Card className="bg-card/50 backdrop-blur-md border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter Results</CardTitle>
              <Button onClick={() => { onSearch(); setIsExpanded(false); }} size="sm">
                Search
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="US, UK, Germany..."
                value={filters.country || ''}
                onChange={(e) => updateFilter('country', e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearFrom">Year From</Label>
                <Input
                  id="yearFrom"
                  type="number"
                  placeholder="1960"
                  value={filters.yearFrom || ''}
                  onChange={(e) => updateFilter('yearFrom', e.target.value)}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearTo">Year To</Label>
                <Input
                  id="yearTo"
                  type="number"
                  placeholder="2024"
                  value={filters.yearTo || ''}
                  onChange={(e) => updateFilter('yearTo', e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  placeholder="Rock, Jazz, Electronic..."
                  value={filters.genre || ''}
                  onChange={(e) => updateFilter('genre', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  placeholder="Indie, Ambient, House..."
                  value={filters.style || ''}
                  onChange={(e) => updateFilter('style', e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="Record label name"
                value={filters.label || ''}
                onChange={(e) => updateFilter('label', e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                placeholder="Artist name"
                value={filters.artist || ''}
                onChange={(e) => updateFilter('artist', e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Input
                id="format"
                placeholder="Vinyl, CD, Cassette..."
                value={filters.format || ''}
                onChange={(e) => updateFilter('format', e.target.value)}
                className="bg-background/50"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
