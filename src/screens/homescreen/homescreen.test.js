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

// Folder names appear in the sidebar too, so tests address a folder's
// section on the page by its landmark rather than by text.
const section = (name) => screen.getByRole('region', { name });
const sidebar = () => screen.getByRole('complementary', { name: 'Workspace' });
// Scoped to the page: dialogs have a level-1 title too.
const heading = () => within(screen.getByRole('main')).getByRole('heading', { level: 1 });

// Move / Rename / Delete live in each card's "⋯" menu.
const cardAction = async (user, fileTitle, action, scope = screen) => {
    await user.click(scope.getByRole('button', { name: `More actions for ${fileTitle}` }));
    await user.click(screen.getByRole('menuitem', { name: action }));
};

it('lists the seeded folders and files', () => {
    renderHome();
    expect(heading()).toHaveTextContent('All files');
    expect(within(section('DSA')).getByText('index')).toBeInTheDocument();
    expect(within(section('DSA')).getByRole('img', { name: 'C++' })).toBeInTheDocument();
    expect(within(section('Web-dev')).getByText('homepage')).toBeInTheDocument();
});

it('creates a folder through the modal', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.type(screen.getByPlaceholderText('Folder name'), 'Graphs');
    submitModel();

    expect(section('Graphs')).toBeInTheDocument();
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

    // Regression: the model passed `filename` while the provider read
    // `fileName`, so every new playground was created with no title.
    expect(within(section('Trees')).getByText('traversal')).toBeInTheDocument();
    expect(within(section('Trees')).getByRole('img', { name: 'Python' })).toBeInTheDocument();
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

    expect(section('Data Structures')).toBeInTheDocument();
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

    const dsa = section('DSA');
    await cardAction(user, 'index', 'Delete', within(dsa));

    // The confirm prompt is a real dialog now, not a blocking window.confirm.
    expect(await screen.findByRole('dialog', { name: 'Delete file' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('index')).not.toBeInTheDocument();
    // Still on the home screen — the click did not bubble to the card.
    expect(heading()).toHaveTextContent('All files');
});

it('keeps the file when the delete confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderHome();

    const dsa = section('DSA');
    await cardAction(user, 'index', 'Delete', within(dsa));

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('index')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('cancels the delete when the prompt is dismissed with Escape', async () => {
    const user = userEvent.setup();
    renderHome();

    const dsa = section('DSA');
    await cardAction(user, 'index', 'Delete', within(dsa));
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

        expect(within(section('Systems')).getByRole('img', { name: 'Rust' })).toBeInTheDocument();

        const file = JSON.parse(localStorage.getItem('data')).folders.at(-1).files[0];
        expect(file.code).toContain('fn main()');
    });
});

describe('sidebar views', () => {
    it('counts files in each view and folder', () => {
        renderHome();
        const nav = within(sidebar());
        expect(nav.getByRole('button', { name: /All files/ })).toHaveTextContent('2');
        expect(nav.getByRole('button', { name: /Starred/ })).toHaveTextContent('0');
        expect(nav.getByRole('button', { name: /^DSA/ })).toHaveTextContent('1');
    });

    it('opens a single folder from the sidebar', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(within(sidebar()).getByRole('button', { name: /^Web-dev/ }));

        expect(heading()).toHaveTextContent('Web-dev');
        expect(screen.getByText('homepage')).toBeInTheDocument();
        expect(screen.queryByText('index')).not.toBeInTheDocument();
        expect(within(sidebar()).getByRole('button', { name: /^Web-dev/ }))
            .toHaveAttribute('aria-current', 'page');
    });

    it('lists recently created files under Recent', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(within(sidebar()).getByRole('button', { name: /Recent/ }));

        expect(heading()).toHaveTextContent('Recent');
        expect(screen.getByText('index')).toBeInTheDocument();
        expect(screen.getByText('homepage')).toBeInTheDocument();
    });

    it('returns to All files after deleting the open folder', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(within(sidebar()).getByRole('button', { name: /^DSA/ }));
        await user.click(screen.getByRole('button', { name: 'Delete folder DSA' }));
        await user.click(await screen.findByRole('button', { name: 'Delete' }));

        expect(heading()).toHaveTextContent('All files');
        expect(screen.queryByText('index')).not.toBeInTheDocument();
    });
});

describe('starring', () => {
    it('stars a file into the Starred view and unstars it again', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(screen.getByRole('button', { name: 'Star index' }));
        expect(screen.getByRole('button', { name: 'Unstar index' })).toHaveAttribute('aria-pressed', 'true');

        await user.click(within(sidebar()).getByRole('button', { name: /Starred/ }));
        expect(heading()).toHaveTextContent('Starred');
        expect(screen.getByText('index')).toBeInTheDocument();
        expect(screen.queryByText('homepage')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Unstar index' }));
        expect(screen.getByText(/Star a file/)).toBeInTheDocument();
    });

    it('does not open the file when its star is clicked', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(screen.getByRole('button', { name: 'Star index' }));
        expect(heading()).toHaveTextContent('All files');
    });
});

