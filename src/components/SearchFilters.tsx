import { useState, useEffect } from "react";
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
  const [yearFromTouched, setYearFromTouched] = useState(false);
  const [yearToTouched, setYearToTouched] = useState(false);
  const currentYear = new Date().getFullYear();

  // Set demo values on mount
  useEffect(() => {
    if (!yearFromTouched && !filters.yearFrom) {
      onChange({ ...filters, yearFrom: '1980', yearTo: currentYear.toString() });
    }
  }, []);

  const smartYearParse = (value: string): string => {
    if (!value) return '';
    
    const numValue = parseInt(value);
    
    // If it's already a 4-digit year, return as is
    if (value.length === 4) return value;
    
    // If it's 2 digits
    if (value.length === 2) {
      // If starts with 0-2, assume 2000s (00-29 -> 2000-2029)
      if (numValue <= 29) {
        return `20${value}`;
      }
      // Otherwise assume 1900s (30-99 -> 1930-1999)
      return `19${value}`;
    }
    
    // If it's 3 digits or 1 digit, just return as is for now
    return value;
  };

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleYearChange = (key: 'yearFrom' | 'yearTo', value: string) => {
    if (key === 'yearFrom') setYearFromTouched(true);
    if (key === 'yearTo') setYearToTouched(true);
    
    // Just update with the raw value while typing
    onChange({ ...filters, [key]: value });
  };

  const handleYearBlur = (key: 'yearFrom' | 'yearTo', value: string) => {
    // Parse and validate only when user is done typing
    const parsedYear = smartYearParse(value);
    const yearNum = parseInt(parsedYear);
    
    // Validate year is within range
    if (parsedYear && yearNum && (yearNum < 1950 || yearNum > currentYear)) {
      // Reset to empty if out of range
      onChange({ ...filters, [key]: '' });
      return;
    }
    
    // Update with parsed year
    if (parsedYear) {
      onChange({ ...filters, [key]: parsedYear });
    }
  };

  const handleYearFocus = (key: 'yearFrom' | 'yearTo') => {
    if (key === 'yearFrom' && !yearFromTouched) {
      setYearFromTouched(true);
      onChange({ ...filters, yearFrom: '' });
    }
    if (key === 'yearTo' && !yearToTouched) {
      setYearToTouched(true);
      onChange({ ...filters, yearTo: '' });
    }
  };

  const clearFilters = () => {
    onChange({});
    setYearFromTouched(false);
    setYearToTouched(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="w-full">
      <div className="relative">
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
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

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
                  type="text"
                  placeholder="1950"
                  value={filters.yearFrom || ''}
                  onChange={(e) => handleYearChange('yearFrom', e.target.value)}
                  onBlur={(e) => handleYearBlur('yearFrom', e.target.value)}
                  onFocus={() => handleYearFocus('yearFrom')}
                  className="bg-background/50"
                  maxLength={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearTo">Year To</Label>
                <Input
                  id="yearTo"
                  type="text"
                  placeholder={currentYear.toString()}
                  value={filters.yearTo || ''}
                  onChange={(e) => handleYearChange('yearTo', e.target.value)}
                  onBlur={(e) => handleYearBlur('yearTo', e.target.value)}
                  onFocus={() => handleYearFocus('yearTo')}
                  className="bg-background/50"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="format">Format</Label>
              <Input
                id="format"
                placeholder="Vinyl, CD, Cassette..."
                value={filters.format || 'Vinyl'}
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
