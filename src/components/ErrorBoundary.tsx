import { Component, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  errorComponent?: 'modal' | 'inline' | 'fullscreen';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Send error to toast notification
    toast.error('An error occurred. Please try again or refresh the page.');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private renderErrorContent() {
    const { error, errorInfo } = this.state;

    switch (this.props.errorComponent) {
      case 'inline':
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
            </div>
            <button
              onClick={this.handleReset}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        );

      case 'modal':
        return (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
                {process.env.NODE_ENV === 'development' && errorInfo && (
                  <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );

      default: // fullscreen
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div>
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Something went wrong
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {error?.message || 'An unexpected error occurred'}
                </p>
              </div>
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <div className="mt-4">
                  <details className="bg-gray-50 p-4 rounded-lg">
                    <summary className="text-sm text-gray-700 cursor-pointer">Technical Details</summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorContent();
    }

    return this.props.children;
  }
} 