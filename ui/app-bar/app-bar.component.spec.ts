import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiAppBarComponent } from './app-bar.component';

@Component({
	standalone: true,
	imports: [UiAppBarComponent],
	template: `
		<app-ui-app-bar title="Agenda">
			<button appUiAppBarLeading type="button" aria-label="Retour">R</button>
			<button appUiAppBarActions type="button" aria-label="Ajouter">+</button>
		</app-ui-app-bar>
	`,
})
class HostComponent {}

describe('UiAppBarComponent', () => {
	it('is a sticky header landmark, 56 px tall, with leading, title and actions in order', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const bar: HTMLElement = fixture.nativeElement.querySelector('app-ui-app-bar');
		const header = bar.querySelector('header')!;

		expect(getComputedStyle(bar).position).toBe('sticky');
		expect(header.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
		const children = Array.from(header.children).map((child) => child.textContent?.trim());
		expect(children).toEqual(['R', 'Agenda', '+']);
	});
});
