import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BOOKING_RESPONSE_PAGE_STATUS,
  buildBookingResponseRoute,
  isBookingResponsePageStatus,
  ROUTE_PATHS,
} from '@/contracts';

function useDocumentMeta(title: string, description: string, canonical?: string) {
  useEffect(() => {
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [title, description, canonical]);
}

const BookingResponse: React.FC = () => {
  const [params] = useSearchParams();
  const rawStatus = params.get('status');
  const status = isBookingResponsePageStatus(rawStatus) ? rawStatus : undefined;
  const msg = params.get('msg');

  const titles: Record<string, string> = {
    [BOOKING_RESPONSE_PAGE_STATUS.accepted]: 'Quote accepted - Booking response',
    [BOOKING_RESPONSE_PAGE_STATUS.declined]: 'Quote declined - Booking response',
    [BOOKING_RESPONSE_PAGE_STATUS.alreadyUsed]: 'Link already used - Booking response',
    [BOOKING_RESPONSE_PAGE_STATUS.notFound]: 'Request not found - Booking response',
    [BOOKING_RESPONSE_PAGE_STATUS.invalid]: 'Invalid link - Booking response',
    [BOOKING_RESPONSE_PAGE_STATUS.error]: 'Error - Booking response',
  };

  const descriptions: Record<string, string> = {
    [BOOKING_RESPONSE_PAGE_STATUS.accepted]: 'Your response was recorded successfully. Thank you!',
    [BOOKING_RESPONSE_PAGE_STATUS.declined]: 'Your decline has been recorded. Thank you for the update.',
    [BOOKING_RESPONSE_PAGE_STATUS.alreadyUsed]: 'This is a one-time link. Contact the provider to change your response.',
    [BOOKING_RESPONSE_PAGE_STATUS.notFound]: 'The booking request you tried to access was not found.',
    [BOOKING_RESPONSE_PAGE_STATUS.invalid]: 'This booking response link is invalid or expired.',
    [BOOKING_RESPONSE_PAGE_STATUS.error]: 'There was an error processing your response.',
  };

  const title = titles[status || ''] || 'Booking response - museio';
  const description = descriptions[status || ''] || 'View your booking response status.';

  useDocumentMeta(
    title.slice(0, 60),
    description.slice(0, 160),
    `${window.location.origin}${buildBookingResponseRoute()}`
  );

  const renderContent = () => {
    switch (status) {
      case BOOKING_RESPONSE_PAGE_STATUS.accepted:
        return {
          heading: 'Thanks! Your acceptance is confirmed',
          body: 'We have recorded your acceptance and notified the organizer.',
        };
      case BOOKING_RESPONSE_PAGE_STATUS.declined:
        return {
          heading: 'Thanks for letting us know',
          body: 'We have recorded your decline and informed the organizer.',
        };
      case BOOKING_RESPONSE_PAGE_STATUS.alreadyUsed:
        return {
          heading: 'This link was already used',
          body: 'This is a one-time link. If you wish to change your response, please contact the provider directly.',
        };
      case BOOKING_RESPONSE_PAGE_STATUS.notFound:
        return {
          heading: 'Request not found',
          body: 'This booking request may have been processed already or does not exist.',
        };
      case BOOKING_RESPONSE_PAGE_STATUS.invalid:
        return {
          heading: 'Invalid link',
          body: 'This booking response link is invalid or has expired.',
        };
      case BOOKING_RESPONSE_PAGE_STATUS.error:
        return {
          heading: 'Something went wrong',
          body: msg || 'There was an error processing your response. Please try again later.',
        };
      default:
        return {
          heading: 'Booking response',
          body: 'Your response has been processed.',
        };
    }
  };

  const content = renderContent();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <main className="w-full max-w-xl">
        <article className="rounded-2xl border bg-background p-8 shadow-sm">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">{content.heading}</h1>
          </header>
          <section className="text-muted-foreground leading-relaxed">
            <p>{content.body}</p>
          </section>
          <aside className="mt-8 flex gap-3">
            <Button asChild>
              <Link to={ROUTE_PATHS.root}>Back to site</Link>
            </Button>
          </aside>
        </article>
      </main>
    </div>
  );
};

export default BookingResponse;
