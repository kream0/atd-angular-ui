import { Directive, inject, input, OnInit } from '@angular/core';
import { UiFieldComponent } from './field.component';

/** Marks the control of an `app-ui-field` and takes its id, description, validity and required state. */
@Directive({
	selector: '[appUiControl]',
	standalone: true,
	host: {
		'[attr.id]': 'field?.controlId() ?? id()',
		'[attr.aria-describedby]': 'field?.describedBy() ?? null',
		'[attr.aria-invalid]': 'field?.error() ? "true" : null',
		'[attr.required]': 'field?.required() ? "" : null',
	},
})
export class UiControlDirective implements OnInit {
	/** Keeps an id the template already gives the control. */
	public readonly id = input<string>();

	protected readonly field = inject(UiFieldComponent, { optional: true });

	ngOnInit(): void {
		const id = this.id();
		if (id && this.field) this.field.useControlId(id);
	}
}

/**
 * Focuses the first control marked invalid in `root` (call it on submit, after the errors are rendered).
 * Returns false when every control is valid.
 */
export function focusFirstInvalid(root: ParentNode): boolean {
	const first = root.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!first) return false;
	first.focus();
	return true;
}
