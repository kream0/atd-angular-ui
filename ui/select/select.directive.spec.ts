import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiSelectDirective } from './select.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiSelectDirective],
	template: `
		<label for="jour">Jour</label>
		<select appUiSelect id="jour" [(ngModel)]="day">
			<option value="lundi">Lundi</option>
			<option value="jeudi">Jeudi</option>
		</select>
	`,
})
class HostComponent {
	public day = 'jeudi';
}

describe('UiSelectDirective', () => {
	it('keeps the native select, 44 px tall, with room for the chevron on the inline end', async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

		expect(select.labels?.[0]?.textContent).toBe('Jour');
		expect(select.value).toBe('jeudi');
		select.value = 'lundi';
		select.dispatchEvent(new Event('change'));
		expect(fixture.componentInstance.day).toBe('lundi');
		expect(select.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		expect(select.classList).toContain('pe-10');
		expect(select.classList).toContain('ui-focus');
	});
});
