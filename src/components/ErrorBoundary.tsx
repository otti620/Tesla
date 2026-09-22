import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex flex-col items-center justify-center text-center bg-neutral-900 border border-neutral-800 rounded-2xl my-4 text-white">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-100 mb-1">
            {this.props.fallbackTitle || 'Component Display Notice'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mb-4 leading-relaxed">
            {this.state.error?.message || 'A minor display formatting exception occurred while rendering this section.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00c269] hover:bg-[#00ab5c] text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry &amp; Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
