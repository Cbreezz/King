'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type Preferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  djLiveNotifications: boolean;
  newFollowerNotifications: boolean;
  eventReminders: boolean;
  chatMentions: boolean;
  momentLikes: boolean;
  systemUpdates: boolean;
};

const defaults: Preferences = {
  emailNotifications: true,
  pushNotifications: true,
  djLiveNotifications: true,
  newFollowerNotifications: true,
  eventReminders: true,
  chatMentions: true,
  momentLikes: true,
  systemUpdates: true,
};

export default function NotificationsSettingsPage() {
  const { isAuthenticated, status } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (status === 'loading') return;
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('/api/settings/notifications');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load preferences');
        }
        if (data?.preferences) {
          setPrefs((prev) => ({ ...prev, ...data.preferences }));
        }
      } catch (e: any) {
        console.error('[Settings] notifications load error:', e);
        toast.error(e?.message || 'Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, status]);

  const set = (key: keyof Preferences, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save preferences');
      toast.success('Notification settings saved');
      if (data?.preferences) {
        setPrefs((prev) => ({ ...prev, ...data.preferences }));
      }
    } catch (e: any) {
      console.error('[Settings] notifications save error:', e);
      toast.error(e?.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please sign in to manage notification preferences.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Notifications</CardTitle>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <SettingRow
            label="Email notifications"
            checked={prefs.emailNotifications}
            onCheckedChange={(v) => set('emailNotifications', v)}
          />
          <SettingRow
            label="Push notifications"
            checked={prefs.pushNotifications}
            onCheckedChange={(v) => set('pushNotifications', v)}
          />
          <SettingRow
            label="DJ live alerts"
            checked={prefs.djLiveNotifications}
            onCheckedChange={(v) => set('djLiveNotifications', v)}
          />
          <SettingRow
            label="New follower alerts"
            checked={prefs.newFollowerNotifications}
            onCheckedChange={(v) => set('newFollowerNotifications', v)}
          />
          <SettingRow
            label="Event reminders"
            checked={prefs.eventReminders}
            onCheckedChange={(v) => set('eventReminders', v)}
          />
          <SettingRow
            label="Chat mentions"
            checked={prefs.chatMentions}
            onCheckedChange={(v) => set('chatMentions', v)}
          />
          <SettingRow
            label="Moment likes"
            checked={prefs.momentLikes}
            onCheckedChange={(v) => set('momentLikes', v)}
          />
          <SettingRow
            label="System updates"
            checked={prefs.systemUpdates}
            onCheckedChange={(v) => set('systemUpdates', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SettingRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

