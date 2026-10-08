import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '../icon/ui-icon';
import { UiIconComponent } from '../icon/icon.component';

/**
 * "Nothing here yet": the icon in emerald on a pale eight-pointed star, a real heading at the page's
 * level in the display face, a short text and one projected action.
 */
@Component({
	selector: 'app-ui-empty-state',
	standalone: true,
	imports: [UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'flex flex-col items-center gap-2 px-4 py-10 text-center text-ui-fg' },
	template: `
		@if (icon(); as icon) {
			<span class="relative mb-2 flex size-[4.5rem] items-center justify-center text-ui-accent-ink">
				<span class="ui-star absolute inset-0 size-full text-ui-accent-soft"></span>
				<app-ui-icon class="relative" [icon]="icon" [size]="32" [strokeWidth]="1.5" />
			</span>
		}
		@switch (headingLevel()) {
			@case (3) {
				<h3 class="text-balance font-display text-ui-section font-semibold">{{ title() }}</h3>
			}
			@case (4) {
				<h4 class="text-balance font-display text-ui-section font-semibold">{{ title() }}</h4>
			}
			@default {
				<h2 class="text-balance font-display text-ui-section font-semibold">{{ title() }}</h2>
			}
		}
		@if (text()) {
			<p class="max-w-prose text-sm leading-relaxed text-ui-muted">{{ text() }}</p>
		}
		<div class="mt-2 empty:hidden">
			<ng-content />
		</div>
	`,
})
export class UiEmptyStateComponent {
	public readonly title = input.required<string>();
	public readonly text = input<string>('');
	public readonly icon = input<UiIcon>();
	public readonly headingLevel = input<2 | 3 | 4>(2);
}
