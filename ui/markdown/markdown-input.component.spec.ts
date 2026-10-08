import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiControlDirective } from '../field/control.directive';
import { UiFieldComponent } from '../field/field.component';
import { UiInputDirective } from '../input/input.directive';
import { UiMarkdownInputComponent } from './markdown-input.component';

@Component({
	standalone: true,
	imports: [ReactiveFormsModule, UiFieldComponent, UiControlDirective, UiInputDirective, UiMarkdownInputComponent],
	template: `
		<app-ui-field label="Thème">
			<app-ui-markdown-input id="title" inline>
				<input appUiInput appUiControl [formControl]="title" />
			</app-ui-markdown-input>
		</app-ui-field>
		<app-ui-field label="Note">
			<app-ui-markdown-input id="note">
				<textarea appUiInput appUiControl [formControl]="note"></textarea>
			</app-ui-markdown-input>
		</app-ui-field>
		<app-ui-markdown-input id="row" [value]="row()">
			<textarea appUiControl [value]="row()" (input)="row.set($any($event.target).value)"></textarea>
		</app-ui-markdown-input>
		<app-ui-markdown-input id="report" document>
			<textarea appUiControl></textarea>
		</app-ui-markdown-input>
	`,
})
class HostComponent {
	public readonly title = new FormControl('', { nonNullable: true });
	public readonly note = new FormControl('', { nonNullable: true });
	public readonly row = signal('');
}

describe('UiMarkdownInputComponent', () => {
	let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
	let host: HostComponent;
	const part = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
	const buttons = (id: string) => Array.from(part(id).querySelectorAll<HTMLButtonElement>('[role="toolbar"] button'));
	const button = (id: string, label: string) => buttons(id).find((b) => b.getAttribute('aria-label') === label)!;
	const preview = (id: string) => part(id).querySelector('[data-markdown-preview]');
	const type = (control: HTMLInputElement | HTMLTextAreaElement, value: string) => {
		control.value = value;
		control.dispatchEvent(new Event('input', { bubbles: true }));
		fixture.detectChanges();
	};

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('gives a title bold, italic and quotes, and a multi-line text a quote and a list instead of quotes', () => {
		expect(buttons('title').map((b) => b.getAttribute('aria-label'))).toEqual(['Gras', 'Italique', 'Guillemets']);
		expect(buttons('note').map((b) => b.getAttribute('aria-label'))).toEqual(['Gras', 'Italique', 'Citation', 'Liste']);
		expect(part('title').querySelector('[role="toolbar"]')!.getAttribute('aria-label')).toBe('Mise en forme');
		expect(buttons('note').every((b) => b.type === 'button')).toBeTrue();
	});

	it('puts the signs around the selection, in the form value, and keeps the words selected', () => {
		const input = part('title').querySelector('input')!;
		type(input, 'Le dossier Projet');
		input.setSelectionRange(11, 17);
		button('title', 'Italique').click();
		fixture.detectChanges();
		expect(host.title.value).toBe('Le dossier *Projet*');
		expect([input.selectionStart, input.selectionEnd]).toEqual([12, 18]);
		expect(document.activeElement).toBe(input);
	});

	it('shows the preview only once the text has a mark, as the pages will show it', () => {
		const textarea = part('note').querySelector('textarea')!;
		type(textarea, 'Un texte simple');
		expect(preview('note')).toBeNull();
		textarea.setSelectionRange(0, 15);
		button('note', 'Citation').click();
		fixture.detectChanges();
		expect(host.note.value).toBe('> Un texte simple');
		expect(preview('note')!.textContent).toContain('Aperçu');
		expect(preview('note')!.querySelector('blockquote')!.textContent).toBe('Un texte simple');
	});

	it('follows a value the form sets', () => {
		host.title.setValue('**Fort**');
		fixture.detectChanges();
		expect(preview('title')!.querySelector('strong')!.textContent).toBe('Fort');
	});

	it('works with a control bound by [value] rather than a form', () => {
		const textarea = part('row').querySelector('textarea')!;
		type(textarea, 'un mot');
		textarea.setSelectionRange(3, 6);
		button('row', 'Gras').click();
		fixture.detectChanges();
		expect(host.row()).toBe('un **mot**');
		expect(preview('row')!.querySelector('strong')!.textContent).toBe('mot');
	});

	it('previews a document with its headings and tables, which a note keeps as typed', () => {
		const table = '## Budget\n| Poste | Montant |\n| --- | --: |\n| Salle | 120 € |';
		type(part('report').querySelector('textarea')!, table);
		expect(preview('report')!.querySelector('[role="heading"]')!.textContent!.trim()).toBe('Budget');
		expect(Array.from(preview('report')!.querySelectorAll('td')).map((td) => td.textContent!.trim())).toEqual(['Salle', '120 €']);
		type(part('note').querySelector('textarea')!, table);
		expect(preview('note')).toBeNull();
	});

	it('names the control the toolbar acts on', () => {
		const input = part('title').querySelector('input')!;
		type(input, 'x');
		expect(input.id).toBeTruthy();
		expect(part('title').querySelector('[role="toolbar"]')!.getAttribute('aria-controls')).toBe(input.id);
	});
});
