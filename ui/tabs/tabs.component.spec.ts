import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTabsComponent } from './tabs.component';

@Component({
	standalone: true,
	imports: [UiTabsComponent],
	template: `
		<div [attr.dir]="dir()">
			<app-ui-tabs label="Vue du projet" [tabs]="tabs" [(selected)]="selected">Panneau {{ selected() }}</app-ui-tabs>
		</div>
	`,
})
class HostComponent {
	public readonly dir = signal<'ltr' | 'rtl'>('ltr');
	public readonly selected = signal('taches');
	public readonly tabs = [
		{ id: 'taches', label: 'Tâches' },
		{ id: 'notes', label: 'Notes' },
		{ id: 'fichiers', label: 'Fichiers' },
	];
}

/**
 * Pins the fixture to the top of the Karma page. A fixture there never makes that page longer, and a tab that takes the
 * focus never scrolls it: these specs leave the page as they found it for the specs after them, which measure it.
 */
function pinToTop(host: HTMLElement): void {
	host.style.cssText = 'position: fixed; top: 0; left: 0; right: 0';
}

describe('UiTabsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let tabs: HTMLButtonElement[];
	let tablist: HTMLElement;

	function press(key: string): void {
		(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		fixture.detectChanges();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		pinToTop(fixture.nativeElement);
		fixture.detectChanges();
		tablist = fixture.nativeElement.querySelector('[role=tablist]');
		tabs = Array.from(tablist.querySelectorAll('[role=tab]'));
		tabs[0].focus();
	});

	it('has a named tablist, tabs and one tabpanel named by the selected tab', () => {
		const panel: HTMLElement = fixture.nativeElement.querySelector('[role=tabpanel]');
		expect(tablist.getAttribute('aria-label')).toBe('Vue du projet');
		expect(tabs.length).toBe(3);
		expect(tabs[0].getAttribute('aria-selected')).toBe('true');
		expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id);
		expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
		expect(panel.textContent).toContain('Panneau taches');
	});

	it('uses a roving tabindex and 44 px tall tabs', () => {
		expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
		expect(tabs[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
	});

	it('arrow keys, Home and End move focus and select (automatic activation)', () => {
		press('ArrowRight');
		expect(document.activeElement).toBe(tabs[1]);
		expect(fixture.componentInstance.selected()).toBe('notes');
		expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
		press('End');
		expect(document.activeElement).toBe(tabs[2]);
		press('ArrowRight');
		expect(document.activeElement).toBe(tabs[0]);
		press('ArrowLeft');
		expect(document.activeElement).toBe(tabs[2]);
		press('Home');
		expect(fixture.componentInstance.selected()).toBe('taches');
	});

	it('swaps the arrow keys in RTL', () => {
		fixture.componentInstance.dir.set('rtl');
		fixture.detectChanges();
		press('ArrowLeft');
		expect(fixture.componentInstance.selected()).toBe('notes');
	});

	it('gets no fade when every tab fits', () => {
		expect(tablist.classList).not.toContain('ui-more-start');
		expect(tablist.classList).not.toContain('ui-more-end');
		expect(getComputedStyle(tablist).getPropertyValue('mask-image')).toBe('none');
	});

	it('a click selects', () => {
		tabs[2].click();
		fixture.detectChanges();
		expect(tabs[2].getAttribute('aria-selected')).toBe('true');
		expect(fixture.nativeElement.querySelector('[role=tabpanel]').textContent).toContain('Panneau fichiers');
	});
});

@Component({
	standalone: true,
	imports: [UiTabsComponent],
	template: `
		<div [attr.dir]="dir()" style="width: 240px">
			<app-ui-tabs label="Vue du projet" [tabs]="tabs" [(selected)]="selected">Panneau {{ selected() }}</app-ui-tabs>
		</div>
	`,
})
class NarrowHostComponent {
	public readonly dir = signal<'ltr' | 'rtl'>('ltr');
	public readonly selected = signal('t0');
	public readonly tabs = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, label: `Onglet numéro ${i}` }));
}

