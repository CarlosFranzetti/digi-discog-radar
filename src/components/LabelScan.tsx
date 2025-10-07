import { useState } from "react";
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
];

export const LabelScan = () => {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [genre, setGenre] = useState("");
  const [similarTo, setSimilarTo] = useState("");
  const [releaseLimit, setReleaseLimit] = useState("50");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { data: labelResults, isLoading } = useQuery({
    queryKey: ['label-scan', country, yearFrom, yearTo, genre, similarTo, releaseLimit, searchTrigger],
    queryFn: async () => {
      // Build search query - prioritize "similar to" field if provided
      let searchQuery = similarTo || '';
      
      // Search for releases with flexible filtering
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
      
      // If genre is selected, search for it broadly (will match partial genres)
      if (genre) {
        searchParams.genre = genre;
      }

      if (yearFrom || yearTo) {
        const from = yearFrom || '1900';
        const to = yearTo || new Date().getFullYear().toString();
        searchParams.year = `${from}-${to}`;
      }

      const results = await discogsService.search(searchParams);
      
      // Extract unique labels from releases with release counts
      const labelMap = new Map<string, any>();
      
      results.results.forEach((release: any) => {
        if (release.label && release.label.length > 0) {
          release.label.forEach((labelName: string) => {
            if (labelMap.has(labelName)) {
              // Increment release count for this label
              const existing = labelMap.get(labelName);
              existing.releaseCount = (existing.releaseCount || 1) + 1;
            } else {
              labelMap.set(labelName, {
                id: `label-${labelMap.size}`,
                title: labelName,
                thumb: release.thumb || release.cover_image,
                country: release.country,
                resource_url: release.resource_url,
                releaseCount: 1,
              });
            }
          });
        }
      });

      // Convert to array and sort by release count
      const uniqueLabels = Array.from(labelMap.values())
        .sort((a, b) => (b.releaseCount || 0) - (a.releaseCount || 0))
        .slice(0, parseInt(releaseLimit));
      
      return {
        results: uniqueLabels,
        pagination: {
          page: 1,
          pages: 1,
          per_page: uniqueLabels.length,
          items: uniqueLabels.length,
          urls: {}
        }
      };
    },
    enabled: searchTrigger > 0,
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
            Label Scan
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 z-[100] bg-popover" align="end" sideOffset={8}>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Label Scan</h3>
              <p className="text-sm text-muted-foreground">
                Search for labels by country, year, and genre
              </p>
            </div>

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
                    <SelectItem value="">All genres</SelectItem>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="releaseLimit">Max Labels</Label>
                <Select value={releaseLimit} onValueChange={setReleaseLimit}>
                  <SelectTrigger id="releaseLimit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleScan} className="w-full" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Scanning..." : "Scan Labels"}
            </Button>

            {labelResults && labelResults.results.length > 0 && (
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

            {labelResults && labelResults.results.length === 0 && searchTrigger > 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No labels found. Try adjusting your filters.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

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

      <ReleaseDetailsDialog
        release={releaseDetails}
        open={!!selectedReleaseId}
        onOpenChange={(open) => !open && setSelectedReleaseId(null)}
      />
    </>
  );
};
