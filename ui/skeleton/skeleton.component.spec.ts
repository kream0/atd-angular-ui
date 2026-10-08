import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSkeletonComponent } from './skeleton.component';

@Component({
	standalone: true,
	imports: [UiSkeletonComponent],
	template: `<app-ui-skeleton [rows]="3" /><app-ui-skeleton kind="list" [rows]="2" />`,
})
class HostComponent {}

describe('UiSkeletonComponent', () => {
	it('is busy, says "Chargement…" to screen readers and hides its blocks', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const [lines, list] = Array.from(fixture.nativeElement.querySelectorAll('app-ui-skeleton')) as HTMLElement[];
		expect(lines.getAttribute('aria-busy')).toBe('true');
		expect(lines.querySelector('.sr-only')?.textContent).toBe('Chargement…');
		const blocks = lines.querySelector('[aria-hidden=true]')!;
		expect(blocks.children.length).toBe(3);
		expect(blocks.children[0].className).toContain('motion-safe:animate-pulse');
		expect(list.querySelector('[aria-hidden=true]')!.children.length).toBe(2);
		expect((list.querySelector('[aria-hidden=true]')!.children[0] as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
	});
});
