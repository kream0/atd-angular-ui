import { escapeMarkdown, hasMarkdown, MdBlock, MdInline, parseInline, parseMarkdown, plainText, textDirection } from './markdown';

const text = (value: string): MdInline => ({ kind: 'text', text: value });

describe('The markdown subset', () => {
	describe('inline marks', () => {
		it('reads bold, italic and both, with * or _', () => {
			expect(parseInline('un **mot** fort')).toEqual([text('un '), { kind: 'strong', children: [text('mot')] }, text(' fort')]);
			expect(parseInline('le chapitre *Intro*')).toEqual([text('le chapitre '), { kind: 'em', children: [text('Intro')] }]);
			expect(parseInline('_notes_ et __annexes__')).toEqual([
				{ kind: 'em', children: [text('notes')] },
				text(' et '),
				{ kind: 'strong', children: [text('annexes')] },
			]);
			expect(parseInline('***les deux***')).toEqual([{ kind: 'em', children: [{ kind: 'strong', children: [text('les deux')] }] }]);
		});

		it('reads italic around Arabic and inside French quotes', () => {
			expect(parseInline('كلمة *مهمة*')).toEqual([text('كلمة '), { kind: 'em', children: [text('مهمة')] }]);
			expect(parseInline('« *Bonjour* »')).toEqual([text('« '), { kind: 'em', children: [text('Bonjour')] }, text(' »')]);
		});

		it('leaves as typed the signs that open nothing: a lone star, a word_with_underscores, 2 * 3, a backslash', () => {
			expect(parseInline('5 * 3 = 15')).toEqual([text('5 * 3 = 15')]);
			expect(parseInline('nom_de_fichier')).toEqual([text('nom_de_fichier')]);
			expect(parseInline('*ouvert sans fin')).toEqual([text('*ouvert sans fin')]);
			expect(parseInline('\\*pas en italique\\*')).toEqual([text('*pas en italique*')]);
		});

		it('keeps HTML and scripts as the text they are', () => {
			expect(parseInline('<script>alert(1)</script> <b>x</b>')).toEqual([text('<script>alert(1)</script> <b>x</b>')]);
		});

		it('makes links of web, mail and phone addresses only', () => {
			expect(parseInline('[le site](https://example.org/a)')).toEqual([{ kind: 'link', href: 'https://example.org/a', children: [text('le site')] }]);
			expect(parseInline('[écrire](mailto:x@example.org)')).toEqual([{ kind: 'link', href: 'mailto:x@example.org', children: [text('écrire')] }]);
			expect(parseInline('[piège](javascript:alert(1))')).toEqual([text('[piège](javascript:alert(1))')]);
			expect(parseInline('[piège](data:text/html,x)')).toEqual([text('[piège](data:text/html,x)')]);
		});

		it('makes a link of a bare web address, without the punctuation that ends the sentence', () => {
			expect(parseInline('Voir https://example.org/page.')).toEqual([
				text('Voir '),
				{ kind: 'link', href: 'https://example.org/page', children: [text('https://example.org/page')] },
				text('.'),
			]);
			expect(parseInline('https://example.org/a_b_c')).toEqual([
				{ kind: 'link', href: 'https://example.org/a_b_c', children: [text('https://example.org/a_b_c')] },
			]);
		});

		it('draws marks 32 levels deep at most: deeper signs stay as typed, and no reading runs out of stack', () => {
			const nested = (pairs: number) => `${'*o _o '.repeat(pairs)}x${' c_ c*'.repeat(pairs)}`;
			const depth = (nodes: readonly MdInline[]) => {
				let deepest = 0;
				const left: [readonly MdInline[], number][] = [[nodes, 0]];
				while (left.length) {
					const [list, level] = left.pop()!;
					for (const node of list) {
						if (node.kind === 'text') continue;
						deepest = Math.max(deepest, level + 1);
						left.push([node.children, level + 1]);
					}
				}
				return deepest;
			};
			expect(depth(parseInline(nested(16)))).toBe(32);
			expect(plainText(nested(16), true)).toBe(`${'o '.repeat(32)}x${' c'.repeat(32)}`);
			expect(depth(parseInline(nested(17)))).toBe(32);
			expect(plainText(nested(17), true)).toBe(`${'o '.repeat(32)}*o _o x c_ c*${' c'.repeat(32)}`);
			const linked = nested(17).replace('x', '[lien](https://example.org)');
			expect(plainText(linked, true)).toBe(`${'o '.repeat(32)}*o _o lien (https://example.org) c_ c*${' c'.repeat(32)}`);
			expect(() => plainText(nested(1500), true)).not.toThrow();
			expect(() => plainText(nested(1500))).not.toThrow();
			const [paragraph] = parseMarkdown(nested(1500), { document: true }) as Extract<MdBlock, { kind: 'paragraph' }>[];
			expect(depth(paragraph.content)).toBe(32);
		});
	});

	describe('blocks', () => {
		it('reads paragraphs with their line breaks, quotes and lists', () => {
			const blocks: MdBlock[] = parseMarkdown('Ligne 1\nLigne 2\n\n> Il dit :\n> « Une parole »\n\n- un\n- deux\n\n3. trois\n4. quatre');
			expect(blocks).toEqual([
				{ kind: 'paragraph', content: [text('Ligne 1\nLigne 2')] },
				{ kind: 'quote', dir: 'ltr', blocks: [{ kind: 'paragraph', content: [text('Il dit :\n« Une parole »')] }] },
				{ kind: 'list', ordered: false, start: 1, items: [[text('un')], [text('deux')]] },
				{ kind: 'list', ordered: true, start: 3, items: [[text('trois')], [text('quatre')]] },
			]);
		});

		it('leaves a title sign, a table and a year that ends a line as typed', () => {
			expect(parseMarkdown('# Titre\n| a | b |\nEn\n2026. Une année')).toEqual([
				{ kind: 'paragraph', content: [text('# Titre\n| a | b |\nEn\n2026. Une année')] },
			]);
		});

		it('reads a list item that goes on, indented, on the next line', () => {
			expect(parseMarkdown('- un\n  suite\n- deux')).toEqual([{ kind: 'list', ordered: false, start: 1, items: [[text('un\nsuite')], [text('deux')]] }]);
		});

		it('gives a quote the direction of its first letter, ﴿ ﴾, digits and signs aside', () => {
			const dir = (markdown: string) => (parseMarkdown(markdown)[0] as Extract<MdBlock, { kind: 'quote' }>).dir;
			expect(dir('> ﴿مرحبا بكم﴾')).toBe('rtl');
			expect(dir('> « 12 Une parole »')).toBe('ltr');
			expect(dir('> > **12.** — قال')).toBe('rtl');
			expect(dir('> 12 — …')).toBeNull();
			expect(textDirection('')).toBeNull();
		});
	});

	describe('a document (a long pasted report)', () => {
		const doc = (markdown: string) => parseMarkdown(markdown, { document: true });

		it('reads headings # to ######, rules and ==highlight==, which any other text leaves as typed', () => {
			expect(doc('# Titre ##\n##### Point *cinq*\nTexte ==important== ici\nTitre\n---\n####### sept\n#Collé')).toEqual([
				{ kind: 'heading', level: 1, content: [text('Titre')] },
				{ kind: 'heading', level: 5, content: [text('Point '), { kind: 'em', children: [text('cinq')] }] },
				{ kind: 'paragraph', content: [text('Texte '), { kind: 'mark', children: [text('important')] }, text(' ici\nTitre')] },
				{ kind: 'rule' },
				{ kind: 'paragraph', content: [text('####### sept\n#Collé')] },
			]);
			expect(parseMarkdown('# Titre\n\n==important==\n\n---')).toEqual([
				{ kind: 'paragraph', content: [text('# Titre')] },
				{ kind: 'paragraph', content: [text('==important==')] },
				{ kind: 'paragraph', content: [text('---')] },
			]);
		});

		it('highlights only a closed ==mark== with no space inside its signs; a comparison or a backslash stays as typed', () => {
			expect(parseInline('==**très** important==', true, true)).toEqual([
				{ kind: 'mark', children: [{ kind: 'strong', children: [text('très')] }, text(' important')] },
			]);
			expect(parseInline('a == b et ===x=== et \\==pas\\== et ==ouvert', true, true)).toEqual([
				text('a == b et ===x=== et ==pas== et ==ouvert'),
			]);
			expect(parseInline('==titre==')).toEqual([text('==titre==')]);
		});

		it('reads a pipe table: its head, its alignments, a pipe kept with \\|, short rows filled and long ones cut', () => {
			const markdown = 'Avant\n| Point | Qui | Montant |\n| :--- | :-: | --: |\n| Locaux | **Bureau** | 120 € |\n| Sortie \\| été | Équipe |\n| a | b | c | d |\nAprès';
			expect(doc(markdown)).toEqual([
				{ kind: 'paragraph', content: [text('Avant')] },
				{
					kind: 'table',
					dir: 'ltr',
					align: ['left', 'center', 'right'],
					head: [[text('Point')], [text('Qui')], [text('Montant')]],
					rows: [
						[[text('Locaux')], [{ kind: 'strong', children: [text('Bureau')] }], [text('120 €')]],
						[[text('Sortie | été')], [text('Équipe')], []],
						[[text('a')], [text('b')], [text('c')]],
					],
				},
				{ kind: 'paragraph', content: [text('Après')] },
			]);
			expect(parseMarkdown('| a | b |\n| - | - |')).toEqual([{ kind: 'paragraph', content: [text('| a | b |\n| - | - |')] }]);
		});

		it('needs a row of dashes with as many cells as the head, and gives a table the direction of its head', () => {
			expect(doc('| a | b |\n| -- |')).toEqual([{ kind: 'paragraph', content: [text('| a | b |\n| -- |')] }]);
			expect(doc('a | b\n--- | ---').map((block) => block.kind)).toEqual(['table']);
			const table = doc('| البند | المبلغ |\n| --- | --- |\n| كراء | 120 |')[0] as Extract<MdBlock, { kind: 'table' }>;
			expect([table.dir, table.align]).toEqual(['rtl', [null, null]]);
			expect(hasMarkdown('| a | b |\n| - | - |', false, { document: true })).toBeTrue();
			expect(hasMarkdown('| a | b |\n| - | - |')).toBeFalse();
		});

		it('reads a table of up to 32 columns; a wider one stays as typed', () => {
			const table = (columns: number) => `${'| a '.repeat(columns)}|\n${'| - '.repeat(columns)}|`;
			expect(doc(table(32)).map((block) => block.kind)).toEqual(['table']);
			expect(doc(table(33))).toEqual([{ kind: 'paragraph', content: [text(table(33))] }]);
		});
	});

	describe('plain text', () => {
		it('takes the signs off, keeps the words and the line breaks', () => {
			expect(plainText('Le chapitre *Intro* et **la conclusion**', true)).toBe('Le chapitre Intro et la conclusion');
			expect(plainText('> Il dit :\n> « Une **parole** »\n\nUn commentaire')).toBe('Il dit :\n« Une parole »\n\nUn commentaire');
			expect(plainText('- un\n- *deux*')).toBe('- un\n- deux');
			expect(plainText(null)).toBe('');
		});

		it('keeps a link\'s address', () => {
			expect(plainText('[le site](https://example.org)', true)).toBe('le site (https://example.org)');
			expect(plainText('[x@example.org](mailto:x@example.org)', true)).toBe('x@example.org');
		});

		it('reads only the inline marks of a title: a dash or a quote sign at its start stays', () => {
			expect(plainText('- *Thème*', true)).toBe('- Thème');
			expect(plainText('> *Thème*', true)).toBe('> Thème');
		});
	});

	it('escapes a plain name put where a title is read as markdown', () => {
		for (const name of ['Groupe *Nord*', 'dossier_1', '[Projet] été', 'a\\b']) {
			expect(plainText(escapeMarkdown(name), true)).toBe(name);
			expect(parseInline(escapeMarkdown(name))).toEqual([text(name)]);
		}
	});

	it('tells whether a text has anything to draw', () => {
		expect(hasMarkdown('un texte simple')).toBeFalse();
		expect(hasMarkdown('un *mot*')).toBeTrue();
		expect(hasMarkdown('> une citation')).toBeTrue();
		expect(hasMarkdown('> une citation', true)).toBeFalse();
		expect(hasMarkdown('- un', true)).toBeFalse();
		expect(hasMarkdown(undefined)).toBeFalse();
	});
});
