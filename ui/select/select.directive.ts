import { Directive } from '@angular/core';
import { UI_CONTROL_CLASSES } from '../core/control-classes';

/**
 * A native select: the phone's own picker. The chevron sits at the inline end (0.75 rem) with
 * room for it (`pe-10`), on the left in RTL.
 */
@Directive({
	selector: 'select[appUiSelect]',
	standalone: true,
	host: {
		class:
			`${UI_CONTROL_CLASSES} ps-3 pe-10 bg-[position:right_0.75rem_center] ` +
			'rtl:bg-[position:left_0.75rem_center]',
	},
})
export class UiSelectDirective {}
