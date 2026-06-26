import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: String(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 text-red-500 bg-red-50 relative z-50"><h1>Something went wrong.</h1><pre>{this.state.errorStr}</pre></div>;
    }

    return this.props.children;
  }
}
