import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiBadgeComponent, UiBadgeTone } from './badge.component';

@Component({
	standalone: true,
	imports: [UiBadgeComponent],
	template: `
		@for (tone of tones; track tone) {
			<app-ui-badge [tone]="tone">{{ tone }}</app-ui-badge>
		}
		<app-ui-badge [dot]="false">Sans point</app-ui-badge>
	`,
})
class HostComponent {
	public readonly tones: UiBadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger'];
}

function luminance(color: string): number {
	const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((value) => {
		const channel = Number(value) / 255;
		return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

describe('UiBadgeComponent', () => {
	let badges: HTMLElement[];

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		badges = Array.from(fixture.nativeElement.querySelectorAll('app-ui-badge'));
	});

	afterEach(() => document.documentElement.classList.remove('dark'));

	it('carries its meaning in text; the dot is decorative', () => {
		expect(badges[0].textContent?.trim()).toBe('neutral');
		expect(badges[0].querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
		expect(badges[5].querySelector('span')).toBeNull();
	});

	for (const theme of ['light', 'dark']) {
		it(`text contrast is at least 4.5:1 for every tone (${theme})`, () => {
			document.documentElement.classList.toggle('dark', theme === 'dark');
			for (const badge of badges) {
				const style = getComputedStyle(badge);
				expect(contrast(style.color, style.backgroundColor))
					.withContext(badge.textContent ?? '')
					.toBeGreaterThanOrEqual(4.5);
			}
		});
	}
});
