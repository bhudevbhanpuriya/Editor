import { judge0IdFor } from '../../config/languages';

// The public ce.judge0.com endpoint is heavily rate limited. Point these at a
// RapidAPI or self-hosted instance via .env to get reliable execution.
const BASE_URL = process.env.REACT_APP_JUDGE0_URL || 'https://ce.judge0.com';
const API_HOST = process.env.REACT_APP_JUDGE0_HOST;
const API_KEY = process.env.REACT_APP_JUDGE0_KEY;

const POLL_INTERVAL_MS = 250;
const MAX_ATTEMPTS = 40; // 40 x 250ms = 10 seconds

const authHeaders = () => (
    API_KEY ? { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST } : {}
);

// btoa/atob only handle latin1, so round-trip through UTF-8 first. Without
// this, any non-ASCII character in the source or stdin throws. Done with
// encodeURIComponent rather than TextEncoder so there is no dependency on
// globals that older runtimes and jsdom do not provide.
export const encodeBase64 = (str) =>
    btoa(
        encodeURIComponent(str).replace(
            /%([0-9A-F]{2})/g,
            (_, hex) => String.fromCharCode(parseInt(hex, 16))
        )
    );

export const decodeBase64 = (value) => {
    if (!value) return "";
    try {
        return decodeURIComponent(
            atob(value)
                .split('')
                .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
    } catch (e) {
        return value;
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Submits code to Judge0 and polls until it finishes.
 *
 * `callback` is called with { apiStatus: 'loading' | 'success' | 'error' }.
 * On success it also receives `output` (already base64-decoded) and `status`,
 * so callers never have to know about Judge0's encoding.
 */
export async function makeSubmission(code, input, language, callback = () => { }) {
    const language_id = judge0IdFor(language);

    if (!language_id) {
        return callback({ apiStatus: "error", message: "Invalid language selected" });
    }

    if (!code?.trim()) {
        return callback({ apiStatus: "error", message: "Nothing to run — the editor is empty." });
    }

    callback({ apiStatus: "loading" });

    try {
        const res = await fetch(`${BASE_URL}/submissions/?base64_encoded=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({
                language_id,
                source_code: encodeBase64(code),
                stdin: encodeBase64(input || "")
            })
        });

        if (!res.ok) {
            const detail = res.status === 429
                ? "Judge0 rate limit reached. Please try again in a moment."
                : `Judge0 rejected the submission (HTTP ${res.status}).`;
            return callback({ apiStatus: "error", message: detail });
        }

        const { token } = await res.json();

        if (!token) {
            return callback({ apiStatus: "error", message: "No token received from Judge0" });
        }

        let result;
        // 1 = In Queue, 2 = Processing. Anything else means Judge0 is done.
        let status = 1;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            await sleep(POLL_INTERVAL_MS);

            const poll = await fetch(
                `${BASE_URL}/submissions/${token}?base64_encoded=true`,
                { headers: authHeaders() }
            );

            if (!poll.ok) {
                return callback({
                    apiStatus: "error",
                    message: `Could not read the result (HTTP ${poll.status}).`
                });
            }

            result = await poll.json();
            status = result?.status?.id;

            if (status !== 1 && status !== 2) break;
        }

        if (status === 1 || status === 2) {
            return callback({ apiStatus: "error", message: "Execution timed out. Please try again." });
        }

        // Status 3 = Accepted. Everything else surfaces stderr / compile output.
        const output = status === 3
            ? decodeBase64(result.stdout)
            : decodeBase64(result.compile_output) ||
              decodeBase64(result.stderr) ||
              decodeBase64(result.stdout) ||
              result?.status?.description ||
              "Execution failed.";

        callback({ apiStatus: "success", data: result, output, status });
        return output;
    } catch (error) {
        callback({
            apiStatus: "error",
            message: "Could not reach the execution service. Check your connection and try again."
        });
    }
}
