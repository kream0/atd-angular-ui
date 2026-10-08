import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiShowcaseComponent } from './showcase.component';

/** Accessible name, enough for these checks: aria-label, aria-labelledby, a label, or the text. */
function nameOf(element: HTMLElement): string {
	const labelledBy = element.getAttribute('aria-labelledby');
	if (labelledBy) return labelledBy.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
	const label = element.getAttribute('aria-label') ?? (element as HTMLInputElement).labels?.[0]?.textContent ?? '';
	return (label || element.textContent || '').trim();
}

describe('UiShowcaseComponent', () => {
	let fixture: ComponentFixture<UiShowcaseComponent>;
	let root: HTMLElement;

	function checkPage(): void {
		const controls = Array.from(root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea'));
		const unnamed = controls.filter((control) => control.getClientRects().length > 0 && !nameOf(control));
		expect(unnamed.map((control) => control.outerHTML.slice(0, 80))).toEqual([]);

		const ids = Array.from(root.querySelectorAll('[id]')).map((element) => element.id);
		expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);

		const small = Array.from(root.querySelectorAll<HTMLElement>('[appUiButton], [appUiIconButton], [role=tab]'))
			.filter((target) => target.getClientRects().length > 0)
			.filter((target) => target.getBoundingClientRect().height < 44);
		expect(small.map((target) => target.outerHTML.slice(0, 80))).toEqual([]);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [UiShowcaseComponent], providers: [provideRouter([])] });
		fixture = TestBed.createComponent(UiShowcaseComponent);
		fixture.detectChanges();
		root = fixture.nativeElement;
	});

	afterEach(() => document.documentElement.classList.remove('dark'));

	it('has one h1 and named, unique, 44 px controls on every section', () => {
		expect(root.querySelectorAll('h1').length).toBe(1);
		const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role=tablist]')[0].querySelectorAll<HTMLElement>('[role=tab]'));
		expect(tabs.length).toBeGreaterThan(1);
		for (const tab of tabs) {
			tab.click();
			fixture.detectChanges();
			expect(tab.getAttribute('aria-selected')).toBe('true');
			checkPage();
		}
	});
});
