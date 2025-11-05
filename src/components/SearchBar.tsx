import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { discogsService } from "@/services/discogsService";
import { useQuery } from "@tanstack/react-query";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, onSearch, placeholder = "Search artists, albums, labels..." }: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch artist suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['artist-suggestions', debouncedValue],
    queryFn: () => discogsService.searchArtists(debouncedValue),
    enabled: debouncedValue.length >= 2 && showSuggestions,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setShowSuggestions(newValue.length >= 2);
  };

  const handleSuggestionClick = (artistName: string) => {
    onChange(artistName);
    setShowSuggestions(false);
    // Trigger search after a short delay to allow state to update
    setTimeout(() => onSearch(), 100);
  };

  return (
    <div className="flex gap-3 w-full" ref={wrapperRef}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions?.results && suggestions.results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-50 overflow-hidden">
            {suggestions.results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleSuggestionClick(artist.title)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
              >
                {artist.thumb && (
                  <img 
                    src={artist.thumb} 
                    alt={artist.title}
                    className="w-10 h-10 rounded-full object-cover bg-secondary"
                  />
                )}
                <span className="text-sm font-medium">{artist.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button 
        onClick={() => {
          setShowSuggestions(false);
          onSearch();
        }}
        size="lg"
        className="px-8"
      >
        Search
      </Button>
    </div>
  );
};