import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { discogsService, DiscogsSearchParams } from "@/services/discogsService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Building2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const GENRES = [
  "All Genres",
  "Blues",
  "Brass & Military",
  "Children's",
  "Classical",
  "Electronic",
  "Folk, World, & Country",
  "Funk / Soul",
  "Hip Hop",
  "Jazz",
  "Latin",
  "Non-Music",
  "Pop",
  "Reggae",
  "Rock",
  "Stage & Screen"
].sort();

interface LabelResult {
  name: string;
  releaseCount: number;
  genres: string[];
  countries: string[];
  yearRange: string;
}

interface LabelScanFilters {
  country?: string;
  yearFrom?: string;
  yearTo?: string;
  genre?: string;
  similarTo?: string;
  maxLabels: number;
}

const LabelScan = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LabelScanFilters>({
    maxLabels: 50,
  });
  const [searchTrigger, setSearchTrigger] = useState(0);

  // SEO: title and meta description
  useEffect(() => {
    document.title = "Label Scan | Discogs Explorer";
    const desc = "Scan record labels by year, country, and genre with fuzzy matching and similar-to search.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  const { data: labelResults, isLoading, error } = useQuery({
    queryKey: ['label-scan', filters, searchTrigger],
    queryFn: async () => {
      if (!filters.country && !filters.yearFrom && !filters.yearTo && !filters.genre && !filters.similarTo) {
        return [];
      }

      try {
        // Build search parameters for releases
        const searchParams: DiscogsSearchParams = {
          type: 'release',
          page: 1,
          per_page: 200, // Get more results for better label extraction
        };

        // Add similarTo as query if provided
        if (filters.similarTo?.trim()) {
          searchParams.query = filters.similarTo.trim();
        }

        // Add genre filter (fuzzy matching)
        if (filters.genre && filters.genre !== "All Genres") {
          searchParams.genre = filters.genre;
        }

        // Add year range
        if (filters.yearFrom || filters.yearTo) {
          const yearFrom = filters.yearFrom || '1900';
          const yearTo = filters.yearTo || new Date().getFullYear().toString();
          searchParams.year = `${yearFrom}-${yearTo}`;
        }

        // Add country
        if (filters.country?.trim()) {
          searchParams.country = filters.country.trim();
        }

        const response = await discogsService.search(searchParams);
        
        if (!response.results || response.results.length === 0) {
          return [];
        }

        // Extract labels from releases
        const labelMap = new Map<string, {
          releaseCount: number;
          genres: Set<string>;
          countries: Set<string>;
          years: number[];
        }>();

        response.results.forEach(release => {
          if (release.label && Array.isArray(release.label)) {
            release.label.forEach(labelName => {
              if (!labelMap.has(labelName)) {
                labelMap.set(labelName, {
                  releaseCount: 0,
                  genres: new Set(),
                  countries: new Set(),
                  years: []
                });
              }

              const labelData = labelMap.get(labelName)!;
              labelData.releaseCount++;

              if (release.genre) {
                release.genre.forEach(g => labelData.genres.add(g));
              }
              if (release.country) {
                labelData.countries.add(release.country);
              }
              if (release.year) {
                const year = parseInt(release.year);
                if (!isNaN(year)) {
                  labelData.years.push(year);
                }
              }
            });
          }
        });

        // Convert to results array
        const results: LabelResult[] = Array.from(labelMap.entries())
          .map(([name, data]) => ({
            name,
            releaseCount: data.releaseCount,
            genres: Array.from(data.genres),
            countries: Array.from(data.countries),
            yearRange: data.years.length > 0 
              ? `${Math.min(...data.years)}-${Math.max(...data.years)}`
              : 'Unknown'
          }))
          .sort((a, b) => b.releaseCount - a.releaseCount)
          .slice(0, filters.maxLabels);

        return results;
      } catch (error) {
        console.error('Label scan error:', error);
        throw error;
      }
    },
    enabled: searchTrigger > 0,
  });

  const handleScan = () => {
    if (!filters.country && !filters.yearFrom && !filters.yearTo && 
        !filters.genre && !filters.similarTo) {
      toast({
        title: "Filter required",
        description: "Please add at least one filter to scan for labels",
        variant: "destructive",
      });
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };

  const updateFilter = (key: keyof LabelScanFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Label Scan
                </h1>
                <p className="text-sm text-muted-foreground">Discover record labels by criteria</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Filters */}
          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Label Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Similar To */}
              <div className="space-y-2">
                <Label htmlFor="similarTo">Similar To (Optional)</Label>
                <Input
                  id="similarTo"
                  placeholder="Enter a label name to find similar labels..."
                  value={filters.similarTo || ''}
                  onChange={(e) => updateFilter('similarTo', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="US, UK, Germany, Japan..."
                  value={filters.country || ''}
                  onChange={(e) => updateFilter('country', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Year Range */}
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

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={filters.genre || "All Genres"} onValueChange={(value) => updateFilter('genre', value)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Labels */}
              <div className="space-y-2">
                <Label htmlFor="maxLabels">Max Labels</Label>
                <Select value={filters.maxLabels.toString()} onValueChange={(value) => updateFilter('maxLabels', parseInt(value))}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="75">75</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleScan} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Labels
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="pt-6">
                <p className="text-destructive text-center">
                  Error scanning labels. Please try again with different filters.
                </p>
              </CardContent>
            </Card>
          )}

          {labelResults && labelResults.length > 0 && (
            <div className="space-y-4">
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-center">
                    Found {labelResults.length} labels
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {labelResults.map((label, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{label.name}</h3>
                        <Badge variant="secondary">
                          {label.releaseCount} releases
                        </Badge>
                      </div>
                      
                      {label.genres.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground mb-1">Genres:</p>
                          <div className="flex flex-wrap gap-1">
                            {label.genres.slice(0, 5).map((genre, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                            {label.genres.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{label.genres.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {label.countries.length > 0 && (
                          <span>Countries: {label.countries.slice(0, 3).join(', ')}</span>
                        )}
                        {label.yearRange !== 'Unknown' && (
                          <span>Years: {label.yearRange}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {labelResults && labelResults.length === 0 && searchTrigger > 0 && !isLoading && (
            <Card className="bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No labels found with the current filters. Try adjusting your criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LabelScan;