import { decodeBase64, encodeBase64, makeSubmission } from './service';

describe('base64 helpers', () => {
    it('round-trips ASCII', () => {
        expect(decodeBase64(encodeBase64('hello world'))).toBe('hello world');
    });

    it('round-trips non-latin1 text (raw btoa would throw here)', () => {
        const source = 'const s = "héllo — 日本語 🎉";';
        expect(() => btoa(source)).toThrow();
        expect(decodeBase64(encodeBase64(source))).toBe(source);
    });

    it('decodes empty/undefined values to an empty string', () => {
        expect(decodeBase64(undefined)).toBe('');
        expect(decodeBase64('')).toBe('');
    });
});

describe('makeSubmission', () => {
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects an unsupported language before hitting the network', async () => {
        global.fetch = jest.fn();
        const callback = jest.fn();

        await makeSubmission('code', '', 'brainfuck', callback);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({ apiStatus: 'error' })
        );
    });

    it('rejects empty source before hitting the network', async () => {
        global.fetch = jest.fn();
        const callback = jest.fn();

        await makeSubmission('   ', '', 'cpp', callback);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(callback.mock.calls[0][0].apiStatus).toBe('error');
    });

    it('reports an error (not a hung loader) when the network fails', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        const callback = jest.fn();

        await makeSubmission('int main(){}', '', 'cpp', callback);

        const statuses = callback.mock.calls.map(([arg]) => arg.apiStatus);
        expect(statuses).toEqual(['loading', 'error']);
    });

    it('surfaces a friendly message when Judge0 rate limits', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });
        const callback = jest.fn();

        await makeSubmission('int main(){}', '', 'cpp', callback);

        expect(callback.mock.calls.at(-1)[0].message).toMatch(/rate limit/i);
    });

    it('decodes stdout on a successful run', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tok' }) })
            .mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: { id: 3, description: 'Accepted' },
                    stdout: encodeBase64('Hello World!')
                })
            });

        const callback = jest.fn();
        const result = await makeSubmission('int main(){}', '', 'cpp', callback);

        expect(result).toBe('Hello World!');
        expect(callback.mock.calls.at(-1)[0]).toMatchObject({
            apiStatus: 'success',
            output: 'Hello World!'
        });
    });

    it('surfaces compile output on a compilation error', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tok' }) })
            .mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: { id: 6, description: 'Compilation Error' },
                    compile_output: encodeBase64("error: 'x' was not declared")
                })
            });

        const callback = jest.fn();
        await makeSubmission('int main(){ x; }', '', 'cpp', callback);

        expect(callback.mock.calls.at(-1)[0].output).toContain('was not declared');
    });

    it('stops polling once the submission leaves the queue', async () => {
        let polls = 0;
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tok' }) })
            .mockImplementation(async () => {
                polls++;
                return {
                    ok: true,
                    json: async () => ({
                        status: { id: polls < 3 ? 2 : 3 },
                        stdout: encodeBase64('done')
                    })
                };
            });

        const callback = jest.fn();
        await makeSubmission('int main(){}', '', 'cpp', callback);
        await flush();

        expect(polls).toBe(3);
        expect(callback.mock.calls.at(-1)[0].apiStatus).toBe('success');
    });
});
