import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Monaco cannot run under jsdom; a textarea with the same contract keeps the
// editor's own logic under test.
jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value, onChange }) => (
        <textarea
            data-testid="editor"
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
        />
    )
}));

const stored = () => JSON.parse(localStorage.getItem('data')).folders;

// Seeds the workspace the way a first visit would, then deep-links into the
// first file (DSA / index).
const openPlayground = () => {
    const { unmount } = render(<App />);
    const folders = stored();
    unmount();
    const [dsa] = folders;
    window.history.pushState({}, '', `/playground/${dsa.files[0].id}/${dsa.id}`);
    render(<App />);
    return folders;
};

const tree = () => screen.getByRole('complementary', { name: 'Files' });
const editor = () => screen.getByTestId('editor');

beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
});

it('lists every folder and file, marking the open one', () => {
    openPlayground();

    expect(within(tree()).getByRole('button', { name: /DSA/, expanded: true })).toBeInTheDocument();
    expect(within(tree()).getByRole('link', { name: /index/ })).toHaveAttribute('aria-current', 'page');
    expect(within(tree()).getByRole('link', { name: /homepage/ })).not.toHaveAttribute('aria-current');
});

it('switches files without going back home', async () => {
    const user = userEvent.setup();
    openPlayground();
    expect(editor().value).toContain('#include');

    await user.click(within(tree()).getByRole('link', { name: /homepage/ }));

    expect(editor().value).toContain('console.log');
    expect(within(tree()).getByRole('link', { name: /homepage/ })).toHaveAttribute('aria-current', 'page');
});

it('records the open for the Recent view', () => {
    openPlayground();
    expect(stored()[0].files[0].openedAt).toEqual(expect.any(Number));
    expect(stored()[1].files[0].openedAt).toBeNull();
});

it('creates a file in a folder and opens it', async () => {
    const user = userEvent.setup();
    openPlayground();

    await user.click(within(tree()).getByRole('button', { name: 'New file in Web-dev' }));
    const dialog = screen.getByRole('dialog', { name: 'Create New File' });
    await user.type(within(dialog).getByPlaceholderText('File name'), 'about');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Language' }), 'python');
    fireEvent.submit(dialog);

    expect(within(tree()).getByRole('link', { name: /about/ })).toHaveAttribute('aria-current', 'page');
    expect(editor().value).toContain('print("Hello World!")');
    expect(stored()[1].files.map(f => f.title)).toEqual(['homepage', 'about']);
});

it('collapses a folder and remembers it', async () => {
    const user = userEvent.setup();
    openPlayground();

    await user.click(within(tree()).getByRole('button', { name: /Web-dev/, expanded: true }));

    expect(within(tree()).queryByRole('link', { name: /homepage/ })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('explorer-collapsed'))).toEqual([stored()[1].id]);
});

it('hides and shows the panel from the header, remembering the choice', async () => {
    const user = userEvent.setup();
    openPlayground();

    await user.click(screen.getByRole('button', { name: 'Hide files' }));
    expect(screen.queryByRole('complementary', { name: 'Files' })).not.toBeInTheDocument();
    expect(localStorage.getItem('explorer-open')).toBe('false');

    await user.click(screen.getByRole('button', { name: 'Show files' }));
    expect(tree()).toBeInTheDocument();
});

it('keeps editing the open file after it is dragged to another folder', async () => {
    const user = userEvent.setup();
    const [dsa, web] = openPlayground();

    const data = {};
    const dt = {
        setData: (type, value) => { data[type] = value; },
        getData: (type) => data[type] ?? '',
        get types() { return Object.keys(data); }
    };
    const row = within(tree()).getByRole('link', { name: /index/ });
    const target = within(tree()).getByRole('button', { name: /Web-dev/, expanded: true }).parentElement;

    fireEvent.dragStart(row, { dataTransfer: dt });
    fireEvent.dragEnter(target, { dataTransfer: dt });
    fireEvent.dragOver(target, { dataTransfer: dt });
    fireEvent.drop(target, { dataTransfer: dt });

    expect(stored()[1].files.map(f => f.id)).toEqual([web.files[0].id, dsa.files[0].id]);
    // The URL still names DSA; the file must stay open and editable anyway.
    expect(window.location.pathname).toContain(dsa.id);
    expect(screen.queryByText('This file no longer exists.')).not.toBeInTheDocument();

    await user.clear(editor());
    await user.type(editor(), 'moved and edited');
    await user.click(screen.getByRole('button', { name: 'Save Code' }));

    expect(stored()[1].files[1].code).toBe('moved and edited');
    expect(stored()[0].files).toHaveLength(0);
});

it('shows the folder in the editor header', () => {
    openPlayground();
    const header = editor().closest('.editor-container').querySelector('.title-section');
    expect(header).toHaveTextContent('DSA/index');
});
