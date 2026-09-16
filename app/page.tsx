'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Music, Users } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { GlowButton } from '@/components/ui/glow-button';
import { DJCard } from '@/components/dj-card';
import { ClubCard } from '@/components/club-card';
import { useSocket } from '@/contexts/socket-context';
import { ConnectionInfo } from '@/components/ui/connection-info';

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

interface Club {
  id: string;
  name: string;
  location: string;
  rating: number;
  image?: string;
  events: Array<{
    name: string;
    dj: {
      user: {
        name: string | null;
      };
    };
  }>;
}

export default function Home() {
  const [topDJs, setTopDJs] = useState<DJ[]>([]);
  const [topClubs, setTopClubs] = useState<Club[]>([]);
  const [stats, setStats] = useState({ djCount: 0, clubCount: 0, momentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isDjLive, liveRooms } = useSocket();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const [djsResponse, clubsResponse, statsResponse] = await Promise.all([
        fetch('/api/djs'),
        fetch('/api/clubs'),
        fetch('/api/stats')
      ]);

      if (!djsResponse.ok || !clubsResponse.ok || !statsResponse.ok) {
        throw new Error('Unable to load NightVibe data');
      }

      const [djsData, clubsData, statsData] = await Promise.all([
        djsResponse.json(),
        clubsResponse.json(),
        statsResponse.json()
      ]);

      // Sort DJs to show live DJs first
      const sortedDJs = [...djsData].sort((a, b) => {
        const aIsLive = isDjLive(a.id);
        const bIsLive = isDjLive(b.id);
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return b.rating - a.rating; // Secondary sort by rating
      });

      setTopDJs(sortedDJs);
      setTopClubs(clubsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every minute to keep it current
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update DJ list when live status changes
  useEffect(() => {
    setTopDJs(prevDJs => {
      const newDJs = [...prevDJs].sort((a, b) => {
        const aIsLive = isDjLive(a.id);
        const bIsLive = isDjLive(b.id);
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return b.rating - a.rating;
      });
      return newDJs;
    });
  }, [liveRooms, isDjLive]);

  return (
    <div className="min-h-screen bg-app-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-app-bg via-app-bg/90 to-app-bg z-10" />
          {/* Fallback background if video doesn't load */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black z-[5]"></div>
          <div 
            className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-black bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
            }}
          ></div>
        </div>
        
        <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-app-text mb-6">
            Welcome to <span className="text-electric-pink">NightVibe</span>
          </h1>
          <p className="text-xl sm:text-2xl text-app-text/70 mb-8 max-w-3xl mx-auto">
            Your ultimate platform for discovering and connecting with the best DJs, clubs, and nightlife experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton href="/signup" size="lg">
              Get Started
              <Sparkles className="ml-2 h-5 w-5" />
            </GlowButton>
            <GlowButton href="/about" variant="secondary" size="lg">
              Learn More
              <ArrowRight className="ml-2 h-5 w-5" />
            </GlowButton>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-electric-pink/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="glass-card p-6">
              <Music className="h-12 w-12 text-electric-pink mx-auto mb-4" />
              <div className="text-3xl font-bold text-app-text mb-2">{stats.djCount}</div>
              <div className="text-app-text/70">Active DJs</div>
            </div>
            <div className="glass-card p-6">
              <Users className="h-12 w-12 text-neon-cyan mx-auto mb-4" />
              <div className="text-3xl font-bold text-app-text mb-2">{stats.clubCount}</div>
              <div className="text-app-text/70">Nightlife Venues</div>
            </div>
            <div className="glass-card p-6">
              <TrendingUp className="h-12 w-12 text-electric-pink mx-auto mb-4" />
              <div className="text-3xl font-bold text-app-text mb-2">{stats.momentCount}</div>
              <div className="text-app-text/70">Moments Shared</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top DJs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-app-text">
                Top <span className="text-electric-pink">DJs</span> Today
              </h2>
              <p className="text-app-text/70 mt-1">
                {topDJs.filter(dj => isDjLive(dj.id)).length > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <div className="live-status-dot"></div>
                    Some DJs are currently live! Check them out.
                  </span>
                )}
              </p>
            </div>
            <Link href="/djs">
              <GlowButton variant="secondary" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-app-surface/50 rounded-lg h-[300px]" />
                </div>
              ))
            ) : (
              topDJs.length === 0 ? (
                <div className="glass-card p-6 text-center text-app-text/70 md:col-span-3">No DJs have joined yet. Check back soon.</div>
              ) : topDJs.map((dj) => (
                <DJCard 
                  key={dj.id} 
                  {...dj} 
                  isLive={isDjLive(dj.id)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Top Clubs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-app-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-app-text">
              Featured <span className="text-neon-cyan">Clubs</span>
            </h2>
            <Link href="/clubs">
              <GlowButton variant="secondary" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-app-bg/50 rounded-lg h-[300px]" />
                </div>
              ))
            ) : (
              topClubs.length === 0 ? (
                <div className="glass-card p-6 text-center text-app-text/70 md:col-span-3">No venues are available yet. Check back soon.</div>
              ) : topClubs.map((club) => (
                <ClubCard key={club.id} {...club} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-electric-pink/20 to-neon-cyan/20 z-0" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl font-bold text-app-text mb-6">
            Ready to Experience the <span className="text-neon-cyan">Night?</span>
          </h2>
          <p className="text-xl text-app-text/70 mb-8 max-w-3xl mx-auto">
            Join our community of DJs, clubs, and nightlife enthusiasts today and elevate your nightlife experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton href="/signup" size="lg">
              Sign Up Now
              <Sparkles className="ml-2 h-5 w-5" />
            </GlowButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
