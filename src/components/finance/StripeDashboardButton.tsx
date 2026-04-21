import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, CreditCard } from 'lucide-react';
import { useStripeProfile } from '@/hooks/useStripeProfile';

const StripeDashboardButton = () => {
  const {
    stripeStatus,
    checkingStatus,
    stripeLoading,
    refreshStripeState,
    openDashboard,
  } = useStripeProfile();

  useEffect(() => {
    void refreshStripeState({ showErrors: false });
  }, [refreshStripeState]);

  // Show loading state while checking Stripe status
  if (checkingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-[#8B5CF6] mr-2" />
            <span className="text-sm text-gray-600">Checking Stripe status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything if no Stripe account or setup incomplete
  if (!stripeStatus.has_account || !stripeStatus.onboarding_completed) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Access your Stripe Dashboard to view business analytics, manage payments, handle disputes, and download financial reports.
        </p>
        
        <div className="space-y-2 mb-4 text-sm">
          <p className="font-medium">Available in your dashboard:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Business performance analytics and charts</li>
            <li>Payment history and balance management</li>
            <li>Customer and billing information</li>
            <li>Dispute and chargeback handling</li>
            <li>Financial reports and exports</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => void openDashboard()}
          className="w-full"
          variant="outline"
          disabled={stripeLoading}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {stripeLoading ? 'Opening Dashboard...' : 'Open Stripe Dashboard'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeDashboardButton;
