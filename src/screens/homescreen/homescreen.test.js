import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomeScreen } from './index';
import { PlayGroundProvider } from '../../provider/playground-provider';
import { ModelProvider } from '../../provider/ModelProvider';
import { ConfirmProvider } from '../../provider/ConfirmProvider';
import { NotificationProvider } from '../../provider/NotificationProvider';
import { supportedLanguages } from '../../config/languages';

const renderHome = () => render(
    <NotificationProvider>
        <PlayGroundProvider>
            <ModelProvider>
                <ConfirmProvider>
                    <MemoryRouter>
                        <HomeScreen />
                    </MemoryRouter>
                </ConfirmProvider>
            </ModelProvider>
        </PlayGroundProvider>
    </NotificationProvider>
);

// react-scripts 5 ships jsdom 16, which does not dispatch a submit event when
// a submit button is clicked (jsdom gained that in v21), so submit the form.
const submitModel = () => fireEvent.submit(screen.getByRole('dialog'));

beforeEach(() => localStorage.clear());

it('lists the seeded folders and files', () => {
    renderHome();
    expect(screen.getByText('DSA')).toBeInTheDocument();
    expect(screen.getByText('index')).toBeInTheDocument();
    expect(screen.getByText(/Language: cpp/)).toBeInTheDocument();
});

it('creates a folder through the modal', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.type(screen.getByPlaceholderText('Folder name'), 'Graphs');
    submitModel();

    expect(screen.getByText('Graphs')).toBeInTheDocument();
    // Regression: this used to call createNewPlayground, producing a phantom
    // file with an undefined name and no code.
    expect(screen.getAllByText(/No files yet/)).toHaveLength(1);
});

it('creates a playground with the file name that was typed', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Create Playground/i }));
    await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'Trees');
    await user.type(screen.getByRole('textbox', { name: 'File name' }), 'traversal');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'python');
    submitModel();

    expect(screen.getByText('Trees')).toBeInTheDocument();
    // Regression: the model passed `filename` while the provider read
    // `fileName`, so every new playground was created with no title.
    expect(screen.getByText('traversal')).toBeInTheDocument();
    expect(screen.getByText(/Language: python/)).toBeInTheDocument();
});

it('prefills the rename modal with the current name', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Rename folder DSA' }));

    const input = screen.getByRole('textbox', { name: 'New folder name' });
    expect(input).toHaveValue('DSA');

    await user.clear(input);
    await user.type(input, 'Data Structures');
    submitModel();

    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.queryByText('DSA')).not.toBeInTheDocument();
});

it('closes a modal on Escape', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('closes a modal when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderHome();

    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.click(container.querySelector('.model-container'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('rejects a whitespace-only folder name', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.type(screen.getByPlaceholderText('Folder name'), '   ');
    submitModel();

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be empty/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('deleting a file asks first, then does not navigate into it', async () => {
    const user = userEvent.setup();
    renderHome();

    const dsa = screen.getByText('DSA').closest('.folder-container');
    await user.click(within(dsa).getByRole('button', { name: 'Delete index' }));

    // The confirm prompt is a real dialog now, not a blocking window.confirm.
    expect(await screen.findByRole('dialog', { name: 'Delete file' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('index')).not.toBeInTheDocument();
    // Still on the home screen — the click did not bubble to the card.
    expect(screen.getByText('My PlayGround')).toBeInTheDocument();
});

it('keeps the file when the delete confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderHome();

    const dsa = screen.getByText('DSA').closest('.folder-container');
    await user.click(within(dsa).getByRole('button', { name: 'Delete index' }));

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('index')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('cancels the delete when the prompt is dismissed with Escape', async () => {
    const user = userEvent.setup();
    renderHome();

    const dsa = screen.getByText('DSA').closest('.folder-container');
    await user.click(within(dsa).getByRole('button', { name: 'Delete index' }));
    await screen.findByRole('dialog', { name: 'Delete file' });

    await user.keyboard('{Escape}');

    expect(screen.getByText('index')).toBeInTheDocument();
});

describe('language support', () => {
    it('offers every configured language in the create dialog', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(screen.getByRole('button', { name: /Create Playground/i }));
        const select = screen.getByRole('combobox', { name: 'Language' });

        expect(within(select).getAllByRole('option')).toHaveLength(supportedLanguages.length);
        ['Rust', 'Go', 'TypeScript', 'Bash', 'C#'].forEach(label => {
            expect(within(select).getByRole('option', { name: label })).toBeInTheDocument();
        });
    });

    it('creates a playground in one of the newly added languages', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(screen.getByRole('button', { name: /Create Playground/i }));
        await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'Systems');
        await user.type(screen.getByRole('textbox', { name: 'File name' }), 'main');
        await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'rust');
        submitModel();

        expect(screen.getByText(/Language: rust/)).toBeInTheDocument();

        const file = JSON.parse(localStorage.getItem('data')).folders.at(-1).files[0];
        expect(file.code).toContain('fn main()');
    });
});
