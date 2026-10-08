import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';

/**
 * A loading spinner: an emerald arc with `role="status"` and a hidden label, or, decorative inside a busy button, in
 * the button's currentColor.
 */
@Component({
	selector: 'app-ui-spinner',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'inline-flex shrink-0 items-center justify-center',
		'[class.text-ui-accent-ink]': '!decorative()',
		'[attr.role]': 'decorative() ? null : "status"',
		'[attr.aria-hidden]': 'decorative() ? "true" : null',
	},
	template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			[attr.width]="size()"
			[attr.height]="size()"
			class="motion-safe:animate-spin motion-reduce:animate-[spin_2.5s_linear_infinite]"
			focusable="false"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
			<path d="M21 12a9 9 0 0 0 -9 -9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
		</svg>
		@if (!decorative()) {
			<span class="sr-only">{{ label() ?? text.get('common.loading', 'Chargement…') }}</span>
		}
	`,
})
export class UiSpinnerComponent {
	/** Width and height in px. */
	public readonly size = input<number>(24);
	/** common.loading (« Chargement… ») when not given. */
	public readonly label = input<string>();
	/** Hides the spinner from assistive tech when the busy state is announced elsewhere (a busy button). */
	public readonly decorative = input(false, { transform: booleanAttribute });

	protected readonly text = inject(UiTextService);
}
