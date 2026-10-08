import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { UiIcon } from '../icon/ui-icon';
import { UiIconComponent } from '../icon/icon.component';

export type UiIconButtonVariant = 'ghost' | 'secondary' | 'primary';

const VARIANTS: Record<UiIconButtonVariant, string> = {
	ghost:
		'text-ui-fg hover:bg-ui-accent-soft hover:text-ui-accent-ink active:bg-ui-accent-soft/70 ' +
		'aria-pressed:bg-ui-accent-soft aria-pressed:text-ui-accent-ink',
	secondary:
		'bg-ui-surface text-ui-accent-ink ring-1 ring-inset ring-ui-line-strong hover:bg-ui-accent-soft ' +
		'active:bg-ui-accent-soft/70 aria-pressed:bg-ui-accent-soft aria-pressed:ring-ui-accent-ink',
	primary: 'bg-ui-accent text-ui-accent-fg hover:bg-ui-accent/90 active:bg-ui-accent/80',
};

/**
 * A 44x44 button with only an icon. The required `label` is its accessible name.
 * `pressed` (true or false) makes it a toggle with `aria-pressed`; leave it unset for a plain button.
 */
@Component({
	selector: 'button[appUiIconButton], a[appUiIconButton]',
	standalone: true,
	imports: [UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classes()',
		'[attr.aria-label]': 'label()',
		'[attr.aria-pressed]': 'pressed() === undefined ? null : pressed() ? "true" : "false"',
		'[attr.disabled]': 'isButton && disabled() ? "" : null',
		'[attr.aria-disabled]': '!isButton && disabled() ? "true" : null',
	},
	template: `
		@if (icon(); as icon) {
			<app-ui-icon [icon]="icon" [size]="iconSize()" />
		}
		<ng-content />
	`,
})
export class UiIconButtonComponent {
	public readonly label = input.required<string>();
	public readonly icon = input<UiIcon>();
	public readonly iconSize = input<number>(22);
	public readonly variant = input<UiIconButtonVariant>('ghost');
	public readonly pressed = input<boolean | undefined>(undefined);
	public readonly disabled = input(false, { transform: booleanAttribute });

	protected readonly isButton = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
	protected readonly classes = computed(
		() =>
			'inline-flex size-11 shrink-0 items-center justify-center rounded-ui ui-focus motion-safe:transition-colors ' +
			'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ' +
			VARIANTS[this.variant()],
	);
}
