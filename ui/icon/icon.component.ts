import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIcon } from './ui-icon';

/**
 * An inline icon (Tabler or Heroicons, see ./set) in currentColor. Decorative by default (`aria-hidden`);
 * with `label` it becomes `role="img"` with that name. Directional icons flip in RTL.
 */
@Component({
	selector: 'app-ui-icon',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'inline-flex shrink-0 items-center justify-center align-middle',
		'[class]': 'mirrorClass()',
		'[attr.role]': 'label() ? "img" : null',
		'[attr.aria-label]': 'label() || null',
		'[attr.aria-hidden]': 'label() ? null : "true"',
		'[attr.data-icon]': 'icon().name',
	},
	template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			[attr.viewBox]="icon().viewBox ?? '0 0 24 24'"
			[attr.width]="size()"
			[attr.height]="size()"
			[attr.fill]="icon().fill ? 'currentColor' : 'none'"
			[attr.stroke]="icon().fill ? 'none' : 'currentColor'"
			[attr.stroke-width]="icon().fill ? null : strokeWidth()"
			stroke-linecap="round"
			stroke-linejoin="round"
			focusable="false"
			aria-hidden="true"
		>
			@for (d of icon().paths; track $index) {
				<path [attr.d]="d" [attr.fill-rule]="rule()" [attr.clip-rule]="rule()" />
			}
		</svg>
	`,
})
export class UiIconComponent {
	public readonly icon = input.required<UiIcon>();
	/** Width and height in px. */
	public readonly size = input<number>(24);
	public readonly strokeWidth = input<number>(2);
	/** A meaningful icon's accessible name. Leave empty when text next to it says the same. */
	public readonly label = input<string>('');

	protected readonly rule = computed(() => (this.icon().evenodd ? 'evenodd' : null));
	protected readonly mirrorClass = computed(() => (this.icon().mirror ? 'rtl:-scale-x-100' : ''));
}
