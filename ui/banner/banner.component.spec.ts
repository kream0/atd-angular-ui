import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiBannerComponent } from './banner.component';

@Component({
	standalone: true,
	imports: [UiBannerComponent],
	template: `
		<app-ui-banner tone="warning" title="Attention" [announce]="announce()" dismissible (dismissed)="dismissed = true">
			Deux tâches n'ont pas de date.
		</app-ui-banner>
	`,
})
class HostComponent {
	public readonly announce = signal(false);
	public dismissed = false;
}

describe('UiBannerComponent', () => {
	it('has no role when static, role="alert" when it follows an action', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const banner: HTMLElement = fixture.nativeElement.querySelector('app-ui-banner');
		expect(banner.hasAttribute('role')).toBeFalse();
		fixture.componentInstance.announce.set(true);
		fixture.detectChanges();
		expect(banner.getAttribute('role')).toBe('alert');
	});

	it('says it in text, icon hidden, soft tone fill, 44 px "Fermer"', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const banner: HTMLElement = fixture.nativeElement.querySelector('app-ui-banner');
		expect(banner.textContent).toContain('Attention');
		expect(banner.textContent).toContain("Deux tâches n'ont pas de date.");
		expect(banner.querySelector('app-ui-icon')?.getAttribute('aria-hidden')).toBe('true');
		expect(banner.classList).toContain('bg-ui-warning-ink/10');
		const close = banner.querySelector('button[aria-label="Fermer"]') as HTMLButtonElement;
		expect(close.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
		close.click();
		expect(fixture.componentInstance.dismissed).toBeTrue();
	});
});
