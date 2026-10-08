import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_CHECK } from '../icon/set/check';

/**
 * Progress through a multi-step form: a visible "Étape 2 sur 4", an `ol` with
 * `aria-current="step"` on the current step and a hidden "terminée" on the finished ones. Each step has a marker on
 * a rail: a check on emerald when done, an emerald ring when current, a grey ring still to do.
 */
@Component({
	selector: 'app-ui-steps',
	standalone: true,
	imports: [UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		<p class="text-sm font-medium text-ui-fg">{{ position() }}</p>
		<ol class="mt-2 flex gap-2">
			@for (step of steps(); track $index) {
				<li class="min-w-0 flex-1" [attr.aria-current]="$index + 1 === current() ? 'step' : null">
					<span aria-hidden="true" class="flex items-center gap-2">
						@if ($index + 1 < current()) {
							<span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-ui-accent text-ui-accent-fg">
								<app-ui-icon [icon]="checkIcon" [size]="14" [strokeWidth]="3" />
							</span>
						} @else if ($index + 1 === current()) {
							<span
								class="flex size-6 shrink-0 items-center justify-center rounded-full bg-ui-surface ring-2 ring-inset
									ring-ui-accent-ink"
							>
								<span class="size-2 rounded-full bg-ui-accent-ink"></span>
							</span>
						} @else {
							<span class="size-6 shrink-0 rounded-full bg-ui-surface ring-2 ring-inset ring-ui-line-strong"></span>
						}
						@if (!$last) {
							<span class="h-0.5 min-w-0 flex-1 rounded-full" [class]="$index + 1 < current() ? 'bg-ui-accent' : 'bg-ui-line'"></span>
						}
					</span>
					<span
						class="mt-1.5 block truncate text-xs"
						[class]="$index + 1 === current() ? 'font-semibold text-ui-fg' : 'text-ui-muted'"
					>
						{{ step }}
						@if ($index + 1 < current()) {
							<span class="sr-only">{{ text.get('common.stepDone', '(terminée)') }}</span>
						}
					</span>
				</li>
			}
		</ol>
	`,
})
export class UiStepsComponent {
	/** The step names, in order. */
	public readonly steps = input.required<readonly string[]>();
	/** The current step, from 1. */
	public readonly current = input.required<number>();

	protected readonly text = inject(UiTextService);
	protected readonly checkIcon = ICON_CHECK;
	protected readonly position = computed(() => {
		const params = { current: this.current(), total: this.steps().length };
		return this.text.get('common.stepOf', `Étape ${params.current} sur ${params.total}`, params);
	});
}
