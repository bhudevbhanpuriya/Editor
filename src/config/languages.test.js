import {
    DEFAULT_LANGUAGE,
    LANGUAGES,
    extensionFor,
    judge0IdFor,
    languageOptions,
    monacoIdFor,
    starterCode,
    supportedLanguages
} from './languages';

it('offers a broad set of languages', () => {
    expect(supportedLanguages.length).toBeGreaterThanOrEqual(16);
});

// These keys are written into saved workspaces. Renaming one would orphan
// every file already using it.
it('keeps the original language keys', () => {
    ['cpp', 'java', 'javascript', 'python'].forEach(key => {
        expect(supportedLanguages).toContain(key);
    });
});

it.each(Object.entries(LANGUAGES))('%s is fully configured', (key, config) => {
    expect(config.label).toBeTruthy();
    expect(typeof config.judge0Id).toBe('number');
    expect(config.monaco).toBeTruthy();
    expect(config.extension).toMatch(/^[a-z]+$/);
    expect(config.starter.trim()).not.toBe('');
    // Every starter should print something, so a new file runs as-is.
    expect(config.starter).toMatch(/Hello World!/);
});

it('maps each language to a distinct Judge0 id', () => {
    const ids = supportedLanguages.map(judge0IdFor);
    expect(new Set(ids).size).toBe(ids.length);
});

it('lists options alphabetically by label', () => {
    const labels = languageOptions.map(o => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
});

it('has a default that is actually supported', () => {
    expect(supportedLanguages).toContain(DEFAULT_LANGUAGE);
});

describe('lookups', () => {
    it('resolves known languages', () => {
        expect(extensionFor('rust')).toBe('rs');
        expect(monacoIdFor('shell')).toBe('shell');
        expect(judge0IdFor('typescript')).toBe(74);
        expect(starterCode('go')).toContain('package main');
    });

    it('degrades safely for unknown languages', () => {
        expect(starterCode('cobol')).toBe('');
        expect(extensionFor('cobol')).toBe('txt');
        expect(judge0IdFor('cobol')).toBeUndefined();
        // Monaco must never receive undefined, or the editor breaks.
        expect(monacoIdFor('cobol')).toBe('plaintext');
    });
});
