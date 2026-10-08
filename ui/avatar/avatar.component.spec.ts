import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiAvatarComponent } from './avatar.component';

// A 1x1 GIF: no network request in the test.
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

@Component({
	standalone: true,
	imports: [UiAvatarComponent],
	template: `<app-ui-avatar name="Compte Alpha Exemple" [src]="src()" [decorative]="decorative()" [size]="48" />`,
})
class HostComponent {
	public readonly src = signal<string | null>(null);
	public readonly decorative = signal(false);
}

describe('UiAvatarComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let avatar: HTMLElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		avatar = fixture.nativeElement.querySelector('app-ui-avatar');
	});

	it('without a photo shows hidden initials and gives the name in text', () => {
		const [initials, name] = Array.from(avatar.querySelectorAll('span'));
		expect(initials.textContent).toBe('CE');
		expect(initials.getAttribute('aria-hidden')).toBe('true');
		expect(name.textContent).toBe('Compte Alpha Exemple');
		expect(avatar.getBoundingClientRect().width).toBe(48);
	});

	it('when decorative (name shown next to it) says nothing', () => {
		fixture.componentInstance.decorative.set(true);
		fixture.detectChanges();
		expect(avatar.querySelector('.sr-only')).toBeNull();
	});

	it('a photo has the name as alt, or an empty alt when decorative, and a fixed size', () => {
		fixture.componentInstance.src.set(PIXEL);
		fixture.detectChanges();
		const img: HTMLImageElement = avatar.querySelector('img')!;
		expect(img.alt).toBe('Compte Alpha Exemple');
		expect(img.getAttribute('width')).toBe('48');
		fixture.componentInstance.decorative.set(true);
		fixture.detectChanges();
		expect(img.getAttribute('alt')).toBe('');
	});

	it('falls back to the initials when the photo fails', () => {
		fixture.componentInstance.src.set(PIXEL);
		fixture.detectChanges();
		avatar.querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();
		expect(avatar.querySelector('img')).toBeNull();
		expect(avatar.textContent).toContain('CE');
	});
});
