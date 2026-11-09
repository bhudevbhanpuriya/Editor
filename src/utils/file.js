// Extensions the browser commonly reports with an empty or non-text MIME type.
const CODE_EXTENSIONS = [
    'txt', 'in', 'out', 'md',
    'c', 'cc', 'cpp', 'cxx', 'h', 'hpp',
    'java', 'js', 'jsx', 'ts', 'tsx',
    'py', 'rb', 'go', 'rs', 'cs', 'php', 'swift', 'kt',
    'json', 'yml', 'yaml', 'csv', 'xml', 'html', 'css', 'scss', 'sh'
];

// `file.type` is empty for .cpp / .py / .java on most browsers, so an
// extension check is needed as well or legitimate source files get rejected.
export const isTextFile = (file) => {
    if (!file) return false;
    if (file.type.startsWith('text/')) return true;
    if (file.type && !file.type.startsWith('application/')) return false;

    const extension = file.name.split('.').pop()?.toLowerCase();
    return CODE_EXTENSIONS.includes(extension);
};

/**
 * Reads a picked file as text. Resolves with the file contents, or rejects
 * with a user-facing message. Always clears the input so picking the same
 * file twice still fires a change event.
 */
export const readPickedFile = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return Promise.reject(new Error('No file selected.'));

    if (!isTextFile(file)) {
        return Promise.reject(new Error('Please choose a plain text or source code file.'));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Could not read that file.'));
        reader.readAsText(file);
    });
};

export const downloadTextFile = (contents, filename) => {
    const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Freeing the blob immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
