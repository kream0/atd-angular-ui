import { Directive } from '@angular/core';
import { UI_CHOICE_CLASSES } from '../core/control-classes';

/**
 * A native radio: arrow keys move the choice natively. Group radios in `fieldset[appUiFieldset]`,
 * each inside a label at least 44 px tall.
 */
@Directive({
	selector: 'input[type=radio][appUiRadio]',
	standalone: true,
	host: { class: `${UI_CHOICE_CLASSES} rounded-full` },
})
export class UiRadioDirective {}
