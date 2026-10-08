import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiIconComponent } from './icon.component';
import * as icons from './set';
import { UiIcon } from './ui-icon';

@Component({
	standalone: true,
	imports: [UiIconComponent],
	template: `<app-ui-icon [icon]="icon()" [label]="label()" [size]="20" />`,
})
class HostComponent {
	public readonly icon = signal<UiIcon>(icons.ICON_CHECK);
	public readonly label = signal('');
}

describe('UiIconComponent', () => {
	function render(): { host: HostComponent; element: HTMLElement; fixture: ReturnType<typeof TestBed.createComponent<HostComponent>> } {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		return { host: fixture.componentInstance, element: fixture.nativeElement.querySelector('app-ui-icon'), fixture };
	}

	beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

	it('is hidden from assistive tech by default', () => {
		const { element } = render();
		expect(element.getAttribute('aria-hidden')).toBe('true');
		expect(element.hasAttribute('role')).toBeFalse();
		expect(element.querySelector('svg')?.getAttribute('focusable')).toBe('false');
	});

	it('becomes role="img" with a name when labelled', () => {
		const { host, element, fixture } = render();
		host.label.set('Validé');
		fixture.detectChanges();
		expect(element.getAttribute('role')).toBe('img');
		expect(element.getAttribute('aria-label')).toBe('Validé');
		expect(element.hasAttribute('aria-hidden')).toBeFalse();
	});

	it('draws in currentColor at the requested size', () => {
		const { element } = render();
		const svg = element.querySelector('svg')!;
		expect(svg.getAttribute('stroke')).toBe('currentColor');
		expect(svg.getAttribute('width')).toBe('20');
		expect(svg.querySelectorAll('path').length).toBe(icons.ICON_CHECK.paths.length);
	});

	it('mirrors directional icons in RTL only', () => {
		const { host, element, fixture } = render();
		expect(element.classList).not.toContain('rtl:-scale-x-100');
		host.icon.set(icons.ICON_CHEVRON_LEFT);
		fixture.detectChanges();
		expect(element.classList).toContain('rtl:-scale-x-100');
		expect(element.classList).toContain('inline-flex');
	});

	it('every icon constant of the set has a unique name and at least one path', () => {
		const list = Object.values(icons) as UiIcon[];
		expect(new Set(list.map((icon) => icon.name)).size).toBe(list.length);
		expect(list.every((icon) => icon.paths.length > 0)).toBeTrue();
	});
});
