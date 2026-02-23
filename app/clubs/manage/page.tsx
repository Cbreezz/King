'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface DjListItem {
  id: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface ClubEvent {
  id: string;
  name: string;
  date: string;
  dj: { id: string; user: { name: string | null; image: string | null } };
}

interface ClubProfile {
  id: string;
  name: string;
  location: string;
  address: string;
  rating: number;
  image: string | null;
  events: ClubEvent[];
}

export default function ClubManagePage() {
  const router = useRouter();
  const { user, isAuthenticated, status } = useAuth();

  const [club, setClub] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [djs, setDjs] = useState<DjListItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedDjId, setSelectedDjId] = useState<string>('');

  const canManage = isAuthenticated && user?.role === 'CLUB_OWNER';

  const djOptions = useMemo(
    () =>
      djs
        .map((dj) => ({
          id: dj.id,
          label: dj.user?.name || `DJ ${dj.id.slice(0, 8)}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [djs]
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'CLUB_OWNER') {
      toast.error('Access denied. Club owner account required.');
      router.push('/clubs');
    }
  }, [isAuthenticated, status, user?.role, router]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !canManage) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/clubs?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error('Club profile not found for this account.');
            setClub(null);
            return;
          }
          throw new Error(`Failed to load club profile (${res.status})`);
        }
        const data = await res.json();
        setClub(data);
      } catch (e: any) {
        console.error('[ClubManage] load error:', e);
        toast.error(e?.message || 'Failed to load club profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, canManage]);

  useEffect(() => {
    const loadDjs = async () => {
      if (!canManage) return;
      try {
        const res = await fetch('/api/djs?limit=100');
        if (!res.ok) return;
        const data = await res.json();
        setDjs(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    };
    loadDjs();
  }, [canManage]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !selectedDjId) {
      toast.error('Please provide event name, date/time, and a DJ.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName.trim(),
          djId: selectedDjId,
          date: new Date(eventDate).toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to create event (${res.status})`);
      }

      toast.success('Event created');
      setEventName('');
      setEventDate('');
      setSelectedDjId('');

      // Refresh club
      if (user?.id) {
        const clubRes = await fetch(`/api/clubs?userId=${encodeURIComponent(user.id)}`);
        if (clubRes.ok) {
          setClub(await clubRes.json());
        }
      }
    } catch (e: any) {
      console.error('[ClubManage] create event error:', e);
      toast.error(e?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <Navbar />

      <main className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Club Dashboard</h1>
            <p className="text-app-text/70">Manage your club profile and events.</p>
          </div>
          {club?.id && (
            <Link href={`/clubs/${club.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View public page
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-app-text/70">Loading club...</span>
          </div>
        ) : !club ? (
          <Card className="bg-app-surface/60 border-dashed">
            <CardContent className="py-10">
              <p className="text-app-text/70">
                No club profile found for this account yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-app-surface/60">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{club.name}</span>
                  <Badge variant="outline">{club.rating.toFixed(1)} ★</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-app-text/80">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-electric-pink" />
                  <span>{club.location}</span>
                </div>
                <div className="text-app-text/70">{club.address}</div>
              </CardContent>
            </Card>

            <Card className="bg-app-surface/60">
              <CardHeader>
                <CardTitle>Create an event</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="eventName">Event name</Label>
                    <Input
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. Afrobeats Friday"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="eventDate">Date & time</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label>DJ</Label>
                    <Select value={selectedDjId} onValueChange={setSelectedDjId} disabled={submitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a DJ" />
                      </SelectTrigger>
                      <SelectContent>
                        {djOptions.map((dj) => (
                          <SelectItem key={dj.id} value={dj.id}>
                            {dj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Button type="submit" disabled={submitting} className="gap-2">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                      Create event
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-app-surface/60">
              <CardHeader>
                <CardTitle>Upcoming events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {club.events?.length ? (
                  club.events.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{evt.name}</div>
                        <div className="text-xs text-app-text/70">
                          {new Date(evt.date).toLocaleString()}
                          {evt.dj?.user?.name ? ` · with ${evt.dj.user.name}` : ''}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {new Date(evt.date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-app-text/70">No upcoming events.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