describe('search', () => {
    it('finds a file by a word in its code and says so', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.type(screen.getByRole('searchbox', { name: 'Search files' }), 'bits/stdc');

        expect(heading()).toHaveTextContent('Search');
        expect(screen.getByText('index')).toBeInTheDocument();
        expect(screen.getByText('match in code')).toBeInTheDocument();
        expect(screen.queryByText('homepage')).not.toBeInTheDocument();
    });

    it('matches file names case-insensitively', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.type(screen.getByRole('searchbox', { name: 'Search files' }), 'HOME');

        expect(screen.getByText('homepage')).toBeInTheDocument();
        expect(screen.queryByText('match in code')).not.toBeInTheDocument();
    });

    it('explains an empty result and clears on Escape', async () => {
        const user = userEvent.setup();
        renderHome();

        const box = screen.getByRole('searchbox', { name: 'Search files' });
        await user.type(box, 'zzzz');
        expect(screen.getByText(/No files, folders or code match "zzzz"/)).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(box).toHaveValue('');
        expect(heading()).toHaveTextContent('All files');
    });
});

describe('moving files', () => {
    const stored = () => JSON.parse(localStorage.getItem('data')).folders;

    it('moves a file to another folder from the Move dialog', async () => {
        const user = userEvent.setup();
        renderHome();

        await cardAction(user, 'index', /Move to folder/);
        const dialog = screen.getByRole('dialog', { name: 'Move File' });
        // The current folder is not offered as a destination.
        expect(within(dialog).queryByRole('option', { name: /DSA/ })).not.toBeInTheDocument();

        await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Destination folder' }), within(dialog).getByRole('option', { name: /Web-dev/ }));
        submitModel();

        expect(within(section('Web-dev')).getByText('index')).toBeInTheDocument();
        expect(within(section('DSA')).getByText(/No files yet/)).toBeInTheDocument();
        expect(stored()[1].files.map(f => f.title)).toEqual(['homepage', 'index']);
    });

    it('explains when there is nowhere to move a file', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(screen.getByRole('button', { name: 'Delete folder Web-dev' }));
        await user.click(await screen.findByRole('button', { name: 'Delete' }));
        await cardAction(user, 'index', /Move to folder/);

        expect(screen.getByRole('dialog', { name: 'Move File' })).toHaveTextContent(/only folder/);
    });

    // jsdom has no DataTransfer, so stand in a minimal one.
    const dataTransfer = () => {
        const data = {};
        return {
            setData: (type, value) => { data[type] = value; },
            getData: (type) => data[type] ?? '',
            get types() { return Object.keys(data); },
            effectAllowed: 'all',
            dropEffect: 'none'
        };
    };

    it('moves a file by dragging its card onto a sidebar folder', () => {
        renderHome();
        const dt = dataTransfer();
        const card = within(section('DSA')).getByRole('button', { name: 'Open index' });
        const target = within(sidebar()).getByRole('button', { name: /^Web-dev/ });

        fireEvent.dragStart(card, { dataTransfer: dt });
        fireEvent.dragEnter(target, { dataTransfer: dt });
        expect(target).toHaveClass('is-drop-target');
        fireEvent.dragOver(target, { dataTransfer: dt });
        fireEvent.drop(target, { dataTransfer: dt });

        expect(target).not.toHaveClass('is-drop-target');
        expect(within(section('Web-dev')).getByText('index')).toBeInTheDocument();
        expect(screen.getByText('Moved to Web-dev')).toBeInTheDocument();
    });

    it('ignores drags that did not start on a file', () => {
        renderHome();
        const dt = dataTransfer();
        dt.setData('text/plain', 'some text');
        const target = within(sidebar()).getByRole('button', { name: /^Web-dev/ });

        fireEvent.dragEnter(target, { dataTransfer: dt });
        fireEvent.drop(target, { dataTransfer: dt });

        expect(target).not.toHaveClass('is-drop-target');
        expect(within(section('Web-dev')).queryByText('index')).not.toBeInTheDocument();
    });
});

describe('card menu', () => {
    const trigger = () => screen.getByRole('button', { name: 'More actions for index' });

    it('opens from the keyboard, moves with arrows, and returns focus on Escape', async () => {
        const user = userEvent.setup();
        renderHome();

        trigger().focus();
        await user.keyboard('{ArrowDown}');

        const menu = screen.getByRole('menu', { name: 'More actions for index' });
        const items = within(menu).getAllByRole('menuitem');
        expect(items.map(i => i.textContent)).toEqual([
            expect.stringContaining('Move to folder'),
            expect.stringContaining('Rename'),
            expect.stringContaining('Delete')
        ]);
        expect(items[0]).toHaveFocus();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');

        await user.keyboard('{ArrowUp}');
        expect(items[2]).toHaveFocus();
        await user.keyboard('{Home}');
        expect(items[0]).toHaveFocus();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
    });

    it('closes when clicking elsewhere', async () => {
        const user = userEvent.setup();
        renderHome();

        await user.click(trigger());
        expect(screen.getByRole('menu')).toBeInTheDocument();

        await user.click(heading());
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('runs the action without opening the file underneath', async () => {
        const user = userEvent.setup();
        renderHome();

        await cardAction(user, 'index', 'Rename');

        expect(screen.getByRole('dialog', { name: 'Rename File' })).toBeInTheDocument();
        expect(heading()).toHaveTextContent('All files');
    });
});
