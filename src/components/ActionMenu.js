import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './action-menu.scss';

const MENU_ITEM_HEIGHT = 38;

/**
 * A "⋯" button that opens a small menu of actions.
 *
 * Rendered into a portal so the menu is never clipped by a card's
 * overflow:hidden. React still bubbles portal events through the component
 * tree, so clicks are stopped at the menu or they would reach the card and
 * open the file.
 *
 * items: [{ icon, label, onSelect, danger? }]
 */
export const ActionMenu = ({ label, items }) => {
    const [position, setPosition] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = useId();
    const open = position !== null;

    const close = useCallback((restoreFocus = true) => {
        setPosition(null);
        if (restoreFocus) buttonRef.current?.focus();
    }, []);

    const openMenu = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        const height = items.length * MENU_ITEM_HEIGHT + 12;
        // Open upwards when there is no room below (e.g. the last row of cards).
        const flip = rect.bottom + height + 8 > window.innerHeight && rect.top > height;
        setPosition({
            right: Math.max(8, window.innerWidth - rect.right),
            ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 })
        });
    };

    useEffect(() => {
        if (!open) return undefined;

        menuRef.current?.querySelector('[role="menuitem"]')?.focus();

        const onPointerDown = (e) => {
            if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
            close(false);
        };
        // A fixed-position menu would drift away from its button on scroll.
        const onViewportChange = () => close(false);

        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('scroll', onViewportChange, true);
        window.addEventListener('resize', onViewportChange);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('scroll', onViewportChange, true);
            window.removeEventListener('resize', onViewportChange);
        };
    }, [open, close]);

    const onMenuKeyDown = (e) => {
        const entries = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
        const index = entries.indexOf(document.activeElement);
        const focusAt = (i) => entries[(i + entries.length) % entries.length]?.focus();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusAt(index + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusAt(index - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            focusAt(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            focusAt(entries.length - 1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
        } else if (e.key === 'Tab') {
            close(false);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`menu-trigger${open ? ' is-open' : ''}`}
                aria-label={label}
                title="More actions"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={(e) => {
                    e.stopPropagation();
                    if (open) close();
                    else openMenu();
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !open) {
                        e.preventDefault();
                        e.stopPropagation();
                        openMenu();
                    }
                }}
            >
                <span className="material-icons" aria-hidden="true">more_vert</span>
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-label={label}
                    className="action-menu"
                    style={position}
                    onKeyDown={onMenuKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {items.map(item => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            tabIndex={-1}
                            className={item.danger ? 'is-danger' : undefined}
                            onClick={() => {
                                // Focus moves on to whatever the action opens
                                // (usually a dialog), not back to the button.
                                close(false);
                                item.onSelect();
                            }}
                        >
                            <span className="material-icons" aria-hidden="true">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};
