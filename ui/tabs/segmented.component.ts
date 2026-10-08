import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiScrollCueDirective } from './scroll-cue.directive';

export interface UiSegment {
	readonly value: string;
	readonly label: string;
}

/**
 * A segmented control for 2-4 views: a native radio group, so arrow keys and screen readers work
 * as for any radio. The selected segment is a pale emerald pill with emerald, bold text. On a narrow screen the
 * segments scroll inside the frame, with a fade on the edge that has more and the selected one kept in view
 * (UiScrollCueDirective); the frame stays whole.
 */
@Component({
	selector: 'app-ui-segmented',
	standalone: true,
	imports: [UiScrollCueDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		<fieldset class="min-w-0 border-0 p-0">
			<legend class="sr-only">{{ label() }}</legend>
			<div class="inline-flex max-w-full rounded-ui bg-ui-surface ring-1 ring-inset ring-ui-line-strong">
				<div
					class="flex min-w-0 gap-1 overflow-x-auto p-1"
					[appUiScrollCue]="value()"
					[uiScrollCueItems]="options()"
					uiScrollCueActive="input:checked"
				>
					@for (option of options(); track option.value) {
						<label class="relative shrink-0">
							<input
								type="radio"
								class="peer sr-only"
								[name]="name"
								[value]="option.value"
								[checked]="option.value === value()"
								(change)="value.set(option.value)"
							/>
							<span
								class="flex min-h-11 cursor-pointer items-center rounded-ui-sm px-4 text-sm font-medium text-ui-muted
									hover:bg-ui-accent-soft/50 hover:text-ui-fg peer-checked:bg-ui-accent-soft peer-checked:font-semibold
									peer-checked:text-ui-accent-ink peer-focus-visible:outline peer-focus-visible:outline-2
									peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ui-focus"
							>
								{{ option.label }}
							</span>
						</label>
					}
				</div>
			</div>
		</fieldset>
	`,
})
export class UiSegmentedComponent {
	public readonly options = input.required<readonly UiSegment[]>();
	public readonly value = model.required<string>();
	/** Names the group for screen readers (the visible segments name the options). */
	public readonly label = input.required<string>();

	protected readonly name = uiId('ui-segmented');
}
