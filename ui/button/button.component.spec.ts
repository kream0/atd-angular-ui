import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './button.component';

@Component({
	standalone: true,
	imports: [UiButtonComponent],
	template: `
		<button appUiButton type="submit" class="extra" [loading]="loading()" [disabled]="disabled()" (click)="clicks = clicks + 1">
			Enregistrer
		</button>
		<button appUiButton type="button" size="sm" variant="secondary">Petit</button>
		<a appUiButton href="#suite" [disabled]="disabled()">Suite</a>
	`,
})
class HostComponent {
	public readonly loading = signal(false);
	public readonly disabled = signal(false);
	public clicks = 0;
}

describe('UiButtonComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let buttons: HTMLButtonElement[];
	let link: HTMLAnchorElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
		link = fixture.nativeElement.querySelector('a');
	});

	it('stays a native button: type, name from its text, click', () => {
		expect(buttons[0].type).toBe('submit');
		expect(buttons[0].textContent?.trim()).toBe('Enregistrer');
		buttons[0].click();
		expect(fixture.componentInstance.clicks).toBe(1);
	});

	it('keeps the classes the template gives it and shows the focus ring utility', () => {
		expect(buttons[0].classList).toContain('extra');
		expect(buttons[0].classList).toContain('ui-focus');
	});

	it('is at least 44 px tall in both sizes', () => {
		for (const element of [...buttons, link]) {
			expect(element.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
	});

	it('loading: disabled, aria-busy, spinner hidden and a text label', () => {
		fixture.componentInstance.loading.set(true);
		fixture.detectChanges();
		expect(buttons[0].disabled).toBeTrue();
		expect(buttons[0].getAttribute('aria-busy')).toBe('true');
		expect(buttons[0].querySelector('app-ui-spinner')?.getAttribute('aria-hidden')).toBe('true');
		expect(buttons[0].textContent).toContain('Chargement…');
		expect(buttons[0].textContent).toContain('Enregistrer');
	});

	it('a disabled link leaves the tab order and says it is disabled', () => {
		fixture.componentInstance.disabled.set(true);
		fixture.detectChanges();
		expect(buttons[0].disabled).toBeTrue();
		expect(link.getAttribute('aria-disabled')).toBe('true');
		expect(link.getAttribute('tabindex')).toBe('-1');
		expect(link.hasAttribute('disabled')).toBeFalse();
	});

	// Sentence case in the system sans: no mono, no case change, no letter-spacing, which
	// would also break the Arabic joins. The host's lang wins over whatever another spec left on <html>.
	it('labels use the system sans in sentence case, in French and in Arabic', () => {
		const host = fixture.nativeElement as HTMLElement;
		const style = () => getComputedStyle(buttons[0]);

		for (const lang of ['fr', 'ar']) {
			host.setAttribute('lang', lang);
			expect(style().fontFamily).withContext(lang).not.toMatch(/JetBrains|monospace/);
			expect(style().textTransform).withContext(lang).toBe('none');
			expect(parseFloat(style().letterSpacing) || 0).withContext(lang).toBe(0);
		}
	});
});
