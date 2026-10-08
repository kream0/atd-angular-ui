import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<UiBadgeTone, string> = {
	neutral: 'bg-ui-bg text-ui-fg ring-ui-line-strong/60',
	accent: 'bg-ui-accent-soft text-ui-accent-ink ring-ui-accent-ink/25',
	success: 'bg-ui-surface text-ui-success-ink ring-ui-success-ink/40',
	warning: 'bg-ui-surface text-ui-warning-ink ring-ui-warning-ink/40',
	danger: 'bg-ui-danger-soft text-ui-danger-ink ring-ui-danger-ink/25',
};

/**
 * A status pill, sentence case. The text carries the meaning; the dot is decorative. Ink colours on
 * the surface, or on a soft tint of the same hue (accent, danger).
 */
@Component({
	selector: 'app-ui-badge',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { '[class]': 'classes()' },
	template: `
		@if (dot()) {
			<span aria-hidden="true" class="size-1.5 shrink-0 rounded-full bg-current"></span>
		}
		<ng-content />
	`,
})
export class UiBadgeComponent {
	public readonly tone = input<UiBadgeTone>('neutral');
	public readonly dot = input(true, { transform: booleanAttribute });

	protected readonly classes = computed(
		() =>
			'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ' +
			`font-medium ring-1 ring-inset ${TONES[this.tone()]}`,
	);
}
