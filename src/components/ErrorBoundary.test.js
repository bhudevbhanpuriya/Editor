import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = () => {
    throw new Error('editor exploded');
};

let assign;

beforeEach(() => {
    // React logs caught errors; keep the test output readable.
    jest.spyOn(console, 'error').mockImplementation(() => { });
    assign = jest.fn();
    delete window.location;
    window.location = { assign };
});

afterEach(() => {
    console.error.mockRestore();
});

it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>all good</p></ErrorBoundary>);
    expect(screen.getByText('all good')).toBeInTheDocument();
});

it('shows a recoverable fallback instead of a blank page', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something broke/i)).toBeInTheDocument();
    expect(screen.getByText(/editor exploded/)).toBeInTheDocument();
});

it('reloads without touching stored work', async () => {
    const user = userEvent.setup();
    localStorage.setItem('data', '[]');

    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    await user.click(screen.getByRole('button', { name: 'Reload' }));

    expect(localStorage.getItem('data')).toBe('[]');
    expect(assign).toHaveBeenCalledWith('/');
});

// A corrupt entry could otherwise crash the app on every load with no way out
// from the UI.
it('offers a reset that clears the stored workspace', async () => {
    const user = userEvent.setup();
    localStorage.setItem('data', '[]');

    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    await user.click(screen.getByRole('button', { name: /Reset workspace/i }));

    expect(localStorage.getItem('data')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/');
});
