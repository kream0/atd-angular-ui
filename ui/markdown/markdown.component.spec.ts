import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiMarkdownComponent } from './markdown.component';

@Component({
	standalone: true,
	imports: [UiMarkdownComponent],
	template: `
		<div id="block"><app-ui-markdown [text]="text()" /></div>
		<h2 id="inline"><app-ui-markdown [text]="text()" inline /></h2>
		<div id="document" style="width: 320px"><app-ui-markdown [text]="text()" document /></div>
	`,
})
class HostComponent {
	public readonly text = signal<string | null>('');
}

describe('UiMarkdownComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	const show = (text: string | null) => {
		fixture.componentInstance.text.set(text);
		fixture.detectChanges();
	};
	const block = () => fixture.nativeElement.querySelector('#block') as HTMLElement;
	const inline = () => fixture.nativeElement.querySelector('#inline') as HTMLElement;
	const documentView = () => fixture.nativeElement.querySelector('#document') as HTMLElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
	});

	it('draws marks 32 levels deep without running out of stack; deeper signs stay as typed', () => {
		show(`${'*o _o '.repeat(1500)}x${' c_ c*'.repeat(1500)}`);
		for (const view of [block(), inline(), documentView()]) {
			expect(view.querySelectorAll('em').length).toBe(32);
			expect(view.textContent).toContain('o *o _o *o _o');
		}
	});

	it('draws the marks, quotes and lists, each block in its own direction', () => {
		show('Un **mot** et un *autre*\n\n> مرحبا بكم في الموقع\n\n- un\n- deux\n\n3. trois');
		expect(block().querySelector('p strong')!.textContent).toBe('mot');
		expect(block().querySelector('p em')!.textContent).toBe('autre');
		expect(block().querySelector('blockquote p')!.textContent).toBe('مرحبا بكم في الموقع');
		expect(Array.from(block().querySelectorAll('ul li')).map((li) => li.textContent)).toEqual(['un', 'deux']);
		expect(block().querySelector('ol')!.getAttribute('start')).toBe('3');
		for (const element of Array.from(block().querySelectorAll('p, ul, ol'))) {
			expect(element.getAttribute('dir')).toBe('auto');
		}
		expect(block().querySelector('blockquote')!.getAttribute('dir')).toBe('rtl');
		expect(block().textContent).not.toMatch(/[*>]/);
	});

	it('puts a quote on the side its text starts from, though its paragraphs have their own direction', () => {
		show('> ﴿مرحبا بكم﴾\n\nUn texte\n\n> « Une parole »\n\n> 12');
		const quotes = Array.from(block().querySelectorAll('blockquote'));
		expect(quotes.map((quote) => quote.getAttribute('dir'))).toEqual(['rtl', 'ltr', 'auto']);
		expect(quotes.map((quote) => getComputedStyle(quote).direction)).toEqual(['rtl', 'ltr', 'ltr']);
	});

	it('keeps a paragraph\'s line breaks', () => {
		show('Ligne 1\nLigne 2');
		const paragraph = block().querySelector('p')!;
		expect(paragraph.textContent).toBe('Ligne 1\nLigne 2');
		expect(paragraph.classList).toContain('whitespace-pre-line');
	});

	it('shows HTML and scripts as text, never as elements', () => {
		show('<img src=x onerror="alert(1)"> <script>alert(2)</script> [lien](javascript:alert(3))');
		expect(block().querySelector('img, script, a')).toBeNull();
		expect(block().textContent).toContain('<script>alert(2)</script>');
		expect(inline().querySelector('img, script, a')).toBeNull();
	});

	it('opens a safe link in a new tab, without giving it the page', () => {
		show('Voir [le site](https://example.org)');
		const link = inline().querySelector('a')!;
		expect(link.getAttribute('href')).toBe('https://example.org');
		expect(link.target).toBe('_blank');
		expect(link.rel).toBe('noopener noreferrer');
	});

	it('inline, draws only the marks, inside the caller\'s element', () => {
		show('> *Thème*');
		expect(inline().querySelector('p, blockquote')).toBeNull();
		expect(inline().querySelector('em')!.textContent).toBe('Thème');
		expect(inline().textContent).toBe('> Thème');
	});

	it('inline, sets the text apart in its own direction, the caller\'s element keeping its own', () => {
		inline().dir = 'rtl';
		show('Projet (suite).');
		const host = inline().querySelector('app-ui-markdown')!;
		expect(host.getAttribute('dir')).toBe('auto');
		expect(getComputedStyle(host).direction).toBe('ltr');
		expect(getComputedStyle(inline()).direction).toBe('rtl');
		show('﴿مرحبا بكم﴾');
		expect(getComputedStyle(host).direction).toBe('rtl');
		expect(block().querySelector('app-ui-markdown')!.hasAttribute('dir')).toBeFalse();
	});

	it('draws a document\'s headings under the page\'s own, its rules, highlights and tables; any other text keeps the signs', () => {
		show('# Rapport\n###### Détail\n\nUn point ==à retenir==\n\n---\n\n| Point | Qui | Montant |\n| :-- | :-: | --: |\n| Locaux | Bureau | 120 € |');
		const headings = Array.from(documentView().querySelectorAll('[role="heading"]'));
		expect(headings.map((heading) => [heading.textContent!.trim(), heading.getAttribute('aria-level'), heading.getAttribute('dir')])).toEqual([
			['Rapport', '3', 'auto'],
			['Détail', '6', 'auto'],
		]);
		expect(documentView().querySelector('p mark')!.textContent).toBe('à retenir');
		expect(documentView().querySelector('hr')).not.toBeNull();
		const frame = documentView().querySelector('[data-markdown-table]')!;
		expect([frame.getAttribute('role'), frame.getAttribute('tabindex'), frame.getAttribute('aria-label')]).toEqual(['region', '0', 'Tableau']);
		expect(Array.from(frame.querySelectorAll('th')).map((th) => [th.getAttribute('scope'), th.textContent!.trim()])).toEqual([
			['col', 'Point'],
			['col', 'Qui'],
			['col', 'Montant'],
		]);
		const cells = Array.from(frame.querySelectorAll('tbody td'));
		expect(cells.map((td) => td.textContent!.trim())).toEqual(['Locaux', 'Bureau', '120 €']);
		expect(cells.map((td) => getComputedStyle(td).textAlign)).toEqual(['left', 'center', 'right']);
		expect(block().querySelector('table, hr, mark, [role="heading"]')).toBeNull();
		expect(block().textContent).toContain('# Rapport');
	});

	it('scrolls a wide table inside its own frame, never the page around it', () => {
		const cell = 'Montant prévu pour la sortie de fin d\'année';
		show(`| ${Array(6).fill('Colonne').join(' | ')} |\n|${' --- |'.repeat(6)}\n| ${Array(6).fill(cell).join(' | ')} |`);
		const frame = documentView().querySelector('[data-markdown-table]') as HTMLElement;
		expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
		expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(320);
		expect(documentView().scrollWidth).toBeLessThanOrEqual(320);
		// A long cell wraps at its column's width rather than making one endless line.
		expect(frame.querySelector('td')!.getBoundingClientRect().height).toBeGreaterThan(frame.querySelector('th')!.getBoundingClientRect().height);
	});

	describe('on a wide screen (a report at 1280)', () => {
		const table = (columns: number, cell: string) =>
			`| ${Array(columns).fill(cell).join(' | ')} |\n|${' --- |'.repeat(columns)}\n| ${Array(columns).fill(cell).join(' | ')} |`;
		const frame = () => documentView().querySelector('[data-markdown-table]') as HTMLElement;
		const cue = () => ({ start: frame().classList.contains('ui-more-start'), end: frame().classList.contains('ui-more-end') });

		beforeEach(() => {
			// Karma's ChromeHeadless window is 800px wide: sm and up, as a desktop.
			expect(matchMedia('(min-width: 640px)').matches).toBeTrue();
			documentView().style.width = '720px';
		});

		it('fits a 5-column table to its frame, each column at least 6rem, with no fade', () => {
			show(table(5, 'Montant prévu pour la sortie de fin d\'année'));
			expect(frame().scrollWidth).toBeLessThanOrEqual(frame().clientWidth + 1);
			expect(Math.min(...Array.from(frame().querySelectorAll('th div')).map((div) => div.getBoundingClientRect().width))).toBeGreaterThanOrEqual(96);
			expect(cue()).toEqual({ start: false, end: false });
			expect(getComputedStyle(frame()).getPropertyValue('mask-image')).toBe('none');
		});

		it('fades the edge with more to scroll when a table is still wider, the frame\'s ring staying whole', () => {
			show(table(12, 'Colonne'));
			expect(frame().scrollWidth).toBeGreaterThan(frame().clientWidth);
			expect(cue()).toEqual({ start: false, end: true });
			expect(getComputedStyle(frame()).getPropertyValue('mask-image')).toContain('linear-gradient(to right');
			expect(getComputedStyle(frame().parentElement!).getPropertyValue('mask-image')).toBe('none');
			expect(getComputedStyle(frame().parentElement!).boxShadow).not.toBe('none');

			frame().scrollLeft = frame().scrollWidth;
			frame().dispatchEvent(new Event('scroll'));
			expect(cue()).toEqual({ start: true, end: false });
		});

		it('scrolls an Arabic table from its right side, the fade on its left', () => {
			show(table(12, 'عمود'));
			expect(frame().matches(':dir(rtl)')).toBeTrue();
			const box = frame().getBoundingClientRect();
			expect(frame().querySelector('th')!.getBoundingClientRect().right).toBeCloseTo(box.right, -1);
			expect(cue()).toEqual({ start: false, end: true });
			expect(getComputedStyle(frame()).getPropertyValue('mask-image')).toContain('linear-gradient(to left');
		});
	});

	it('draws nothing for no text', () => {
		show(null);
		expect(block().textContent).toBe('');
		expect(inline().textContent).toBe('');
	});
});
