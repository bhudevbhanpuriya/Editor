import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value }) => <textarea data-testid="editor" value={value ?? ''} readOnly />
}));

const pressShortcut = (key = 'k', extra = { ctrlKey: true }) =>
    fireEvent.keyDown(document.activeElement ?? document.body, { key, ...extra });

const palette = () => screen.getByRole('dialog', { name: 'Go to file' });

beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
});

it('opens with Ctrl+K, Ctrl+P and Cmd+K, and toggles closed', () => {
    render(<App />);

    pressShortcut('k');
    expect(palette()).toBeInTheDocument();
    pressShortcut('k');
    expect(screen.queryByRole('dialog', { name: 'Go to file' })).not.toBeInTheDocument();

    pressShortcut('p');
    expect(palette()).toBeInTheDocument();
    pressShortcut('p');

    pressShortcut('k', { metaKey: true });
    expect(palette()).toBeInTheDocument();
});

it('ignores K without a modifier and Ctrl+Shift+K', () => {
    render(<App />);
    pressShortcut('k', {});
    pressShortcut('k', { ctrlKey: true, shiftKey: true });
    expect(screen.queryByRole('dialog', { name: 'Go to file' })).not.toBeInTheDocument();
});

it('lists recent files when empty, filters by name, and opens with Enter', async () => {
    const user = userEvent.setup();
    render(<App />);

    pressShortcut();
    const options = within(palette()).getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual([
        expect.stringContaining('index'),
        expect.stringContaining('homepage')
    ]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('home');
    expect(within(palette()).getAllByRole('option')).toHaveLength(1);

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('dialog', { name: 'Go to file' })).not.toBeInTheDocument();
    expect(window.location.pathname).toMatch(/^\/playground\//);
    expect(screen.getByTestId('editor').value).toContain('console.log');
});

it('moves the selection with the arrow keys, wrapping around', async () => {
    const user = userEvent.setup();
    render(<App />);
    pressShortcut();

    await user.keyboard('{ArrowDown}');
    expect(within(palette()).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(within(palette()).getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(within(palette()).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
});

it('matches folder names and explains when nothing matches', async () => {
    const user = userEvent.setup();
    render(<App />);
    pressShortcut();

    await user.keyboard('web-dev');
    expect(within(palette()).getByRole('option')).toHaveTextContent('homepage');

    await user.clear(within(palette()).getByRole('combobox'));
    await user.keyboard('nothing-like-this');
    expect(within(palette()).queryAllByRole('option')).toHaveLength(0);
    expect(palette()).toHaveTextContent(/No file named like "nothing-like-this"/);
});

it('closes on Escape without navigating', async () => {
    const user = userEvent.setup();
    render(<App />);
    pressShortcut();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Go to file' })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
});

it('opens from the visible "Go to file" button too', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Go to file/ }));
    expect(palette()).toBeInTheDocument();
});
