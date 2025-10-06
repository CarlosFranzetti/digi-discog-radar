import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ScanSearch } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { discogsService } from "@/services/discogsService";
import { useToast } from "@/hooks/use-toast";

const GENRES = ["House", "Deep House", "Techno", "Tech House", "Breakbeat"];

export const LabelScan = () => {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseLimit, setReleaseLimit] = useState("50");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: labelResults, isLoading } = useQuery({
    queryKey: ['label-scan', country, yearFrom, yearTo, genre, releaseLimit, searchTrigger],
    queryFn: async () => {
      const searchParams: any = {
        type: 'label',
        country: country || undefined,
        genre: genre || undefined,
        per_page: parseInt(releaseLimit),
      };

      if (yearFrom || yearTo) {
        const from = yearFrom || '1900';
        const to = yearTo || new Date().getFullYear().toString();
        searchParams.year = `${from}-${to}`;
      }

      return discogsService.search(searchParams);
    },
    enabled: searchTrigger > 0,
  });

  const handleScan = () => {
    if (!country && !genre && !yearFrom && !yearTo) {
      toast({
        title: "Filters required",
        description: "Please select at least one filter",
        variant: "destructive",
      });
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ScanSearch className="h-4 w-4" />
          Label Scan
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[100]" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Label Scan</h3>
            <p className="text-sm text-muted-foreground">
              Search for labels by country, year, and genre
            </p>
          </div>

          <div className="space-y-3">
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
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="releaseLimit">Release Limit</Label>
              <Select value={releaseLimit} onValueChange={setReleaseLimit}>
                <SelectTrigger id="releaseLimit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <p className="text-sm font-medium">
                Found {labelResults.results.length} labels:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {labelResults.results.slice(0, 20).map((label: any) => (
                  <Badge key={label.id} variant="secondary" className="text-xs">
                    {label.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
