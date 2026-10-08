import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiInputDirective } from './input.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiInputDirective],
	template: `
		<label for="nom">Nom</label>
		<input appUiInput id="nom" type="text" class="extra" [(ngModel)]="name" />
		<input appUiInput type="tel" dir="ltr" aria-label="Numéro" />
	`,
})
class HostComponent {
	public name = 'Projet';
}

describe('UiInputDirective', () => {
	it('keeps the native input: label, ngModel, classes, 44 px, direction', async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		const [input, phone] = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];

		expect(input.labels?.[0]?.textContent).toBe('Nom');
		expect(input.value).toBe('Projet');
		input.value = 'Équipe';
		input.dispatchEvent(new Event('input'));
		expect(fixture.componentInstance.name).toBe('Équipe');

		expect(input.classList).toContain('extra');
		expect(input.classList).toContain('ui-focus');
		expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		expect(input.getAttribute('dir')).toBe('auto');
		expect(phone.getAttribute('dir')).toBe('ltr');
	});
});
