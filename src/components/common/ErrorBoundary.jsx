import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });

    // You could also log to a service like Sentry here
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // If there's a retry callback, call it
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: "var(--card-color)",
            borderColor: "var(--error-color)",
            color: "var(--text-color)",
          }}
        >
          <div className="flex items-center mb-3">
            <svg
              className="h-6 w-6 mr-2"
              style={{ color: "var(--error-color)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-medium">
              {this.props.errorTitle || "Something went wrong"}
            </h3>
          </div>

          <p className="mb-4">
            {this.props.errorMessage ||
              "We're having trouble loading this content. Please try again."}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: "var(--error-color)", color: "white" }}
            >
              Try Again
            </button>

            {this.props.showReportButton && (
              <button
                onClick={this.props.onReport}
                className="px-4 py-2 border rounded-md transition-colors"
                style={{
                  backgroundColor: "var(--card-color)",
                  borderColor: "var(--error-color)",
                  color: "var(--error-color)",
                }}
              >
                Report Issue
              </button>
            )}
          </div>

          {this.props.showErrorDetails && this.state.error && (
            <details
              className="mt-4 p-2 rounded text-sm"
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
