import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/components/SearchFilters";
import { ReleaseCard } from "@/components/ReleaseCard";
import { ReleaseListItem } from "@/components/ReleaseListItem";
import { ReleaseDetailsDialog } from "@/components/ReleaseDetailsDialog";
import { LabelScan } from "@/components/LabelScan";
import { LabelCard } from "@/components/LabelCard";
import { LabelListItem } from "@/components/LabelListItem";
import { discogsService, DiscogsSearchParams } from "@/services/discogsService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Disc3, LayoutGrid, List, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

const Index = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({ format: 'Vinyl' });
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'year' | 'title' | 'artist'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [perPage, setPerPage] = useState(200);
  
  // Label scan state
  const [labelScanActive, setLabelScanActive] = useState(false);
  const [labelResults, setLabelResults] = useState<any>(null);
  const [labelViewMode, setLabelViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [releaseViewMode, setReleaseViewMode] = useState<'grid' | 'list'>('list');
  const [mainViewMode, setMainViewMode] = useState<'grid' | 'list'>('grid');
  const [labelSortBy, setLabelSortBy] = useState<'name' | 'releases' | 'year'>('releases');
  const [labelSortOrder, setLabelSortOrder] = useState<'asc' | 'desc'>('desc');
  const [labelPerPage, setLabelPerPage] = useState(50);
  const [labelCurrentPage, setLabelCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['discogs-search', searchQuery, filters, searchTrigger, currentPage, sortBy, sortOrder, perPage],
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
        country: filters.country,
        page: currentPage,
        per_page: perPage,
        sort: sortBy,
        sort_order: sortOrder,
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
    setCurrentPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleLabelScanResults = (results: any, isLoading: boolean) => {
    setLabelResults(results);
    setIsLoadingLabels(isLoading);
    if (results) {
      setLabelScanActive(true);
      setSelectedLabel(null);
      setLabelCurrentPage(1); // Reset to first page on new results
    }
  };

  const handleLabelClick = (labelName: string) => {
    setSelectedLabel(labelName);
    setLabelResults(null); // Clear label results to show releases view
  };

  const clearLabelScan = () => {
    setLabelScanActive(false);
    setLabelResults(null);
    setSelectedLabel(null);
    setLabelCurrentPage(1);
  };

  const backToLabels = () => {
    setSelectedLabel(null);
    setLabelCurrentPage(1);
  };

  // Sort and paginate label results
  const sortedAndPaginatedLabels = labelResults?.results ? (() => {
    let sorted = [...labelResults.results];
    
    // Sort
    sorted.sort((a: any, b: any) => {
      let comparison = 0;
      if (labelSortBy === 'name') {
        comparison = a.title.localeCompare(b.title);
      } else if (labelSortBy === 'releases') {
        comparison = (a.releaseCount || 0) - (b.releaseCount || 0);
      } else if (labelSortBy === 'year') {
        // Sort by most recent release year (not implemented in data, fallback to name)
        comparison = a.title.localeCompare(b.title);
      }
      return labelSortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Paginate
    const startIndex = (labelCurrentPage - 1) * labelPerPage;
    const endIndex = startIndex + labelPerPage;
    const paginated = sorted.slice(startIndex, endIndex);
    
    return {
      results: paginated,
      totalPages: Math.ceil(sorted.length / labelPerPage),
      totalItems: sorted.length
    };
  })() : null;

  // Query for label releases
  const { data: labelReleases, isLoading: isLoadingLabelReleases } = useQuery({
    queryKey: ['label-releases', selectedLabel],
    queryFn: async () => {
      return discogsService.search({
        label: selectedLabel!,
        per_page: 100,
      });
    },
    enabled: !!selectedLabel,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
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
            <LabelScan 
              initialFilters={{ country: filters.country, yearFrom: filters.yearFrom, yearTo: filters.yearTo, genre: filters.genre || filters.style }}
              onResults={handleLabelScanResults}
            />
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
              onSearch={handleSearch}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Label Scan Results - Show labels OR label's releases */}
        {labelScanActive && !selectedLabel && sortedAndPaginatedLabels && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Label Radar Results</h2>
                  <span className="text-sm text-muted-foreground">
                    {sortedAndPaginatedLabels.totalItems} labels found
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Page {labelCurrentPage} of {sortedAndPaginatedLabels.totalPages}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={labelSortBy} onValueChange={(value: any) => { setLabelSortBy(value); setLabelCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="releases">Releases</SelectItem>
                    <SelectItem value="name">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={labelSortOrder} onValueChange={(value: any) => { setLabelSortOrder(value); setLabelCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={labelPerPage.toString()} onValueChange={(value) => { setLabelPerPage(parseInt(value)); setLabelCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant={labelViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLabelViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={labelViewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLabelViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLabelScan}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoadingLabels && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingLabels && sortedAndPaginatedLabels.results.length > 0 && (
              labelViewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedAndPaginatedLabels.results.map((label: any) => (
                    <LabelCard
                      key={label.id}
                      label={label}
                      onClick={() => handleLabelClick(label.title)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedAndPaginatedLabels.results.map((label: any) => (
                    <LabelListItem
                      key={label.id}
                      label={label}
                      onClick={() => handleLabelClick(label.title)}
                    />
                  ))}
                </div>
              )
            )}

            {sortedAndPaginatedLabels.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => { setLabelCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={labelCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, sortedAndPaginatedLabels.totalPages) }, (_, i) => {
                    let pageNum;
                    if (sortedAndPaginatedLabels.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (labelCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (labelCurrentPage >= sortedAndPaginatedLabels.totalPages - 2) {
                      pageNum = sortedAndPaginatedLabels.totalPages - 4 + i;
                    } else {
                      pageNum = labelCurrentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => { setLabelCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          isActive={labelCurrentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => { setLabelCurrentPage(p => Math.min(sortedAndPaginatedLabels.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={labelCurrentPage === sortedAndPaginatedLabels.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {!isLoadingLabels && sortedAndPaginatedLabels.results.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No labels found. Try adjusting your filters.
              </p>
            )}
          </div>
        )}

        {/* Label Releases View */}
        {labelScanActive && selectedLabel && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={backToLabels}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">{selectedLabel}</h2>
                {labelReleases && (
                  <span className="text-sm text-muted-foreground">
                    {labelReleases.pagination?.items || 0} releases
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={releaseViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReleaseViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={releaseViewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReleaseViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLabelScan}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoadingLabelReleases && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingLabelReleases && labelReleases?.results && labelReleases.results.length > 0 && (
              releaseViewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {labelReleases.results.map((release: any) => (
                    <ReleaseCard
                      key={release.id}
                      release={release}
                      onClick={() => handleReleaseClick(release.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {labelReleases.results.map((release: any) => (
                    <ReleaseListItem
                      key={release.id}
                      release={release}
                      onClick={() => handleReleaseClick(release.id)}
                    />
                  ))}
                </div>
              )
            )}

            {!isLoadingLabelReleases && (!labelReleases || labelReleases.results?.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">
                No releases found for this label
              </p>
            )}
          </div>
        )}
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
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {data.pagination.items.toLocaleString()} results
                </p>
                <p className="text-xs text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.pages}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={perPage.toString()} onValueChange={(value) => { setPerPage(parseInt(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant={mainViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMainViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={mainViewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMainViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {data.pagination.pages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (data.pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.pages - 2) {
                      pageNum = data.pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === data.pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {mainViewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.results.map((release) => (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    onClick={() => handleReleaseClick(release.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data.results.map((release) => (
                  <ReleaseListItem
                    key={release.id}
                    release={release}
                    onClick={() => handleReleaseClick(release.id)}
                  />
                ))}
              </div>
            )}

            {data.pagination.pages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (data.pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.pages - 2) {
                      pageNum = data.pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === data.pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
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
