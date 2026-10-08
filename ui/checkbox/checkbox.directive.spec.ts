import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiCheckboxDirective } from './checkbox.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiCheckboxDirective],
	template: `
		<label class="flex min-h-11 items-center gap-3">
			<input appUiCheckbox type="checkbox" [(ngModel)]="accepted" />
			<span>Recevoir les rappels</span>
		</label>
	`,
})
class HostComponent {
	public accepted = false;
}

describe('UiCheckboxDirective', () => {
	it('keeps the native checkbox: label, click on the label, ngModel, 20 px box', async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
		const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');

		expect(input.type).toBe('checkbox');
		expect(input.labels?.[0]?.textContent).toContain('Recevoir les rappels');
		label.click();
		expect(input.checked).toBeTrue();
		expect(fixture.componentInstance.accepted).toBeTrue();
		expect(input.getBoundingClientRect().width).toBe(20);
		expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		expect(input.classList).toContain('ui-focus');
	});
});
