import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICON_EDIT } from '../icon/icons';
import { UiIconButtonComponent } from './icon-button.component';

@Component({
	standalone: true,
	imports: [UiIconButtonComponent],
	template: `
		<button appUiIconButton type="button" label="Modifier la tâche" [icon]="icon" [pressed]="pressed()"></button>
	`,
})
class HostComponent {
	public readonly icon = ICON_EDIT;
	public readonly pressed = signal<boolean | undefined>(undefined);
}

describe('UiIconButtonComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let button: HTMLButtonElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		button = fixture.nativeElement.querySelector('button');
	});

	it('is named by its label and its icon is hidden', () => {
		expect(button.getAttribute('aria-label')).toBe('Modifier la tâche');
		expect(button.querySelector('app-ui-icon')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('is a 44x44 target', () => {
		const rect = button.getBoundingClientRect();
		expect(rect.width).toBeGreaterThanOrEqual(44);
		expect(rect.height).toBeGreaterThanOrEqual(44);
	});

	it('has aria-pressed only when it is a toggle', () => {
		expect(button.hasAttribute('aria-pressed')).toBeFalse();
		fixture.componentInstance.pressed.set(false);
		fixture.detectChanges();
		expect(button.getAttribute('aria-pressed')).toBe('false');
		fixture.componentInstance.pressed.set(true);
		fixture.detectChanges();
		expect(button.getAttribute('aria-pressed')).toBe('true');
	});
});
