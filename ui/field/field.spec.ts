import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiInputDirective } from '../input/input.directive';
import { focusFirstInvalid, UiControlDirective } from './control.directive';
import { UiFieldComponent } from './field.component';

@Component({
	standalone: true,
	imports: [UiFieldComponent, UiControlDirective, UiInputDirective],
	template: `
		<app-ui-field label="Nom" hint="Visible par tous." [error]="error()" required>
			<input appUiInput appUiControl type="text" />
		</app-ui-field>
		<app-ui-field label="Ville">
			<input appUiInput appUiControl id="ville-existante" type="text" />
		</app-ui-field>
	`,
})
class HostComponent {
	public readonly error = signal('');
}

describe('UiFieldComponent and UiControlDirective', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let inputs: HTMLInputElement[];

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		inputs = Array.from(fixture.nativeElement.querySelectorAll('input'));
	});

	it('links the label to the control and writes "(obligatoire)"', () => {
		expect(inputs[0].id).toBeTruthy();
		expect(inputs[0].labels?.[0]?.textContent).toContain('Nom');
		expect(inputs[0].labels?.[0]?.textContent).toContain('(obligatoire)');
		expect(inputs[0].required).toBeTrue();
	});

	it('keeps an id the template already gives', () => {
		expect(inputs[1].id).toBe('ville-existante');
		expect(inputs[1].labels?.[0]?.textContent).toContain('Ville');
		expect(inputs[1].required).toBeFalse();
	});

	it('describes the control by the hint, then the error, and marks it invalid', () => {
		const describedBy = () => (inputs[0].getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
		expect(describedBy().length).toBe(1);
		expect(document.getElementById(describedBy()[0])?.textContent).toContain('Visible par tous.');
		expect(inputs[0].hasAttribute('aria-invalid')).toBeFalse();

		fixture.componentInstance.error.set('Saisissez un nom.');
		fixture.detectChanges();
		expect(describedBy().length).toBe(2);
		expect(document.getElementById(describedBy()[1])?.textContent).toContain('Saisissez un nom.');
		expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
		expect(inputs[1].hasAttribute('aria-describedby')).toBeFalse();
	});

	it('focusFirstInvalid puts focus on the first invalid control', () => {
		expect(focusFirstInvalid(fixture.nativeElement)).toBeFalse();
		fixture.componentInstance.error.set('Saisissez un nom.');
		fixture.detectChanges();
		expect(focusFirstInvalid(fixture.nativeElement)).toBeTrue();
		expect(document.activeElement).toBe(inputs[0]);
	});
});
