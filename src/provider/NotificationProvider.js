import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createId } from "../utils/id";
import "./notifications.scss";

const NotificationContext = createContext(null);

const DEFAULT_DURATION = 3000;

export const useNotify = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotify must be used inside a NotificationProvider');
    }
    return context.notify;
};

const noop = () => { };

/**
 * Like useNotify, but degrades to a no-op when no provider is mounted. Used by
 * the playground provider, which must stay usable on its own (and in tests)
 * without dragging the notification UI in as a hard dependency.
 */
export const useOptionalNotify = () => useContext(NotificationContext)?.notify ?? noop;

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    /**
     * Shows a transient message. `type` is one of 'success' | 'error' | 'info'.
     * Errors stay until dismissed — they usually explain why something the
     * user asked for did not happen.
     */
    const notify = useCallback((message, type = 'info') => {
        const id = createId();
        setToasts(prev => [...prev, { id, message, type }]);

        if (type !== 'error') {
            timers.current.set(id, setTimeout(() => dismiss(id), DEFAULT_DURATION));
        }
        return id;
    }, [dismiss]);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-atomic="false">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
                        <span className="material-icons" aria-hidden="true">
                            {toast.type === 'error' ? 'error_outline'
                                : toast.type === 'success' ? 'check_circle_outline'
                                    : 'info_outline'}
                        </span>
                        <span className="toast__message">{toast.message}</span>
                        <button
                            type="button"
                            className="toast__close"
                            aria-label="Dismiss notification"
                            onClick={() => dismiss(toast.id)}
                        >
                            <span className="material-icons" aria-hidden="true">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
