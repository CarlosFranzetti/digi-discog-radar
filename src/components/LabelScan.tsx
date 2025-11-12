import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ScanSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LabelCard } from "@/components/LabelCard";
import { ReleaseCard } from "@/components/ReleaseCard";
import { ReleaseDetailsDialog } from "@/components/ReleaseDetailsDialog";
import { discogsService } from "@/services/discogsService";
import { useToast } from "@/hooks/use-toast";

const GENRES = [
  "Acid",
  "Acid House",
  "Breakbeat",
  "Deep House",
  "House",
  "Progressive Breaks",
  "Progressive House",
  "Tech House",
  "Techno",
  "Trance"
].sort((a, b) => a.localeCompare(b));

export const LabelScan = ({ 
  initialFilters,
  onResults 
}: { 
  initialFilters?: Partial<{ country: string; yearFrom: string; yearTo: string; genre: string }>;
  onResults?: (results: any, isLoading: boolean) => void;
}) => {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [genre, setGenre] = useState("");
  const [similarTo, setSimilarTo] = useState("");
  const [minReleases, setMinReleases] = useState("200");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Prefill from global filters only on mount (not on filter changes)
  useEffect(() => {
    if (!initialFilters) return;
    if (initialFilters.country) setCountry(initialFilters.country);
    if (initialFilters.yearFrom) setYearFrom(initialFilters.yearFrom);
    if (initialFilters.yearTo) setYearTo(initialFilters.yearTo);
    if (initialFilters.genre) {
      const match = GENRES.find((g) => g.toLowerCase() === initialFilters.genre!.toLowerCase());
      if (match) setGenre(match);
    }
  }, []); // Empty deps - only run once on mount

  const { data: labelResults, isLoading } = useQuery({
    queryKey: ['label-scan', country, yearFrom, yearTo, genre, similarTo, minReleases, searchTrigger],
    queryFn: async () => {
      if (onResults) onResults(null, true);
      // Build search query - prioritize "similar to" field if provided
      let searchQuery = similarTo || '';

      // Build base search (broad) and filter client-side for flexibility
      const searchParams: any = {
        type: 'release',
        per_page: 100,
      };

      if (searchQuery) {
        searchParams.query = searchQuery;
      }

      if (country) {
        searchParams.country = country;
      }

      // Do NOT pass genre/year to API directly to avoid over-restricting; filter client-side instead
      const searchResponse = await discogsService.search(searchParams);
      const releases: any[] = searchResponse?.results || [];

      const term = (genre || '').toLowerCase().trim();
      const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
      const toYear = yearTo ? parseInt(yearTo, 10) : undefined;

      const matchesGenre = (r: any) => {
        if (!term) return true;
        const styles: string[] = Array.isArray(r.style) ? r.style : [];
        const genres: string[] = Array.isArray(r.genre) ? r.genre : [];
        const all = [...styles, ...genres].map((s) => (s || '').toLowerCase());
        // substring match so "house" matches "tech house", "acid" matches "acid house", etc.
        return all.some((g) => g.includes(term));
      };

      const matchesYear = (r: any) => {
        if (!fromYear && !toYear) return true;
        const y = typeof r.year === 'number' ? r.year : parseInt(String(r.year || ''), 10);
        if (Number.isNaN(y)) return false;
        if (fromYear && y < fromYear) return false;
        if (toYear && y > toYear) return false;
        return true;
      };

      const matchesCountry = (r: any) => {
        if (!country) return true;
        return String(r.country || '').toLowerCase() === country.toLowerCase();
      };

      // Primary filtered set; if empty, fall back to unfiltered to provide closest results
      let filtered = releases.filter((r) => matchesGenre(r) && matchesYear(r) && matchesCountry(r));
      if (filtered.length === 0) {
        filtered = releases; // provide closest available matches
      }

      // Extract unique labels and count matched releases
      const labelMap = new Map<string, any>();
      filtered.forEach((release: any) => {
        const labels: string[] = Array.isArray(release.label) ? release.label : (release.label ? [release.label] : []);
        labels.forEach((labelName: string) => {
          const existing = labelMap.get(labelName);
          if (existing) {
            existing.matchedCount = (existing.matchedCount || 0) + 1;
            // prefer first available thumb, keep existing if already set
            if (!existing.thumb && (release.thumb || release.cover_image)) {
              existing.thumb = release.thumb || release.cover_image;
            }
            // Keep a country if not already set
            if (!existing.country && release.country) {
              existing.country = release.country;
            }
          } else {
            labelMap.set(labelName, {
              id: `label-${labelMap.size}`,
              title: labelName,
              thumb: release.thumb || release.cover_image,
              country: release.country,
              resource_url: release.resource_url,
              matchedCount: 1,
            });
          }
        });
      });

      let labels = Array.from(labelMap.values());

      // If we still have no labels, return empty response early
      if (labels.length === 0) {
        return {
          results: [],
          pagination: { page: 1, pages: 1, per_page: 0, items: 0, urls: {} },
        };
      }

      // Get approximate TOTAL release counts per label - batch in smaller groups with delays
      const minReleasesNum = parseInt(minReleases);
      labels.sort((a, b) => (b.matchedCount || 0) - (a.matchedCount || 0));
      const topForCounting = labels.slice(0, Math.min(50, labels.length)); // Reduce to 50

      try {
        const counts: Array<{ title: string; total: number }> = [];
        const batchSize = 5; // Process 5 at a time
        
        for (let i = 0; i < topForCounting.length; i += batchSize) {
          const batch = topForCounting.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (l: any) => {
              try {
                const resp = await discogsService.search({ type: 'release', label: l.title, per_page: 1 });
                return { title: l.title, total: resp?.pagination?.items || l.matchedCount };
              } catch {
                return { title: l.title, total: l.matchedCount };
              }
            })
          );
          counts.push(...batchResults);
          // Add delay between batches
          if (i + batchSize < topForCounting.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        const totalMap = new Map(counts.map((c) => [c.title, c.total]));
        labels = labels.map((l: any) => ({
          ...l,
          releaseCount: totalMap.get(l.title) ?? l.matchedCount,
        }));
      } catch {
        // Fallback to matchedCount if counting fails
        labels = labels.map((l: any) => ({ ...l, releaseCount: l.matchedCount }));
      }

      // Final sort by total releases desc, then by matchedCount desc
      // Filter by maximum releases (200+ means no upper limit)
      const uniqueLabels = labels
        .filter((l: any) => {
          if (minReleasesNum === 200) return true; // 200+ means no limit
          return (l.releaseCount || 0) <= minReleasesNum;
        })
        .sort((a: any, b: any) => (b.releaseCount || 0) - (a.releaseCount || 0) || (b.matchedCount || 0) - (a.matchedCount || 0));

      const result = {
        results: uniqueLabels,
        pagination: {
          page: 1,
          pages: 1,
          per_page: uniqueLabels.length,
          items: uniqueLabels.length,
          urls: {},
        },
      };
      
      if (onResults) onResults(result, false);
      return result;
    },
    enabled: searchTrigger > 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: labelReleases, isLoading: isLoadingReleases } = useQuery({
    queryKey: ['label-releases', selectedLabel],
    queryFn: async () => {
      return discogsService.search({
        label: selectedLabel!,
        per_page: 100,
      });
    },
    enabled: !!selectedLabel,
  });

  const { data: releaseDetails } = useQuery({
    queryKey: ['release-details', selectedReleaseId],
    queryFn: () => discogsService.getRelease(selectedReleaseId!),
    enabled: !!selectedReleaseId,
  });

  const handleScan = () => {
    if (!country && !genre && !yearFrom && !yearTo && !similarTo) {
      toast({
        title: "Filters required",
        description: "Please enter at least one filter or a label name to find similar labels",
        variant: "destructive",
      });
      return;
    }
    
    // Immediately notify parent to clear search results
    if (onResults) {
      onResults(null, true);
      setIsPopoverOpen(false);
    }
    
    setSearchTrigger(prev => prev + 1);
  };

  const handleLabelClick = (labelName: string) => {
    setSelectedLabel(labelName);
    setIsPopoverOpen(false);
  };

  const handleReleaseClick = (releaseId: number) => {
    setSelectedReleaseId(releaseId);
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ScanSearch className="h-4 w-4" />
            Label Radar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 z-[100] bg-popover" align="end" sideOffset={8}>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="similarTo">Similar To (Label Name)</Label>
                <Input
                  id="similarTo"
                  placeholder="e.g., Drumcode, Anjunabeats"
                  value={similarTo}
                  onChange={(e) => setSimilarTo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find labels similar to this one
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="e.g., US, UK, DE"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="yearFrom">Year From</Label>
                  <Input
                    id="yearFrom"
                    type="number"
                    placeholder="1990"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearTo">Year To</Label>
                  <Input
                    id="yearTo"
                    type="number"
                    placeholder="2024"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genre">Genre (Optional)</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="All genres" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minReleases">Max Releases Per Label</Label>
                <Select value={minReleases} onValueChange={setMinReleases}>
                  <SelectTrigger id="minReleases">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleScan} className="w-full" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Scanning..." : "Scan Labels"}
            </Button>

            {!onResults && labelResults && labelResults.results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Found {labelResults.results.length} labels
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {labelResults.results.map((label: any) => (
                    <LabelCard
                      key={label.id}
                      label={label}
                      onClick={() => handleLabelClick(label.title)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!onResults && labelResults && labelResults.results.length === 0 && searchTrigger > 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No labels found. Try adjusting your filters.
              </p>
            )}
            
            {onResults && searchTrigger > 0 && !isLoading && labelResults && labelResults.results.length > 0 && (
              <p className="text-sm text-primary text-center py-2">
                Results displayed in main area
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!onResults && (
        <Dialog open={!!selectedLabel} onOpenChange={(open) => !open && setSelectedLabel(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedLabel} - Releases</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLabel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              List of releases for this label
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingReleases ? (
            <div className="text-center py-8">Loading releases...</div>
          ) : labelReleases && labelReleases.results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {labelReleases.results.map((release: any) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onClick={() => handleReleaseClick(release.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No releases found for this label
            </div>
          )}
        </DialogContent>
      </Dialog>
      )}

      <ReleaseDetailsDialog
        release={releaseDetails}
        open={!!selectedReleaseId}
        onOpenChange={(open) => !open && setSelectedReleaseId(null)}
      />
    </>
  );
};
