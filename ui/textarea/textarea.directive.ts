import { Directive, input } from '@angular/core';
import { UI_CONTROL_CLASSES } from '../core/control-classes';

/** A native textarea: same look as the input, `rows` sets the height, the user can resize it. */
@Directive({
	selector: 'textarea[appUiTextarea]',
	standalone: true,
	host: {
		class: `${UI_CONTROL_CLASSES} resize-y px-3`,
		'[attr.dir]': 'dir()',
		'[attr.rows]': 'rows()',
	},
})
export class UiTextareaDirective {
	public readonly dir = input<'auto' | 'ltr' | 'rtl'>('auto');
	public readonly rows = input<number>(4);
}
