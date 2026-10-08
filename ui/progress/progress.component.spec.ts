import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiProgressComponent } from './progress.component';

@Component({
	standalone: true,
	imports: [UiProgressComponent],
	template: `
		<app-ui-progress label="Programme suivi" [value]="62" />
		<app-ui-progress label="Tâches terminées" [value]="3" [max]="8" [countLabel]="true" />
	`,
})
class HostComponent {}

describe('UiProgressComponent', () => {
	it('is a native progress named by its label, with the value as text', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const [percent, count] = Array.from(fixture.nativeElement.querySelectorAll('app-ui-progress')) as HTMLElement[];
		const bar = percent.querySelector('progress')!;
		expect(bar.value).toBe(62);
		expect(bar.max).toBe(100);
		expect(document.getElementById(bar.getAttribute('aria-labelledby')!)?.textContent).toBe('Programme suivi');
		expect(percent.textContent).toContain('62 %');
		expect(count.textContent).toContain('3 sur 8');
	});
});
