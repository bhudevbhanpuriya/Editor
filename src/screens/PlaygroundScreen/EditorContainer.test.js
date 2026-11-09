import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { EditorContainer } from './EditorContainer';
import { PlaygroundContext, PlayGroundProvider } from '../../provider/playground-provider';
import { ModelProvider } from '../../provider/ModelProvider';
import { Model } from '../../provider/models/model';
import { NotificationProvider } from '../../provider/NotificationProvider';

// Monaco cannot run under jsdom; stand in a textarea that speaks the same
// value/onChange contract so the container's own logic stays under test.
jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value, onChange, language }) => (
        <textarea
            data-testid="editor"
            data-language={language}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

let api;

const Harness = ({ folderId, fileId, runCode = jest.fn() }) => {
    api = useContext(PlaygroundContext);
    return <>
        <EditorContainer folderId={folderId} fileId={fileId} runCode={runCode} />
        <Model />
    </>;
};

const renderEditor = ({ folderId, fileId, runCode } = {}) => {
    let ids = {};
    const Wrapper = () => {
        const ctx = useContext(PlaygroundContext);
        ids.folderId = ctx.folders[0].id;
        ids.fileId = ctx.folders[0].files[0].id;
        return <Harness
            folderId={folderId ?? ids.folderId}
            fileId={fileId ?? ids.fileId}
            runCode={runCode}
        />;
    };

    // The container renders ShareButton, which reads the URL, so it needs a
    // router just as it has one in the app.
    const utils = render(
        <MemoryRouter>
            <NotificationProvider>
                <PlayGroundProvider>
                    <ModelProvider>
                        <Wrapper />
                    </ModelProvider>
                </PlayGroundProvider>
            </NotificationProvider>
        </MemoryRouter>
    );
    return { ...utils, ids };
};

const stored = () => JSON.parse(localStorage.getItem('data')).folders;

beforeEach(() => localStorage.clear());

it('loads the saved file into the editor', () => {
    renderEditor();
    expect(screen.getByText('index')).toBeInTheDocument();
    expect(screen.getByTestId('editor').value).toContain('#include');
});

// Regression: the container used to read localStorage directly inside an
// effect. On a fresh browser that key does not exist yet, so JSON.parse(null)
// returned null and `.find` threw before anything rendered.
it('renders a message instead of crashing for an unknown file', () => {
    renderEditor({ folderId: 'missing', fileId: 'missing' });
    expect(screen.getByText(/no longer exists/i)).toBeInTheDocument();
});

it('saves edited code to storage', async () => {
    const user = userEvent.setup();
    const { ids } = renderEditor();

    const editor = screen.getByTestId('editor');
    await user.clear(editor);
    // Braces are key descriptors for userEvent, so keep the payload plain.
    await user.type(editor, 'return 0;');
    await user.click(screen.getByRole('button', { name: 'Save Code' }));

    expect(stored()[0].files[0].code).toBe('return 0;');
    expect(await screen.findByText('Code saved')).toBeInTheDocument();
    expect(ids.fileId).toBeTruthy();
});

// Regression: changing the language updated local state only, so a reload
// restored the old language while keeping the new starter code.
it('persists a language change immediately', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'python');

    const saved = stored()[0].files[0];
    expect(saved.language).toBe('python');
    expect(saved.code).toContain('print');
    expect(screen.getByTestId('editor')).toHaveAttribute('data-language', 'python');
});

it('runs the current draft, not the last saved version', async () => {
    const user = userEvent.setup();
    const runCode = jest.fn();
    renderEditor({ runCode });

    const editor = screen.getByTestId('editor');
    await user.clear(editor);
    await user.type(editor, 'draft');
    await user.click(screen.getByRole('button', { name: /Run Code/i }));

    expect(runCode).toHaveBeenCalledWith({ code: 'draft', language: 'cpp' });
});

it('refuses to export an empty file', async () => {
    const user = userEvent.setup();
    const createObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;

    renderEditor();
    await user.clear(screen.getByTestId('editor'));
    await user.click(screen.getByRole('button', { name: /Export Code/i }));

    expect(await screen.findByText(/nothing to export/i)).toBeInTheDocument();
    // Regression: the old code alerted but then downloaded an empty file anyway.
    expect(createObjectURL).not.toHaveBeenCalled();
});

it('renaming through the modal updates the title in place', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Rename file' }));
    const input = screen.getByRole('textbox', { name: 'New file name' });
    expect(input).toHaveValue('index');

    await user.clear(input);
    await user.type(input, 'solution');
    fireEvent.submit(screen.getByRole('dialog'));

    expect(screen.getByText('solution')).toBeInTheDocument();
    expect(stored()[0].files[0].title).toBe('solution');
});

it('toggles full screen', async () => {
    const user = userEvent.setup();
    const { container } = renderEditor();

    const toggle = screen.getByRole('button', { name: /Full Screen/i });
    expect(container.querySelector('.editor-container')).not.toHaveStyle({ position: 'absolute' });

    await user.click(toggle);

    expect(container.querySelector('.editor-container')).toHaveStyle({ position: 'absolute' });
    expect(screen.getByRole('button', { name: /Minimize/i })).toBeInTheDocument();
});

describe('autosave', () => {
    beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
    afterEach(() => jest.useRealTimers());

    it('persists edits without pressing Save', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        renderEditor();

        const editor = screen.getByTestId('editor');
        await user.clear(editor);
        await user.type(editor, 'autosaved');

        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        expect(stored()[0].files[0].code).not.toBe('autosaved');

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(stored()[0].files[0].code).toBe('autosaved');
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    // Regression: edits made inside the debounce window used to be dropped
    // when navigating back to the home screen. Only the editor unmounts there
    // — the providers live above the router — so the test mirrors that.
    it('flushes pending edits when the editor unmounts', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        const Tree = ({ show }) => {
            const ctx = useContext(PlaygroundContext);
            const folder = ctx.folders[0];
            return show
                ? <EditorContainer
                    folderId={folder.id}
                    fileId={folder.files[0].id}
                    runCode={jest.fn()}
                />
                : <p>home</p>;
        };

        const Tree_ = ({ show }) => (
            <MemoryRouter>
                <NotificationProvider>
                    <PlayGroundProvider>
                        <ModelProvider>
                            <Tree show={show} />
                        </ModelProvider>
                    </PlayGroundProvider>
                </NotificationProvider>
            </MemoryRouter>
        );

        const { rerender } = render(<Tree_ show />);

        const editor = screen.getByTestId('editor');
        await user.clear(editor);
        await user.type(editor, 'in flight');
        expect(stored()[0].files[0].code).not.toBe('in flight');

        await act(async () => rerender(<Tree_ show={false} />));

        expect(screen.getByText('home')).toBeInTheDocument();
        expect(stored()[0].files[0].code).toBe('in flight');
    });
});

describe('editor theme', () => {
    it('offers a working light option', async () => {
        const user = userEvent.setup();
        renderEditor();

        const select = screen.getByRole('combobox', { name: 'Editor theme' });
        // Regression: the light option used to be 'vs-light', which is not a
        // Monaco theme id, so switching to it did nothing.
        expect(within(select).getByRole('option', { name: 'Light' })).toHaveValue('vs');

        await user.selectOptions(select, 'vs');
        expect(select).toHaveValue('vs');
    });

    it('defaults to the theme that matches the app surface', () => {
        renderEditor();
        expect(screen.getByRole('combobox', { name: 'Editor theme' })).toHaveValue('codein-dark');
    });
});
