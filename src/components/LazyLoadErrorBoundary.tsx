import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary that catches chunk loading failures and auto-refreshes.
 * This handles the "Failed to fetch dynamically imported module" error
 * that occurs when the browser caches old chunk URLs after a rebuild.
 */
class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyLoadErrorBoundary caught error:', error, errorInfo);
    
    // Check if this is a chunk loading error
    const isChunkLoadError = 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.name === 'ChunkLoadError';
    
    if (isChunkLoadError) {
      // Check if we already tried refreshing
      const lastRefresh = sessionStorage.getItem('chunk_error_refresh');
      const now = Date.now();
      
      // Only auto-refresh once per 30 seconds to prevent infinite loops
      if (!lastRefresh || now - parseInt(lastRefresh) > 30000) {
        sessionStorage.setItem('chunk_error_refresh', now.toString());
        // Force a hard refresh to get new chunks
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem('chunk_error_refresh');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Update Available</h2>
            <p className="text-sm text-muted-foreground mb-4">
              A new version of the app is available. Please refresh to continue.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
