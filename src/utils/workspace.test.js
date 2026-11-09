import {
    countFiles,
    quickOpenEntries,
    recentEntries,
    searchEntries,
    starredEntries
} from './workspace';

const file = (id, title, extra = {}) => ({ id, title, code: '', language: 'cpp', ...extra });

const folders = [
    {
        id: 'algo', title: 'Algorithms', files: [
            file('bfs', 'bfs', { code: 'queue<int> q;', updatedAt: 100 }),
            file('dfs', 'dfs', { code: 'stack', openedAt: 300, starred: true }),
            file('old', 'legacy')
        ]
    },
    {
        id: 'web', title: 'Web', files: [
            file('home', 'homepage', { language: 'javascript', updatedAt: 200, starred: true }),
            file('sort', 'quicksort-graph', { updatedAt: 50 })
        ]
    }
];

const ids = (entries) => entries.map(e => e.file.id);

it('counts files across folders', () => {
    expect(countFiles(folders)).toBe(5);
    expect(countFiles([])).toBe(0);
});

it('orders Recent by the later of opened and edited, skipping undated files', () => {
    expect(ids(recentEntries(folders))).toEqual(['dfs', 'home', 'bfs', 'sort']);
    expect(ids(recentEntries(folders, 2))).toEqual(['dfs', 'home']);
});

it('lists starred files, most recent first', () => {
    expect(ids(starredEntries(folders))).toEqual(['dfs', 'home']);
});

describe('searchEntries', () => {
    it('ranks name matches above folder and code matches', () => {
        const results = searchEntries(folders, 'q');
        expect(results[0]).toMatchObject({ matchedIn: 'title' });
        expect(ids(results)).toEqual(['sort', 'bfs']);
        expect(results[1].matchedIn).toBe('code');
    });

    it('matches folder names', () => {
        const results = searchEntries(folders, 'algorithms');
        expect(ids(results)).toEqual(['bfs', 'dfs', 'old']);
        expect(results.every(r => r.matchedIn === 'folder')).toBe(true);
    });

    it('is case-insensitive and ignores surrounding space', () => {
        expect(ids(searchEntries(folders, '  HOME '))).toEqual(['home']);
    });

    it('returns nothing for an empty query', () => {
        expect(searchEntries(folders, '   ')).toEqual([]);
    });
});

describe('quickOpenEntries', () => {
    it('shows recent files for an empty query', () => {
        expect(ids(quickOpenEntries(folders, ''))[0]).toBe('dfs');
    });

    it('falls back to all files when nothing has a timestamp', () => {
        const undated = [{ id: 'f', title: 'F', files: [file('a', 'a'), file('b', 'b')] }];
        expect(ids(quickOpenEntries(undated, ''))).toEqual(['a', 'b']);
    });

    it('ranks prefix matches, then substring, then folder; never code', () => {
        expect(ids(quickOpenEntries(folders, 'quick'))).toEqual(['sort']);
        expect(ids(quickOpenEntries(folders, 'graph'))).toEqual(['sort']);
        expect(ids(quickOpenEntries(folders, 'web'))).toEqual(['home', 'sort']);
        expect(quickOpenEntries(folders, 'stack')).toEqual([]);
    });
});
