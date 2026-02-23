'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacySettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Privacy controls will live here. This template currently focuses on core
          NightVibe features (live, chat, DJ/club discovery).
        </p>
        <Separator />
        <div className="space-y-2">
          <p className="text-foreground font-medium">Coming soon</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Profile visibility</li>
            <li>Blocked users</li>
            <li>Data export / deletion requests</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

