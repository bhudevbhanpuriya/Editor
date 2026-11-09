import { act, render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { PlaygroundContext, PlayGroundProvider, findFile } from './playground-provider';
import { NotificationProvider } from './NotificationProvider';

let api;

const Probe = () => {
    api = useContext(PlaygroundContext);
    return <div data-testid="count">{api.folders.length}</div>;
};

const setup = () => render(<PlayGroundProvider><Probe /></PlayGroundProvider>);

const stored = () => JSON.parse(localStorage.getItem('data')).folders;

beforeEach(() => {
    localStorage.clear();
    api = null;
});

describe('seed data', () => {
    it('starts with two folders that use supported languages', () => {
        setup();
        expect(screen.getByTestId('count')).toHaveTextContent('2');
        const languages = api.folders.flatMap(f => f.files.map(file => file.language));
        expect(languages).toEqual(['cpp', 'javascript']);
    });

    it('recovers from corrupted localStorage instead of crashing', () => {
        localStorage.setItem('data', '{not json');
        setup();
        expect(api.folders).toHaveLength(2);
    });

    it('drops malformed entries from stored data', () => {
        localStorage.setItem('data', JSON.stringify([
            null,
            { id: 'f1', title: 'Kept', files: [null, { id: 'x', title: 'ok' }] },
            { title: 'no id' }
        ]));
        setup();
        expect(api.folders).toHaveLength(1);
        expect(api.folders[0].files).toHaveLength(1);
    });
});

describe('folders', () => {
    it('createNewFolder adds an empty folder and persists it', () => {
        setup();
        act(() => api.createNewFolder({ folderName: 'Algorithms' }));

        const folder = api.folders.at(-1);
        expect(folder.title).toBe('Algorithms');
        expect(folder.files).toEqual([]);
        expect(stored().at(-1).title).toBe('Algorithms');
    });

    it('renameFolder does not mutate the previous state object', () => {
        setup();
        const before = api.folders[0];
        act(() => api.renameFolder('Renamed', before.id));

        expect(before.title).toBe('DSA');
        expect(api.folders[0].title).toBe('Renamed');
        expect(stored()[0].title).toBe('Renamed');
    });

    it('deleteFolder removes it from state and storage', () => {
        setup();
        const { id } = api.folders[0];
        act(() => api.deleteFolder(id));

        expect(api.folders.find(f => f.id === id)).toBeUndefined();
        expect(stored()).toHaveLength(1);
    });
});

describe('files', () => {
    it('createNewPlayground names the file (regression: fileName was dropped)', () => {
        setup();
        act(() => api.createNewPlayground({
            folderName: 'Contest',
            fileName: 'solution',
            language: 'python'
        }));

        const file = api.folders.at(-1).files[0];
        expect(file.title).toBe('solution');
        expect(file.language).toBe('python');
        expect(file.code).toContain('print');
    });

    it('createNewFile seeds the starter code for the language', () => {
        setup();
        const folderId = api.folders[0].id;
        act(() => api.createNewFile('Main', 'java', folderId));

        const file = api.folders[0].files.at(-1);
        expect(file.title).toBe('Main');
        expect(file.code).toContain('public class Main');
    });

    it('deleteFile only touches the given folder', () => {
        setup();
        const [first, second] = api.folders;
        const fileId = first.files[0].id;

        act(() => api.deleteFile(first.id, fileId));

        expect(api.folders[0].files).toHaveLength(0);
        expect(api.folders[1].files).toHaveLength(second.files.length);
    });

    it('renameFile does not mutate the previous file object', () => {
        setup();
        const folder = api.folders[0];
        const before = folder.files[0];

        act(() => api.renameFile('renamed', folder.id, before.id));

        expect(before.title).toBe('index');
        expect(api.folders[0].files[0].title).toBe('renamed');
    });

    it('updateFile persists a language switch alongside the code', () => {
        setup();
        const folder = api.folders[0];
        const file = folder.files[0];

        act(() => api.updateFile(folder.id, file.id, {
            language: 'python',
            code: 'print(1)'
        }));

        const saved = stored()[0].files[0];
        expect(saved.language).toBe('python');
        expect(saved.code).toBe('print(1)');
    });

    it('consecutive updates both persist', () => {
        setup();
        const folder = api.folders[0];
        const file = folder.files[0];

        act(() => {
            api.updateFileCode(folder.id, file.id, 'first');
            api.updateFileCode(folder.id, file.id, 'second');
        });

        expect(stored()[0].files[0].code).toBe('second');
    });
});

describe('findFile', () => {
    it('returns the folder and file when both exist', () => {
        setup();
        const folder = api.folders[0];
        const result = findFile(api.folders, folder.id, folder.files[0].id);
        expect(result.file.title).toBe('index');
    });

    it('returns nulls for unknown ids instead of throwing', () => {
        setup();
        expect(findFile(api.folders, 'nope', 'nope')).toEqual({ folder: null, file: null });
        expect(findFile(undefined, 'a', 'b').file).toBeNull();
    });
});

describe('storage failures', () => {
    const renderWithToasts = () => render(
        <NotificationProvider>
            <PlayGroundProvider><Probe /></PlayGroundProvider>
        </NotificationProvider>
    );

    afterEach(() => {
        Storage.prototype.setItem.mockRestore?.();
        console.warn.mockRestore?.();
    });

    // localStorage caps out around 5 MB; work used to vanish silently.
    it('tells the user when the workspace cannot be persisted', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('quota', 'QuotaExceededError');
        });

        renderWithToasts();

        expect(await screen.findByText(/could not save to browser storage/i))
            .toBeInTheDocument();
    });

    it('stays quiet while writes succeed', () => {
        renderWithToasts();
        expect(screen.queryByText(/could not save/i)).not.toBeInTheDocument();
    });
});

