// src/components/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("💥 ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <div className="error-icon">⚽</div>
            <h1>Uy, algo salió mal</h1>
            <p>
              No pudimos cargar esta pantalla. Probá recargar la página — si
              persiste, contactanos.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="error-detail">{this.state.error.message}</pre>
            )}
            <button className="btn btn-primary" onClick={this.handleReload}>
              RECARGAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}