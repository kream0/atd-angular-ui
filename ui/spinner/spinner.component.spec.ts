import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSpinnerComponent } from './spinner.component';

@Component({
	standalone: true,
	imports: [UiSpinnerComponent],
	template: `<app-ui-spinner [decorative]="decorative()" label="Envoi en cours" />`,
})
class HostComponent {
	public readonly decorative = signal(false);
}

describe('UiSpinnerComponent', () => {
	beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

	it('is a status with a hidden text label', () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement.querySelector('app-ui-spinner');
		expect(element.getAttribute('role')).toBe('status');
		expect(element.querySelector('.sr-only')?.textContent?.trim()).toBe('Envoi en cours');
		expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('slows down instead of spinning when reduced motion is asked', () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const svg: SVGElement = fixture.nativeElement.querySelector('svg');
		expect(svg.getAttribute('class')).toContain('motion-safe:animate-spin');
		expect(svg.getAttribute('class')).toContain('motion-reduce:');
	});

	it('is hidden entirely when decorative', () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.decorative.set(true);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement.querySelector('app-ui-spinner');
		expect(element.hasAttribute('role')).toBeFalse();
		expect(element.getAttribute('aria-hidden')).toBe('true');
		expect(element.querySelector('.sr-only')).toBeNull();
	});
});