// Users who ran the pre-fix app still have its damaged workspace saved in
// their browser; the fixes above only affect freshly created data.
describe('migration from the pre-fix app', () => {
    const legacy = (folders) => localStorage.setItem('data', JSON.stringify(folders));

    it('repairs the seeded file that used the language "jabascript"', () => {
        legacy([{
            id: 'f1', title: 'Web-dev',
            files: [{ id: 'a', title: 'homepage', code: 'x', language: 'jabascript' }]
        }]);
        setup();

        expect(api.folders[0].files[0].language).toBe('javascript');
        expect(api.folders[0].files[0].code).toBe('x');
    });

    it('removes the phantom file the old Create Folder button left behind', () => {
        legacy([{
            id: 'f1', title: 'Graphs',
            files: [{ id: 'ghost' }, { id: 'real', title: 'main', code: 'y', language: 'cpp' }]
        }]);
        setup();

        expect(api.folders[0].files).toHaveLength(1);
        expect(api.folders[0].files[0].title).toBe('main');
    });

    it('names playgrounds whose title was dropped, keeping their code', () => {
        legacy([{
            id: 'f1', title: 'Trees',
            files: [{ id: 'a', code: 'int main(){}', language: 'cpp' }]
        }]);
        setup();

        const file = api.folders[0].files[0];
        expect(file.title).toBe('untitled');
        expect(file.code).toBe('int main(){}');
    });

    it('writes the repaired data back so the fix is permanent', () => {
        legacy([{
            id: 'f1', title: 'Web-dev',
            files: [{ id: 'a', title: 'homepage', code: 'x', language: 'jabascript' }]
        }]);
        setup();

        const raw = JSON.parse(localStorage.getItem('data'));
        expect(raw.version).toBe(2);
        expect(raw.folders[0].files[0].language).toBe('javascript');
    });

    it('leaves already-migrated data untouched', () => {
        localStorage.setItem('data', JSON.stringify({
            version: 2,
            folders: [{ id: 'f1', title: 'Kept', files: [{ id: 'a', title: 'keep', code: 'z', language: 'python' }] }]
        }));
        setup();

        expect(api.folders[0].title).toBe('Kept');
        expect(api.folders[0].files[0].language).toBe('python');
    });
});

