'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { DJCard } from '@/components/dj-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSocket } from '@/contexts/socket-context';
import { ConnectionInfo } from '@/components/ui/connection-info';
import { LiveConnectionStatus } from '@/components/ui/live-connection-status';

interface DJ {
  id: string;
  genre: string;
  rating: number;
  fans: number;
  currentClub: string | null;
  user: {
    name: string | null;
    image: string | null;
    location: string | null;
  };
}

export default function DJsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showOnlyLive, setShowOnlyLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [allDJs, setAllDJs] = useState<DJ[]>([]);
  const { isDjLive, liveRooms } = useSocket();

  const fetchDJs = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await fetch('/api/djs');
      if (!response.ok) {
        throw new Error('Failed to fetch DJs');
      }
      const data = await response.json();
      setAllDJs(data);
    } catch (error) {
      console.error('Error fetching DJs:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch DJs on mount and refresh periodically
  useEffect(() => {
    fetchDJs();
    const interval = setInterval(fetchDJs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refetch when live status changes
  useEffect(() => {
    fetchDJs();
  }, [liveRooms]);

  // Filter and sort DJs based on search, filters, and live status
  const filteredDJs = useMemo(() => {
    return allDJs
      .filter(dj => {
        const matchesSearch = dj.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            dj.genre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || dj.genre === selectedGenre;
        const matchesLocation = selectedLocation === 'all' || dj.user.location === selectedLocation;
        const matchesLiveFilter = !showOnlyLive || isDjLive(dj.id);
        
        return matchesSearch && matchesGenre && matchesLocation && matchesLiveFilter;
      })
      .sort((a, b) => {
        const aIsLive = isDjLive(a.id);
        const bIsLive = isDjLive(b.id);
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return b.rating - a.rating;
      });
  }, [allDJs, searchTerm, selectedGenre, selectedLocation, showOnlyLive, isDjLive]);

  // Get unique genres and locations for filters
  const genres = useMemo(() => {
    const uniqueGenres = new Set(allDJs.map(dj => dj.genre));
    return Array.from(uniqueGenres).sort();
  }, [allDJs]);

  const locations = useMemo(() => {
    const uniqueLocations = new Set(allDJs.map(dj => dj.user.location).filter(Boolean) as string[]);
    return Array.from(uniqueLocations).sort();
  }, [allDJs]);

  const liveDJsCount = useMemo(() => {
    return allDJs.filter(dj => isDjLive(dj.id)).length;
  }, [allDJs, isDjLive]);

  return (
    <div className="min-h-screen bg-app-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">DJs</h1>
            <LiveConnectionStatus />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search DJs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-genres" value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={`genre-${genre}`} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-locations" value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={`location-${location}`} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyLive ? "default" : "outline"}
                onClick={() => setShowOnlyLive(!showOnlyLive)}
                className={`gap-2 ${showOnlyLive ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${showOnlyLive ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                Live DJs ({liveDJsCount})
              </Button>
            </div>
          </div>

          {hasError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
              <p className="mb-4">We couldn&apos;t reach the DJ directory. The API may be unavailable.</p>
              <Button variant="outline" onClick={fetchDJs}>Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-app-surface rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDJs.map((dj) => (
                  <DJCard
                    key={dj.id}
                    {...dj}
                    isLive={isDjLive(dj.id)}
                  />
                ))}
              </div>
              
              {filteredDJs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    {showOnlyLive ? 'No DJs are currently live.' : 'No DJs found matching your filters.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
