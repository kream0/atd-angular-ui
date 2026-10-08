import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiArabicDirective } from './arabic.directive';

@Component({
	standalone: true,
	imports: [UiArabicDirective],
	template: `<p appUiArabic class="text-2xl">مَرْحَبًا بِكُمْ فِي الْمَوْقِعِ</p>`,
})
class HostComponent {}

describe('UiArabicDirective', () => {
	function render(): HTMLElement {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		return fixture.nativeElement.querySelector('p');
	}

	it('marks the text as Arabic, right to left, whatever the page direction', () => {
		const text = render();

		expect(text.getAttribute('lang')).toBe('ar');
		expect(text.getAttribute('dir')).toBe('rtl');
		expect(getComputedStyle(text).direction).toBe('rtl');
	});

	it('uses the Arabic font stack, start alignment and loose leading, and keeps the host classes', () => {
		const text = render();

		expect(text.classList).toContain('font-arabic');
		expect(text.classList).toContain('text-start');
		expect(text.classList).toContain('leading-loose');
		expect(text.classList).toContain('text-2xl');
		expect(text.classList).not.toContain('rtl');
	});
});
