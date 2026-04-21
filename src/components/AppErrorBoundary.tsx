import React from 'react';
import { Button } from '@/components/ui/button';
import { captureException } from '@/lib/monitoring';

interface AppErrorBoundaryState {
  hasError: boolean;
  eventId?: string;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const eventId = captureException(error, {
      tags: {
        surface: 'react-boundary',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    console.error('[AppErrorBoundary] Unhandled application error:', error, errorInfo);
    if (eventId) {
      this.setState({ eventId });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The app hit an unexpected error. Reload to try again.
          </p>
          {this.state.eventId ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Error reference: <span className="font-mono">{this.state.eventId}</span>
            </p>
          ) : null}
          <Button className="mt-6 w-full" onClick={this.handleReload}>
            Reload App
          </Button>
        </div>
      </div>
    );
  }
}
