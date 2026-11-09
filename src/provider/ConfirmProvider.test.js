import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from './ConfirmProvider';

const Subject = ({ onResult }) => {
    const confirm = useConfirm();
    return (
        <button
            onClick={async () => onResult(await confirm({
                title: 'Delete folder',
                message: 'Delete "DSA" and everything in it?',
                confirmLabel: 'Delete',
                destructive: true
            }))}
        >
            trigger
        </button>
    );
};

const setup = () => {
    const onResult = jest.fn();
    render(<ConfirmProvider><Subject onResult={onResult} /></ConfirmProvider>);
    return { onResult, user: userEvent.setup() };
};

it('renders nothing until asked', () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('resolves true when confirmed', async () => {
    const { onResult, user } = setup();

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    expect(await screen.findByText(/Delete "DSA"/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('resolves false when cancelled', async () => {
    const { onResult, user } = setup();

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(onResult).toHaveBeenCalledWith(false);
});

it('resolves false on Escape rather than leaving the promise pending', async () => {
    const { onResult, user } = setup();

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    expect(onResult).toHaveBeenCalledWith(false);
});

it('resolves false when the backdrop is clicked', async () => {
    const { onResult, user } = setup();

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await screen.findByRole('dialog');
    await user.click(document.querySelector('.model-container'));

    expect(onResult).toHaveBeenCalledWith(false);
});
