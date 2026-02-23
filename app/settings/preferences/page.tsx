'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PreferencesSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          App preferences (theme defaults, chat sound preferences, etc.) can live here.
        </p>
        <Separator />
        <div className="space-y-2">
          <p className="text-foreground font-medium">Ideas</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Default theme (dark/light/system)</li>
            <li>Mute chat sounds by default</li>
            <li>Language & region</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

