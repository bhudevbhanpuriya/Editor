import { isTextFile } from './file';

const asFile = (name, type) => ({ name, type });

describe('isTextFile', () => {
    it('accepts explicit text mime types', () => {
        expect(isTextFile(asFile('notes.txt', 'text/plain'))).toBe(true);
    });

    // Browsers report an empty type for most source files, which is why the
    // original `file.type.includes('text')` check rejected real code.
    it.each(['main.cpp', 'Main.java', 'solve.py', 'app.js', 'input.in'])(
        'accepts %s when the browser reports no mime type',
        (name) => {
            expect(isTextFile(asFile(name, ''))).toBe(true);
        }
    );

    it('rejects binaries', () => {
        expect(isTextFile(asFile('photo.png', 'image/png'))).toBe(false);
        expect(isTextFile(asFile('archive.zip', ''))).toBe(false);
    });

    it('handles a missing file', () => {
        expect(isTextFile(undefined)).toBe(false);
    });
});
