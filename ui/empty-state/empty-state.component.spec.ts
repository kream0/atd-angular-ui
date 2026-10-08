import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICON_LIST_CHECK } from '../icon/icons';
import { UiEmptyStateComponent } from './empty-state.component';

@Component({
	standalone: true,
	imports: [UiEmptyStateComponent],
	template: `
		<app-ui-empty-state title="Aucune tâche" text="Les tâches apparaîtront ici." [icon]="icon" [headingLevel]="level()">
			<button type="button">Ajouter une tâche</button>
		</app-ui-empty-state>
	`,
})
class HostComponent {
	public readonly icon = ICON_LIST_CHECK;
	public readonly level = signal<2 | 3 | 4>(2);
}

describe('UiEmptyStateComponent', () => {
	it('has a real heading at the asked level, a text, a hidden icon and the action', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement.querySelector('app-ui-empty-state');
		expect(element.querySelector('h2')?.textContent).toBe('Aucune tâche');
		expect(element.textContent).toContain('Les tâches apparaîtront ici.');
		expect(element.querySelector('app-ui-icon')?.getAttribute('aria-hidden')).toBe('true');
		expect(element.querySelector('button')?.textContent).toBe('Ajouter une tâche');

		fixture.componentInstance.level.set(3);
		fixture.detectChanges();
		expect(element.querySelector('h2')).toBeNull();
		expect(element.querySelector('h3')?.textContent).toBe('Aucune tâche');
	});
});
