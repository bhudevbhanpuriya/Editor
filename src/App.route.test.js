import { render, screen, within } from '@testing-library/react';
import App from './App';

jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value }) => <textarea data-testid="editor" value={value} readOnly />
}));

it('opens a playground URL directly', () => {
    localStorage.clear();
    // Seed the workspace the way a first visit would, then deep-link into it.
    const { unmount } = render(<App />);
    const { folders } = JSON.parse(localStorage.getItem('data'));
    unmount();

    const folder = folders[0];
    window.history.pushState({}, '', `/playground/${folder.files[0].id}/${folder.id}`);

    render(<App />);

    // The file tree marks the open file, and the editor holds its code.
    const tree = screen.getByRole('complementary', { name: 'Files' });
    expect(within(tree).getByRole('link', { name: /index/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('editor').value).toContain('#include');
    expect(screen.getByRole('button', { name: /Run Code/i })).toBeInTheDocument();
});
