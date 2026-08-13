import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches React render errors and shows a friendly fallback
 * instead of a blank white screen. Wrap around routes or heavy components.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you could send this to an error tracking service
    console.error('ErrorBoundary caught a render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              An unexpected error occurred while rendering this page. You can try
              refreshing the page or navigating back to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-4 bg-black/30 border border-white/10 rounded-xl text-left text-[11px] text-red-300 overflow-auto max-h-40 custom-scrollbar">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold transition-colors"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
