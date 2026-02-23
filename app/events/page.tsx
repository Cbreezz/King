'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EventItem {
  id: string;
  name: string;
  date: string;
  club?: {
    id?: string;
    name: string;
    location: string;
  };
  dj?: {
    id?: string;
    user?: {
      name: string;
      image?: string | null;
    };
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Reuse club and DJ APIs indirectly by calling a dedicated events API if available.
        // Fallback: hit a generic /api/events endpoint; if it doesn't exist yet, this will
        // fail gracefully and show an empty state instead of a 404 page.
        const response = await fetch('/api/events/upcoming');

        if (!response.ok) {
          console.warn('[Events] /api/events/upcoming not available, showing empty state');
          setEvents([]);
          return;
        }

        const data = await response.json();
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('[Events] Failed to load events:', error);
        toast.error('Failed to load events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-app-bg">
      <Navbar />

      <main className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-app-text/70 max-w-2xl">
            Discover the hottest nights happening soon at NightVibe clubs and with your
            favorite DJs.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-app-text/70">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-app-surface/60 border-dashed">
            <CardContent className="py-10 flex flex-col items-center justify-center space-y-3">
              <Music className="h-8 w-8 text-electric-pink" />
              <h2 className="text-lg font-semibold">No upcoming events yet</h2>
              <p className="text-sm text-app-text/70 text-center max-w-md">
                Check back soon as DJs and clubs start scheduling nights. In the meantime,
                explore clubs and DJs to follow your favorites.
              </p>
              <div className="flex gap-3 mt-2">
                <Link href="/clubs">
                  <Button variant="outline" size="sm">
                    Browse Clubs
                  </Button>
                </Link>
                <Link href="/djs">
                  <Button variant="outline" size="sm">
                    Discover DJs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Card key={event.id} className="bg-app-surface/60 hover:bg-app-surface/80 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg font-semibold">{event.name}</CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-app-text/80">
                  {event.club && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-electric-pink" />
                      {event.club.id ? (
                        <Link
                          href={`/clubs/${event.club.id}`}
                          className="hover:underline font-medium"
                        >
                          {event.club.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{event.club.name}</span>
                      )}
                      <span className="text-xs text-app-text/60">
                        · {event.club.location}
                      </span>
                    </div>
                  )}

                  {event.dj?.user?.name && (
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-neon-cyan" />
                      {event.dj.id ? (
                        <Link
                          href={`/djs/${event.dj.id}`}
                          className="hover:underline text-sm"
                        >
                          {event.dj.user.name}
                        </Link>
                      ) : (
                        <span className="text-sm">{event.dj.user.name}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

