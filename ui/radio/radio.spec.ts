import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiFieldsetComponent } from './fieldset.component';
import { UiRadioDirective } from './radio.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiFieldsetComponent, UiRadioDirective],
	template: `
		<fieldset appUiFieldset legend="Fréquence" hint="Pour les rappels." [error]="error()" required>
			<label class="flex min-h-11 items-center gap-3">
				<input appUiRadio type="radio" name="frequence" value="semaine" [(ngModel)]="frequency" />
				<span>Chaque semaine</span>
			</label>
			<label class="flex min-h-11 items-center gap-3">
				<input appUiRadio type="radio" name="frequence" value="mois" [(ngModel)]="frequency" />
				<span>Chaque mois</span>
			</label>
		</fieldset>
	`,
})
class HostComponent {
	public frequency = 'semaine';
	public readonly error = signal('');
}

describe('UiRadioDirective and UiFieldsetComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let fieldset: HTMLFieldSetElement;

	beforeEach(async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		fieldset = fixture.nativeElement.querySelector('fieldset');
	});

	it('names the group with its legend and says it is required in text', () => {
		const legend = fieldset.querySelector('legend')!;
		expect(fieldset.firstElementChild).toBe(legend);
		expect(legend.textContent).toContain('Fréquence');
		expect(legend.textContent).toContain('(obligatoire)');
	});

	it('keeps native radios: same name, ngModel, round 20 px', () => {
		const radios = Array.from(fieldset.querySelectorAll('input')) as HTMLInputElement[];
		expect(radios.every((radio) => radio.type === 'radio' && radio.name === 'frequence')).toBeTrue();
		expect(radios[0].checked).toBeTrue();
		radios[1].click();
		expect(fixture.componentInstance.frequency).toBe('mois');
		expect(radios[0].getBoundingClientRect().width).toBe(20);
	});

	it('describes the group by the hint, then the error', () => {
		const hintId = fieldset.querySelector('p')!.id;
		expect(fieldset.getAttribute('aria-describedby')).toBe(hintId);
		fixture.componentInstance.error.set('Choisissez une fréquence.');
		fixture.detectChanges();
		const ids = fieldset.getAttribute('aria-describedby')!.split(' ');
		expect(ids.length).toBe(2);
		expect(document.getElementById(ids[1])?.textContent).toContain('Choisissez une fréquence.');
	});
});
