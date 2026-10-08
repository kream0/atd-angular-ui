import { hasMarkdown, parseMarkdown, plainText } from './markdown';

/** How long `read` takes, in ms. */
function took(read: () => unknown): number {
	const start = performance.now();
	read();
	return performance.now() - start;
}

describe('The markdown subset on a very long text', () => {
	// A text holds up to 100 000 signs (a pasted report): whatever they are, a page reads it in about linear time.
	const SIZE = 100_000;
	const long = (unit: string) => unit.repeat(Math.ceil(SIZE / unit.length)).slice(0, SIZE);
	const texts: Record<string, string> = {
		'a run of [': long('['),
		'a run of *a': long('*a'),
		'a run of _a': long('_a'),
		'a run of [x': long('[x'),
		'a run of **a': long('**a'),
		'nested > lines': long('> > > > > x\n'),
		'a mix of marks and an open [': long('[x *a* **b** _c_ '),
		'a run of [ then ](x…': long('[').slice(0, SIZE / 2) + '](' + 'x'.repeat(SIZE / 2),
		'a run of (https:///': long('(https:///'),
		'a list line of spaces ending in a line separator': `-${' '.repeat(SIZE)}\u2028`,
		'a numbered line of spaces ending in a line separator': `1.${' '.repeat(SIZE)}\u2028`,
		'marks nested over 16 000 levels deep': `${'*o _o '.repeat(SIZE / 12)}${' c_ c*'.repeat(SIZE / 12)}`.slice(0, SIZE),
	};

	for (const [name, text] of Object.entries(texts)) {
		it(`reads ${name} in under 1.5 s, as blocks and as a title`, () => {
			expect(took(() => parseMarkdown(text)))
				.withContext('blocks')
				.toBeLessThan(1500);
			expect(took(() => plainText(text, true)))
				.withContext('title')
				.toBeLessThan(1500);
		});
	}

	// A pasted report is read as a document: its headings, tables, ==highlight== and rules too.
	const documents: Record<string, string> = {
		'a table head 1000 columns wide': long(`${'|a'.repeat(1000)}\n${'|-'.repeat(1000)}\n${'|x'.repeat(1000)}\n`),
		'a 32-column table over rows of |': `${'|a'.repeat(32)}\n${'|-'.repeat(32)}\n${long('|\n')}`.slice(0, SIZE),
		'headings with long runs of spaces': long(`# a${' '.repeat(10_000)}b\n`),
		'headings of spaces ending in a line separator': long(`#${' '.repeat(200)}\u2028\n`),
		'many # lines': long('# a ## \n'),
		'a run of ==a': long('==a '),
		'a run of ==': long('=='),
		'rules and near rules': long('---\n- - x\n'),
	};

	for (const [name, text] of Object.entries(documents)) {
		it(`reads ${name} in under 1.5 s, as a document and for its preview`, () => {
			expect(took(() => parseMarkdown(text, { document: true })))
				.withContext('document')
				.toBeLessThan(1500);
			expect(took(() => hasMarkdown(text, false, { document: true })))
				.withContext('preview')
				.toBeLessThan(1500);
		});
	}
});
