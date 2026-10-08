import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	effect,
	ElementRef,
	inject,
	input,
	signal,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { UiTextService } from '../core/ui-text';
import { UiControlDirective } from '../field/control.directive';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { UiIcon } from '../icon/ui-icon';
import { ICON_BOLD } from '../icon/set/bold';
import { ICON_ITALIC } from '../icon/set/italic';
import { ICON_LIST } from '../icon/set/list';
import { ICON_QUOTE } from '../icon/set/quote';
import { hasMarkdown } from './markdown';
import { UiMarkdownComponent } from './markdown.component';
import { applyMark, MdMark } from './markdown-edit';

interface MarkButton {
	readonly mark: MdMark;
	readonly icon: UiIcon;
	readonly key: string;
	readonly fallback: string;
}

const INLINE_BUTTONS: readonly MarkButton[] = [
	{ mark: 'bold', icon: ICON_BOLD, key: 'common.markdown.bold', fallback: 'Gras' },
	{ mark: 'italic', icon: ICON_ITALIC, key: 'common.markdown.italic', fallback: 'Italique' },
	{ mark: 'quotes', icon: ICON_QUOTE, key: 'common.markdown.quotes', fallback: 'Guillemets' },
];
const BLOCK_BUTTONS: readonly MarkButton[] = [
	INLINE_BUTTONS[0],
	INLINE_BUTTONS[1],
	{ mark: 'quote', icon: ICON_QUOTE, key: 'common.markdown.quote', fallback: 'Citation' },
	{ mark: 'list', icon: ICON_LIST, key: 'common.markdown.list', fallback: 'Liste' },
];

/**
 * The input of a text written in the markdown subset (./markdown.ts), around the field's own control:
 *
 *   <app-ui-field label="Titre">
 *     <app-ui-markdown-input inline><input appUiInput appUiControl formControlName="title" /></app-ui-markdown-input>
 *   </app-ui-field>
 *
 * A toolbar puts the signs in for the user (bold, italic and « » quotes; in a multi-line text a quote and a list
 * instead of « »), and a preview shows the text as the pages will, once it holds a sign. `inline`: a title or a
 * label, one line, inline marks only. `document`: a report, previewed with its headings, tables and rules (see
 * UiMarkdownComponent). The control keeps its form binding: a button writes the new text in the control
 * and sends its `input` event, as typing does. A control bound by `[value]` rather than a form gives that value here too.
 */
@Component({
	selector: 'app-ui-markdown-input',
	standalone: true,
	imports: [UiIconButtonComponent, UiMarkdownComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'flex flex-col gap-1.5',
		'(input)': 'readControl()',
	},
	template: `
		<div role="toolbar" class="flex flex-wrap gap-1" [attr.aria-label]="text.get('common.markdown.toolbar', 'Mise en forme')" [attr.aria-controls]="controlId()">
			@for (button of buttons(); track button.mark) {
				<button
					type="button"
					appUiIconButton
					[icon]="button.icon"
					[iconSize]="20"
					[label]="text.get(button.key, button.fallback)"
					(pointerdown)="$event.preventDefault()"
					(click)="mark(button.mark)"
				></button>
			}
		</div>
		<ng-content />
		@if (showPreview()) {
			<div data-markdown-preview class="rounded-ui border border-dashed border-ui-line-strong bg-ui-bg px-3 py-2 text-sm text-ui-fg">
				<p class="mb-1 text-xs font-medium text-ui-muted">{{ text.get('common.markdown.preview', 'Aperçu') }}</p>
				@if (inline()) {
					<p dir="auto"><app-ui-markdown [text]="current()" inline /></p>
				} @else {
					<app-ui-markdown [text]="current()" [document]="document()" />
				}
			</div>
		}
	`,
})
export class UiMarkdownInputComponent {
	public readonly inline = input(false, { transform: booleanAttribute });
	public readonly document = input(false, { transform: booleanAttribute });
	/** The text, for a control bound by `[value]` and `(input)` rather than a form. */
	public readonly value = input<string | null | undefined>(undefined);

	protected readonly text = inject(UiTextService);
	protected readonly buttons = computed(() => (this.inline() ? INLINE_BUTTONS : BLOCK_BUTTONS));
	protected readonly controlId = signal<string | null>(null);
	protected readonly current = computed(() => this.value() ?? this.typed());
	protected readonly showPreview = computed(() => hasMarkdown(this.current(), this.inline(), { document: this.document() }));

	private readonly control = contentChild(UiControlDirective, { read: ElementRef });
	private readonly formControl = contentChild(NgControl);
	private readonly typed = signal('');

	constructor() {
		effect((onCleanup) => {
			const control = this.formControl();
			this.readControl();
			const changes = control?.valueChanges?.subscribe((value: unknown) => this.typed.set(typeof value === 'string' ? value : ''));
			onCleanup(() => changes?.unsubscribe());
		});
	}

	/** Reads the control's text and id: on each keystroke, and once the control is there. */
	protected readControl(): void {
		const element = this.element();
		if (!element) return;
		this.typed.set(element.value);
		this.controlId.set(element.id || null);
	}

	protected mark(mark: MdMark): void {
		const element = this.element();
		if (!element) return;
		const tight = element.closest('[lang]')?.getAttribute('lang') === 'ar';
		const edit = applyMark(element.value, element.selectionStart ?? element.value.length, element.selectionEnd ?? element.value.length, mark, { tight });
		element.value = edit.value;
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.focus();
		element.setSelectionRange(edit.start, edit.end);
	}

	private element(): HTMLInputElement | HTMLTextAreaElement | null {
		return (this.control()?.nativeElement as HTMLInputElement | HTMLTextAreaElement | undefined) ?? null;
	}
}
