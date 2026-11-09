import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: () => <div data-testid="editor" />
}));

beforeEach(() => localStorage.clear());

it('boots the home screen without crashing', () => {
    render(<App />);
    expect(screen.getByText('My PlayGround')).toBeInTheDocument();
    expect(screen.getByText('DSA')).toBeInTheDocument();
});
