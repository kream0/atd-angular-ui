import { Directive, input } from '@angular/core';
import { UI_CONTROL_CLASSES } from '../core/control-classes';

/**
 * A native text input. 16 px text so iOS does not zoom; `dir="auto"` by default so Arabic names
 * read right to left. Keeps `type`, `inputmode`, `autocomplete`, `ngModel` and reactive forms as they are.
 */
@Directive({
	selector: 'input[appUiInput]',
	standalone: true,
	host: {
		class: `${UI_CONTROL_CLASSES} px-3`,
		'[attr.dir]': 'dir()',
	},
})
export class UiInputDirective {
	public readonly dir = input<'auto' | 'ltr' | 'rtl'>('auto');
}
