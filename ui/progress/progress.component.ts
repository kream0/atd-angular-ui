import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiTextService } from '../core/ui-text';

/**
 * A completion bar: native `<progress>` named by its label, with the value also written as text. An
 * emerald fill on a hairline-coloured track.
 */
@Component({
	selector: 'app-ui-progress',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		<div class="flex items-baseline justify-between gap-2 text-sm text-ui-fg">
			<span [id]="labelId">{{ label() }}</span>
			<span class="tabular-nums">{{ valueText() }}</span>
		</div>
		<progress
			[attr.aria-labelledby]="labelId"
			[value]="value()"
			[max]="max()"
			class="mt-1.5 block h-2 w-full appearance-none overflow-hidden rounded-full border-0 bg-ui-line
				[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-ui-accent [&::-webkit-progress-bar]:bg-ui-line
				[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-ui-accent"
		></progress>
	`,
})
export class UiProgressComponent {
	public readonly label = input.required<string>();
	public readonly value = input.required<number>();
	public readonly max = input<number>(100);
	/** Writes the value as common.countOf ("3 sur 8") instead of a percentage. */
	public readonly countLabel = input<boolean>(false);

	protected readonly labelId = uiId('ui-progress');
	private readonly text = inject(UiTextService);
	protected readonly valueText = computed(() => {
		const max = this.max() || 1;
		const value = Math.min(Math.max(this.value(), 0), max);
		if (!this.countLabel()) return `${Math.round((value / max) * 100)} %`;
		return this.text.get('common.countOf', `${value} sur ${max}`, { value, max });
	});
}
