import { Component } from "react";
import "./error-boundary.scss";

/**
 * Catches render-time crashes that would otherwise leave a blank white page.
 *
 * The workspace lives in localStorage, so a corrupt entry can crash the app on
 * every load with no way out from the UI. The fallback therefore offers a
 * reset alongside a plain reload.
 */
export class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Unhandled error:', error, info?.componentStack);
    }

    handleReload = () => {
        window.location.assign('/');
    };

    handleReset = () => {
        try {
            localStorage.removeItem('data');
        } catch (e) {
            // Nothing more we can do; the reload below is still worth trying.
        }
        window.location.assign('/');
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="error-boundary" role="alert">
                <div className="error-boundary__panel">
                    <span className="material-icons" aria-hidden="true">warning_amber</span>
                    <h1>Something broke</h1>
                    <p>
                        The editor hit an unexpected error. Your saved work is still in this
                        browser, so reloading usually fixes it.
                    </p>

                    <pre className="error-boundary__detail">
                        {this.state.error?.message || String(this.state.error)}
                    </pre>

                    <div className="error-boundary__actions">
                        <button type="button" className="primary" onClick={this.handleReload}>
                            Reload
                        </button>
                        <button type="button" onClick={this.handleReset}>
                            Reset workspace
                        </button>
                    </div>

                    <p className="error-boundary__hint">
                        Resetting clears every folder and file stored in this browser.
                    </p>
                </div>
            </div>
        );
    }
}
