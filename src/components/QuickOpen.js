import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaygroundContext } from '../provider/playground-provider';
import { LanguageBadge } from './LanguageBadge';
import { playgroundPath, quickOpenEntries } from '../utils/workspace';
import { formatRelative } from '../utils/time';
import './quick-open.scss';

const QuickOpenContext = createContext(null);

// Null outside the provider, so components can hide their trigger instead of
// requiring the provider in every test harness.
export const useOptionalQuickOpen = () => useContext(QuickOpenContext);

const isMac = () =>
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');

export const quickOpenShortcutLabel = () => (isMac() ? '⌘K' : 'Ctrl K');

// Ctrl/⌘+K is the common web-app shortcut; Ctrl/⌘+P is what VS Code users
// reach for. Both are claimed in the capture phase, ahead of Monaco, which
// would otherwise swallow Ctrl+K as the start of a chord.
const isShortcut = (e) =>
    (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey &&
    (e.key === 'k' || e.key === 'K' || e.key === 'p' || e.key === 'P');

const Palette = ({ onClose }) => {
    const { folders } = useContext(PlaygroundContext);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const listRef = useRef(null);

    const entries = useMemo(() => quickOpenEntries(folders, query), [folders, query]);
    const selected = Math.min(active, Math.max(entries.length - 1, 0));

    useEffect(() => setActive(0), [query]);

    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${selected}"]`)
            ?.scrollIntoView?.({ block: 'nearest' });
    }, [selected]);

    const openEntry = (entry) => {
        if (!entry) return;
        onClose();
        navigate(playgroundPath(entry.file.id, entry.folder.id));
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(entries.length ? (selected + 1) % entries.length : 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(entries.length ? (selected - 1 + entries.length) % entries.length : 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            openEntry(entries[selected]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    };

    const listId = 'quick-open-list';
    const optionId = (index) => `quick-open-option-${index}`;

    return (
        <div
            className="quick-open-backdrop"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="quick-open" role="dialog" aria-modal="true" aria-label="Go to file">
                <div className="quick-open__search">
                    <span className="material-icons" aria-hidden="true">search</span>
                    <input
                        autoFocus
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        aria-activedescendant={entries.length ? optionId(selected) : undefined}
                        aria-label="File name"
                        placeholder="Go to file by name or folder…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <kbd>Esc</kbd>
                </div>

                {!query.trim() && entries.length > 0 && (
                    <div className="quick-open__section">Recent</div>
                )}

                <ul className="quick-open__list" role="listbox" id={listId} ref={listRef} aria-label="Files">
                    {entries.map((entry, index) => {
                        const { file, folder } = entry;
                        const when = formatRelative(Math.max(file.openedAt ?? 0, file.updatedAt ?? 0));
                        return (
                            <li
                                key={file.id}
                                id={optionId(index)}
                                data-index={index}
                                role="option"
                                aria-selected={index === selected}
                                className={index === selected ? 'is-active' : undefined}
                                onMouseMove={() => setActive(index)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => openEntry(entry)}
                            >
                                <LanguageBadge language={file.language} size="sm" />
                                <span className="quick-open__title">{file.title}</span>
                                <span className="quick-open__folder">{folder.title}</span>
                                {when && <span className="quick-open__when">{when}</span>}
                            </li>
                        );
                    })}
                </ul>

                {entries.length === 0 && (
                    <p className="quick-open__empty">
                        {query.trim() ? `No file named like "${query.trim()}".` : 'No files yet.'}
                    </p>
                )}

                <div className="quick-open__footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
                    <span><kbd>Enter</kbd> to open</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Hosts the "go to file" palette. Must sit inside the router (it navigates)
 * and inside PlayGroundProvider (it lists files).
 */
export const QuickOpenProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const returnFocus = useRef(null);

    const open = useCallback(() => {
        returnFocus.current = document.activeElement;
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // Give focus back to wherever it was (often the editor) on cancel.
        const target = returnFocus.current;
        returnFocus.current = null;
        if (target && typeof target.focus === 'function' && document.contains(target)) {
            target.focus();
        }
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (!isShortcut(e)) return;
            e.preventDefault();
            e.stopPropagation();
            if (isOpen) close();
            else open();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, open, close]);

    const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

    return (
        <QuickOpenContext.Provider value={value}>
            {children}
            {isOpen && <Palette onClose={close} />}
        </QuickOpenContext.Provider>
    );
};
