import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import { ReleaseCard } from "@/components/ReleaseCard";
import { ReleaseDetailsDialog } from "@/components/ReleaseDetailsDialog";
import { discogsService, DiscogsSearchParams } from "@/services/discogsService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Disc3 } from "lucide-react";

interface FilterValues {
  yearFrom?: string;
  yearTo?: string;
  genre?: string;
  style?: string;
  label?: string;
  artist?: string;
  format?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['discogs-search', searchQuery, filters, searchTrigger],
    queryFn: async () => {
      if (!searchQuery && !Object.keys(filters).length) {
        return null;
      }

      const searchParams: DiscogsSearchParams = {
        query: searchQuery,
        type: 'release',
        genre: filters.genre,
        style: filters.style,
        label: filters.label,
        artist: filters.artist,
        format: filters.format,
      };

      // Handle year range
      if (filters.yearFrom || filters.yearTo) {
        const yearFrom = filters.yearFrom || '1900';
        const yearTo = filters.yearTo || new Date().getFullYear().toString();
        searchParams.year = `${yearFrom}-${yearTo}`;
      }

      return discogsService.search(searchParams);
    },
    enabled: searchTrigger > 0,
  });

  const handleSearch = () => {
    if (!searchQuery.trim() && !Object.keys(filters).length) {
      toast({
        title: "Search required",
        description: "Please enter a search term or apply filters",
        variant: "destructive",
      });
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const { data: releaseDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['release-details', selectedReleaseId],
    queryFn: () => discogsService.getRelease(selectedReleaseId!),
    enabled: selectedReleaseId !== null && dialogOpen,
  });

  const handleReleaseClick = (releaseId: number) => {
    setSelectedReleaseId(releaseId);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Disc3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Discogs Explorer
              </h1>
              <p className="text-sm text-muted-foreground">Discover and explore music</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search artists, albums, labels..."
            />
            
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading results. Please try again.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !error && data?.results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {data.pagination.items.toLocaleString()} results
              </p>
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.results.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onClick={() => handleReleaseClick(release.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <Disc3 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Start Your Music Journey</h2>
            <p className="text-muted-foreground max-w-md">
              Search for your favorite artists, albums, or labels using the search bar above.
              Use advanced filters to narrow down your results by year, genre, and more.
            </p>
          </div>
        )}
      </main>

      <ReleaseDetailsDialog
        release={releaseDetails}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Index;
