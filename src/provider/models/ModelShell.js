import { useContext, useEffect, useRef } from 'react';
import './models.scss';
import { ModelContext } from '../ModelProvider';
import { DEFAULT_LANGUAGE, languageOptions } from '../../config/languages';

/**
 * Shared chrome for every model: backdrop, Escape-to-close, click-outside to
 * close, autofocus of the first field, and the submit plumbing.
 *
 * `onSubmit` receives the form values as a plain object, already trimmed.
 * Reading them via FormData rather than `event.target.<name>` keeps the models
 * independent of named-control access on HTMLFormElement.
 */
export const ModelShell = ({
    title,
    submitLabel,
    onSubmit,
    error,
    children,
    onClose,
    footer
}) => {
    // `onClose` lets dialogs outside the model registry (e.g. the confirm
    // prompt) reuse this chrome without going through ModelContext.
    const modelContext = useContext(ModelContext);
    const closeModel = onClose ?? modelContext?.closeModel;
    const bodyRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const values = Object.fromEntries(
            [...new FormData(e.currentTarget)].map(([key, value]) => [
                key,
                typeof value === 'string' ? value.trim() : value
            ])
        );
        onSubmit(values);
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeModel();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeModel]);

    useEffect(() => {
        const body = bodyRef.current;
        // Focus the first field, or the primary action when there are none.
        (body?.querySelector('input, select') ?? body?.querySelector('button[type="submit"]'))?.focus();
    }, []);

    return (
        <div
            className="model-container"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeModel();
            }}
        >
            <form
                className="modelBody"
                ref={bodyRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onSubmit={handleSubmit}
            >
                <div className="header">
                    <h1 className="bitcount">{title}</h1>
                    <button
                        type="button"
                        className="close-btn"
                        aria-label="Close"
                        onClick={closeModel}
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {error && <p className="error" role="alert">{error}</p>}

                {children}

                {footer ?? <button type="submit">{submitLabel}</button>}
            </form>
        </div>
    );
};

export const LanguageSelect = ({ defaultValue = DEFAULT_LANGUAGE }) => (
    <select name="language" aria-label="Language" defaultValue={defaultValue} required>
        {languageOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
        ))}
    </select>
);
