import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiSwitchDirective } from './switch.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiSwitchDirective],
	template: `
		<label class="flex min-h-11 items-center justify-between gap-3">
			<span>Mode compact</span>
			<input appUiSwitch type="checkbox" [(ngModel)]="compact" />
		</label>
	`,
})
class HostComponent {
	public compact = false;
}

describe('UiSwitchDirective', () => {
	it('is a native checkbox with role="switch", a 24x44 track and a label that toggles it', async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
		const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');

		expect(input.getAttribute('role')).toBe('switch');
		expect(input.labels?.[0]?.textContent).toContain('Mode compact');
		const rect = input.getBoundingClientRect();
		expect(rect.width).toBe(44);
		expect(rect.height).toBe(24);
		expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

		label.click();
		expect(input.checked).toBeTrue();
		expect(fixture.componentInstance.compact).toBeTrue();
	});

	it('moves the knob by background position, swapped in RTL (logical)', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
		// Read the end positions, not a frame of the knob's slide.
		input.style.transition = 'none';
		const off = getComputedStyle(input).backgroundPosition;
		input.checked = true;
		const on = getComputedStyle(input).backgroundPosition;
		expect(off).not.toBe(on);
		// In RTL a checked switch has its knob on the left, where an unchecked one sits in LTR.
		fixture.nativeElement.setAttribute('dir', 'rtl');
		expect(getComputedStyle(input).backgroundPosition).toBe(off);
	});
});
