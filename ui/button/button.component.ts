import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';
import { UiSpinnerComponent } from '../spinner/spinner.component';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'md' | 'sm';

const BASE =
	'inline-flex min-h-11 items-center justify-center gap-2 rounded-ui font-semibold text-center ui-focus ' +
	'motion-safe:transition-colors ' +
	'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTS: Record<UiButtonVariant, string> = {
	primary: 'bg-ui-accent text-ui-accent-fg hover:bg-ui-accent/90 active:bg-ui-accent/80',
	secondary:
		'bg-ui-surface text-ui-accent-ink ring-1 ring-inset ring-ui-line-strong hover:bg-ui-accent-soft ' +
		'active:bg-ui-accent-soft/70',
	ghost: 'bg-transparent text-ui-accent-ink hover:bg-ui-accent-soft active:bg-ui-accent-soft/70',
	danger: 'bg-ui-danger text-ui-accent-fg hover:bg-ui-danger/90 active:bg-ui-danger/80',
};

const SIZES: Record<UiButtonSize, string> = {
	md: 'px-5 text-base',
	sm: 'px-3 text-sm',
};

/**
 * A native button or link styled as a button, sentence case. Both sizes are at least 44 px tall.
 * `loading` keeps the label, adds a spinner, `aria-busy` and disables the button.
 */
@Component({
	selector: 'button[appUiButton], a[appUiButton]',
	standalone: true,
	imports: [UiSpinnerComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classes()',
		'[attr.disabled]': 'isButton && (disabled() || loading()) ? "" : null',
		'[attr.aria-disabled]': '!isButton && (disabled() || loading()) ? "true" : null',
		'[attr.tabindex]': '!isButton && (disabled() || loading()) ? "-1" : null',
		'[attr.aria-busy]': 'loading() ? "true" : null',
	},
	template: `
		@if (loading()) {
			<app-ui-spinner decorative [size]="18" />
			<span class="sr-only">{{ text.get('common.loading', 'Chargement…') }}</span>
		}
		<ng-content />
	`,
})
export class UiButtonComponent {
	public readonly variant = input<UiButtonVariant>('primary');
	public readonly size = input<UiButtonSize>('md');
	public readonly loading = input(false, { transform: booleanAttribute });
	public readonly disabled = input(false, { transform: booleanAttribute });

	protected readonly text = inject(UiTextService);
	protected readonly isButton = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
	protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`);
}
