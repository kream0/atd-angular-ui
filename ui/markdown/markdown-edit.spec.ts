import { applyMark } from './markdown-edit';

describe('A markdown toolbar button (applyMark)', () => {
	it('wraps the selection, spaces left outside, and keeps the same words selected', () => {
		expect(applyMark('le dossier Projet ', 11, 18, 'italic')).toEqual({ value: 'le dossier *Projet* ', start: 12, end: 18 });
		expect(applyMark('un mot fort', 3, 6, 'bold')).toEqual({ value: 'un **mot** fort', start: 5, end: 8 });
	});

	it('takes the signs off when they are already there, around or inside the selection', () => {
		expect(applyMark('un **mot** fort', 5, 8, 'bold')).toEqual({ value: 'un mot fort', start: 3, end: 6 });
		expect(applyMark('un **mot** fort', 3, 10, 'bold')).toEqual({ value: 'un mot fort', start: 3, end: 6 });
		expect(applyMark('un *mot* fort', 4, 7, 'italic').value).toBe('un mot fort');
	});

	it('does not read the edge of a bold as an italic', () => {
		expect(applyMark('un **mot** fort', 5, 8, 'italic').value).toBe('un ***mot*** fort');
		expect(applyMark('un ***mot*** fort', 6, 9, 'italic').value).toBe('un **mot** fort');
	});

	it('puts French quotes with no-break spaces, Arabic quotes tight', () => {
		expect(applyMark('il dit bonjour', 7, 14, 'quotes').value).toBe('il dit « bonjour »');
		expect(applyMark('قال سلام', 4, 8, 'quotes', { tight: true }).value).toBe('قال «سلام»');
	});

	it('inserts empty signs with the caret between them when nothing is selected', () => {
		expect(applyMark('ab', 1, 1, 'bold')).toEqual({ value: 'a****b', start: 3, end: 3 });
	});

	it('marks every line the selection touches as a quote or a list, empty lines left, and unmarks them', () => {
		expect(applyMark('un\n\ndeux\ntrois', 0, 8, 'quote')).toEqual({ value: '> un\n\n> deux\ntrois', start: 0, end: 12 });
		expect(applyMark('> un\n\n> deux', 0, 12, 'quote').value).toBe('un\n\ndeux');
		expect(applyMark('avant\nun\ndeux', 7, 7, 'list').value).toBe('avant\n- un\ndeux');
		expect(applyMark('- un\n- deux', 0, 11, 'list').value).toBe('un\ndeux');
	});
});
