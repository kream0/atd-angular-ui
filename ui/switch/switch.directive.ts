import { Directive } from '@angular/core';

/**
 * A native checkbox shown as a switch, `role="switch"`. The 24x44 track (emerald when on) shows the
 * state by the knob position as well as the colour. Wrap it in a label at least 44 px tall. Forced-colours mode gets the native box.
 */
@Directive({
	selector: 'input[type=checkbox][appUiSwitch]',
	standalone: true,
	host: {
		role: 'switch',
		class:
			'h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-ui-line-strong text-ui-accent ' +
			'bg-[radial-gradient(circle_at_center,rgb(var(--ui-surface))_0.5625rem,transparent_0.625rem)] ' +
			'bg-[length:1.5rem_1.5rem] bg-no-repeat bg-[position:left_center] rtl:bg-[position:right_center] ' +
			'checked:bg-[radial-gradient(circle_at_center,rgb(var(--ui-surface))_0.5625rem,transparent_0.625rem)] ' +
			'checked:bg-[length:1.5rem_1.5rem] checked:bg-[position:right_center] rtl:checked:bg-[position:left_center] ' +
			'ui-focus focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ' +
			'motion-safe:transition-[background-position] forced-colors:appearance-auto',
	},
})
export class UiSwitchDirective {}