describe('UiTabsComponent scroll cue', () => {
	const CUE = 32;
	let fixture: ComponentFixture<NarrowHostComponent>;
	let row: HTMLElement;
	let tabs: HTMLButtonElement[];

	function render(dir: 'ltr' | 'rtl', selected = 't0'): void {
		TestBed.configureTestingModule({ imports: [NarrowHostComponent] });
		fixture = TestBed.createComponent(NarrowHostComponent);
		pinToTop(fixture.nativeElement);
		fixture.componentInstance.dir.set(dir);
		fixture.componentInstance.selected.set(selected);
		fixture.detectChanges();
		row = fixture.nativeElement.querySelector('[role=tablist]');
		tabs = Array.from(row.querySelectorAll('[role=tab]'));
	}

	function scrollTo(left: number): void {
		row.scrollLeft = left;
		row.dispatchEvent(new Event('scroll'));
	}

	const cue = () => ({ start: row.classList.contains('ui-more-start'), end: row.classList.contains('ui-more-end') });
	const mask = (el: HTMLElement) => getComputedStyle(el).getPropertyValue('mask-image');

	/** The tab lies inside the row and clear of both fades (a fade is gone at the end the row is scrolled to). */
	function clearOfFade(tab: HTMLElement): boolean {
		const box = row.getBoundingClientRect();
		const rect = tab.getBoundingClientRect();
		const startPad = cue().start ? CUE : 0;
		const endPad = cue().end ? CUE : 0;
		const [leftPad, rightPad] = getComputedStyle(row).direction === 'rtl' ? [endPad, startPad] : [startPad, endPad];
		return rect.left >= box.left + leftPad - 1 && rect.right <= box.right - rightPad + 1;
	}

	/** Reduced motion asked: the row jumps, so the scroll position is there at once. */
	function prefersReducedMotion(): void {
		const real = window.matchMedia.bind(window);
		spyOn(window, 'matchMedia').and.callFake((query: string) =>
			query.includes('prefers-reduced-motion') ? ({ matches: true, media: query } as MediaQueryList) : real(query),
		);
	}

	it('fades only the edge with more tabs, and the fade follows the scroll position', () => {
		render('ltr');
		expect(row.scrollWidth).toBeGreaterThan(row.clientWidth + 2 * CUE);
		expect(cue()).toEqual({ start: false, end: true });
		expect(mask(row)).toContain('linear-gradient(to right');

		scrollTo(80);
		expect(cue()).toEqual({ start: true, end: true });
		expect(row.style.getPropertyValue('--ui-cue-start')).toBe(`${CUE}px`);
		scrollTo(10);
		expect(row.style.getPropertyValue('--ui-cue-start')).toBe('10px');

		scrollTo(row.scrollWidth);
		expect(cue()).toEqual({ start: true, end: false });
		expect(row.style.getPropertyValue('--ui-cue-end')).toBe('0px');
	});

	it('leaves the line under the row out of the fade', () => {
		render('ltr');
		const line = row.parentElement as HTMLElement;
		expect(getComputedStyle(line).borderBottomWidth).toBe('1px');
		expect(mask(line)).toBe('none');
	});

	it('scrolls the selected tab into view on load, clear of the fade, without moving the page', () => {
		// « Without moving the page » is checked on the scroll calls, not on window.scrollY: the page is wherever the specs
		// before left it, and the pinned fixture could not move it anyway.
		const pageScrolls = [
			spyOn(window, 'scroll'),
			spyOn(window, 'scrollTo'),
			spyOn(window, 'scrollBy'),
			spyOn(Element.prototype, 'scrollIntoView'),
		];
		render('ltr', 't6');
		expect(row.scrollLeft).toBeGreaterThan(0);
		expect(clearOfFade(tabs[6])).toBeTrue();
		expect(cue()).toEqual({ start: true, end: true });
		pageScrolls.forEach((scroll) => expect(scroll).not.toHaveBeenCalled());
	});

	it('glides to a newly selected tab', () => {
		render('ltr');
		const scrollBy = spyOn(row, 'scrollBy').and.callThrough();
		tabs[4].click();
		fixture.detectChanges();
		const options = scrollBy.calls.mostRecent().args[0] as unknown as ScrollToOptions;
		expect(options.behavior).toBe('smooth');
		expect(options.left).toBeGreaterThan(0);
	});

	it('jumps instead when the user asks for reduced motion', () => {
		prefersReducedMotion();
		render('ltr');
		const scrollBy = spyOn(row, 'scrollBy').and.callThrough();
		fixture.componentInstance.selected.set('t5');
		fixture.detectChanges();
		expect((scrollBy.calls.mostRecent().args[0] as unknown as ScrollToOptions).behavior).toBe('instant');
		expect(clearOfFade(tabs[5])).toBeTrue();
	});

	it('keeps the focused tab in view: End reaches the last tab, then the end fade is gone', () => {
		prefersReducedMotion();
		render('ltr');
		tabs[0].focus();
		(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		fixture.detectChanges();
		expect(document.activeElement).toBe(tabs[7]);
		expect(clearOfFade(tabs[7])).toBeTrue();
		expect(cue()).toEqual({ start: true, end: false });
	});

	it('brings a tab into view when it takes the focus', () => {
		prefersReducedMotion();
		render('ltr');
		tabs[3].focus();
		expect(clearOfFade(tabs[3])).toBeTrue();
	});

	it('in RTL, puts the start fade on the right and follows the scroll position the other way', () => {
		render('rtl');
		expect(cue()).toEqual({ start: false, end: true });
		expect(mask(row)).toContain('linear-gradient(to left');
		expect(clearOfFade(tabs[0])).toBeTrue();
		expect(tabs[0].getBoundingClientRect().right).toBeGreaterThan(tabs[1].getBoundingClientRect().right);

		scrollTo(-80);
		expect(cue()).toEqual({ start: true, end: true });
		scrollTo(-row.scrollWidth);
		expect(cue()).toEqual({ start: true, end: false });
	});

	it('in RTL, scrolls the selected tab into view on load', () => {
		render('rtl', 't6');
		expect(row.scrollLeft).toBeLessThan(0);
		expect(clearOfFade(tabs[6])).toBeTrue();
	});
});
