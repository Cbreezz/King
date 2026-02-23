'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function BillingSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Billing isn’t wired up yet. If you plan to monetize (subscriptions for DJs,
          promoted events for clubs, etc.), this page is the place to plug in Stripe.
        </p>
        <Separator />
        <div className="space-y-2">
          <p className="text-foreground font-medium">Next steps</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add Stripe customer + subscription tables</li>
            <li>Checkout + portal routes</li>
            <li>Role-based feature gating</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

