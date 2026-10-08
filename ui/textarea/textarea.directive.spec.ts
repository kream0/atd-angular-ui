import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiTextareaDirective } from './textarea.directive';

@Component({
	standalone: true,
	imports: [FormsModule, UiTextareaDirective],
	template: `
		<label for="note">Note</label>
		<textarea appUiTextarea id="note" [(ngModel)]="note"></textarea>
		<textarea appUiTextarea aria-label="Court" [rows]="2"></textarea>
	`,
})
class HostComponent {
	public note = 'Texte';
}

describe('UiTextareaDirective', () => {
	it('keeps the native textarea, sets rows and lets text set its direction', async () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		const [note, short] = Array.from(fixture.nativeElement.querySelectorAll('textarea')) as HTMLTextAreaElement[];

		expect(note.labels?.[0]?.textContent).toBe('Note');
		expect(note.value).toBe('Texte');
		expect(note.rows).toBe(4);
		expect(short.rows).toBe(2);
		expect(note.getAttribute('dir')).toBe('auto');
		expect(note.classList).toContain('ui-focus');
	});
});