describe('organisation fields', () => {
    const at = (time) => jest.spyOn(Date, 'now').mockReturnValue(time);
    afterEach(() => Date.now.mockRestore?.());

    it('stamps new files with created/updated times and no star', () => {
        setup();
        at(1000);
        let id;
        act(() => { id = api.createNewFile('Main', 'java', api.folders[0].id); });

        const file = api.folders[0].files.find(f => f.id === id);
        expect(file).toMatchObject({ starred: false, createdAt: 1000, updatedAt: 1000, openedAt: null });
    });

    it('fills defaults for files saved before these fields existed', () => {
        localStorage.setItem('data', JSON.stringify({
            version: 2,
            folders: [{ id: 'f1', title: 'Old', files: [{ id: 'a', title: 'x', code: '', language: 'cpp' }] }]
        }));
        setup();

        // Null, not "now": an old file must not look freshly edited.
        expect(api.folders[0].files[0]).toMatchObject({
            starred: false, createdAt: null, updatedAt: null, openedAt: null
        });
    });

    it('bumps updatedAt on a real change only', () => {
        setup();
        const folder = api.folders[0];
        const file = folder.files[0];

        at(5000);
        act(() => api.updateFile(folder.id, file.id, { code: file.code }));
        expect(api.folders[0].files[0].updatedAt).toBe(file.updatedAt);

        act(() => api.updateFile(folder.id, file.id, { code: 'changed' }));
        expect(api.folders[0].files[0].updatedAt).toBe(5000);

        at(6000);
        act(() => api.renameFile('renamed', folder.id, file.id));
        expect(api.folders[0].files[0].updatedAt).toBe(6000);
    });

    it('toggleStar flips the star and persists it', () => {
        setup();
        const folder = api.folders[0];
        const fileId = folder.files[0].id;

        act(() => api.toggleStar(folder.id, fileId));
        expect(stored()[0].files[0].starred).toBe(true);

        act(() => api.toggleStar(folder.id, fileId));
        expect(stored()[0].files[0].starred).toBe(false);
    });

    it('markOpened records when a file was opened, and ignores unknown files', () => {
        setup();
        const folder = api.folders[0];
        at(7000);
        act(() => api.markOpened(folder.id, folder.files[0].id));
        expect(api.folders[0].files[0].openedAt).toBe(7000);

        const before = api.folders;
        act(() => api.markOpened('nope', 'nope'));
        expect(api.folders).toBe(before);
    });
});

describe('moveFile', () => {
    it('moves a file to the end of another folder, keeping its contents', () => {
        setup();
        const [dsa, web] = api.folders;
        const file = dsa.files[0];

        act(() => api.moveFile(file.id, web.id));

        expect(api.folders[0].files).toHaveLength(0);
        expect(api.folders[1].files.map(f => f.id)).toEqual([web.files[0].id, file.id]);
        expect(api.folders[1].files[1]).toEqual(file);
        expect(stored()[1].files).toHaveLength(2);
    });

    it('is a no-op for the same folder or unknown ids', () => {
        setup();
        const [dsa] = api.folders;
        const before = api.folders;

        act(() => api.moveFile(dsa.files[0].id, dsa.id));
        act(() => api.moveFile('nope', dsa.id));
        act(() => api.moveFile(dsa.files[0].id, 'nope'));

        expect(api.folders).toBe(before);
    });

    // URLs and saved collab sessions carry the folder id at the time they were
    // made; after a move that id is stale but must keep working.
    it('keeps a stale folder id working for lookups and edits', () => {
        setup();
        const [dsa, web] = api.folders;
        const fileId = dsa.files[0].id;
        act(() => api.moveFile(fileId, web.id));

        const found = findFile(api.folders, dsa.id, fileId);
        expect(found.folder.id).toBe(web.id);
        expect(found.file.id).toBe(fileId);

        act(() => api.updateFile(dsa.id, fileId, { code: 'after move' }));
        act(() => api.renameFile('moved', dsa.id, fileId));
        expect(api.folders[1].files[1]).toMatchObject({ code: 'after move', title: 'moved' });

        act(() => api.deleteFile(dsa.id, fileId));
        expect(api.folders[1].files).toHaveLength(1);
    });
});
