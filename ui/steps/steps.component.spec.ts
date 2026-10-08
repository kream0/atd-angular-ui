import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStepsComponent } from './steps.component';

@Component({
	standalone: true,
	imports: [UiStepsComponent],
	template: `<app-ui-steps [steps]="['Infos', 'Équipe', 'Programme', 'Résumé']" [current]="2" />`,
})
class HostComponent {}

describe('UiStepsComponent', () => {
	it('says "Étape 2 sur 4", marks the current step and the finished ones', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement.querySelector('app-ui-steps');
		expect(element.textContent).toContain('Étape 2 sur 4');
		const items = Array.from(element.querySelectorAll('ol > li'));
		expect(items.length).toBe(4);
		expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([null, 'step', null, null]);
		expect(items[0].textContent).toContain('(terminée)');
		expect(items[1].textContent).not.toContain('(terminée)');
	});
});
