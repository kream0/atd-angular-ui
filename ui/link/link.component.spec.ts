import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiLinkComponent } from './link.component';

@Component({
	standalone: true,
	imports: [UiLinkComponent],
	template: `
		<a appUiLink href="#aide">Aide</a>
		<a appUiLink external href="https://example.test/">Site</a>
	`,
})
class HostComponent {}

describe('UiLinkComponent', () => {
	let links: HTMLAnchorElement[];

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		links = Array.from(fixture.nativeElement.querySelectorAll('a'));
	});

	it('is underlined, not marked by colour alone', () => {
		expect(getComputedStyle(links[0]).textDecorationLine).toContain('underline');
		expect(links[0].hasAttribute('target')).toBeFalse();
	});

	it('an external link opens a new tab safely and says so', () => {
		expect(links[1].target).toBe('_blank');
		expect(links[1].rel).toContain('noopener');
		expect(links[1].querySelector('.sr-only')?.textContent).toContain('(nouvel onglet)');
	});
});
