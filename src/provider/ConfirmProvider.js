import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ModelShell } from "./models/ModelShell";

const ConfirmContext = createContext(null);

/**
 * Returns `confirm({ title, message, confirmLabel, destructive })`, which
 * resolves to true/false. Replaces window.confirm, which blocks the main
 * thread, cannot be styled, and is suppressed outright in some browsers.
 */
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used inside a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [request, setRequest] = useState(null);
    const resolverRef = useRef(null);

    const confirm = useCallback((options) => new Promise(resolve => {
        resolverRef.current = resolve;
        setRequest(options);
    }), []);

    const settle = useCallback((result) => {
        setRequest(null);
        const resolve = resolverRef.current;
        resolverRef.current = null;
        resolve?.(result);
    }, []);

    const value = useMemo(() => confirm, [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}

            {request && (
                <ModelShell
                    title={request.title}
                    onClose={() => settle(false)}
                    onSubmit={() => settle(true)}
                    footer={
                        <div className="actions">
                            <button type="button" className="cancel" onClick={() => settle(false)}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={request.destructive ? 'destructive' : 'create'}
                            >
                                {request.confirmLabel ?? 'Confirm'}
                            </button>
                        </div>
                    }
                >
                    <p className="confirm-message">{request.message}</p>
                </ModelShell>
            )}
        </ConfirmContext.Provider>
    );
};
