import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

it('can load yjs under jest', () => {
    const doc = new Y.Doc();
    doc.getText('code').insert(0, 'hi');
    expect(doc.getText('code').toString()).toBe('hi');
});

it('can load y-protocols awareness under jest', () => {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    awareness.setLocalStateField('user', { name: 'x' });
    expect(awareness.getLocalState().user.name).toBe('x');
});

it('two docs converge on concurrent same-offset inserts', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.on('update', u => Y.applyUpdate(b, u));
    b.on('update', u => Y.applyUpdate(a, u));
    a.getText('t').insert(0, 'aaa');
    b.getText('t').insert(0, 'bbb');
    expect(a.getText('t').toString()).toBe(b.getText('t').toString());
    expect(a.getText('t').length).toBe(6);
});
