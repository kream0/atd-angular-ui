import { Directive } from '@angular/core';
import { UI_CHOICE_CLASSES } from '../core/control-classes';

/**
 * A native checkbox: a 20 px box. Wrap it in a label at least 44 px tall
 * (`<label class="flex min-h-11 items-center gap-3">`) so the whole row is the target.
 */
@Directive({
	selector: 'input[type=checkbox][appUiCheckbox]',
	standalone: true,
	host: { class: `${UI_CHOICE_CLASSES} rounded-ui-sm` },
})
export class UiCheckboxDirective {}
