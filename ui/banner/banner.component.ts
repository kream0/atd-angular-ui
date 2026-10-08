import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { UiTextService } from '../core/ui-text';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_ALERT_CIRCLE, ICON_CHECK_CIRCLE, ICON_INFO_CIRCLE, ICON_WARNING, ICON_X } from '../icon/icons';

export type UiBannerTone = 'info' | 'success' | 'warning' | 'danger';

const TONES = {
	info: { fill: 'bg-ui-accent-soft ring-ui-accent-ink/20', ink: 'text-ui-accent-ink', icon: ICON_INFO_CIRCLE },
	success: { fill: 'bg-ui-success-ink/10 ring-ui-success-ink/25', ink: 'text-ui-success-ink', icon: ICON_CHECK_CIRCLE },
	warning: { fill: 'bg-ui-warning-ink/10 ring-ui-warning-ink/30', ink: 'text-ui-warning-ink', icon: ICON_WARNING },
	danger: { fill: 'bg-ui-danger-soft ring-ui-danger-ink/25', ink: 'text-ui-danger-ink', icon: ICON_ALERT_CIRCLE },
} as const;

/**
 * An inline message box: a soft fill of its tone, the icon and the title in the tone's ink, the text in
 * the body colour. `announce` (`role="alert"`) only for a banner that appears after a user action; a banner present
 * on load has no role.
 */
@Component({
	selector: 'app-ui-banner',
	standalone: true,
	imports: [UiIconButtonComponent, UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classes()',
		'[attr.role]': 'announce() ? "alert" : null',
	},
	template: `
		<span class="mt-0.5 flex" [class]="look().ink"><app-ui-icon [icon]="look().icon" [size]="22" /></span>
		<div class="min-w-0 flex-1">
			@if (title()) {
				<p class="font-semibold" [class]="look().ink">{{ title() }}</p>
			}
			<div class="text-sm">
				<ng-content />
			</div>
		</div>
		@if (dismissible()) {
			<button
				appUiIconButton
				type="button"
				class="-my-2.5 -me-2.5"
				[label]="dismissLabel() ?? text.get('common.close', 'Fermer')"
				[icon]="closeIcon"
				[iconSize]="20"
				(click)="dismissed.emit()"
			></button>
		}
	`,
})
export class UiBannerComponent {
	public readonly tone = input<UiBannerTone>('info');
	public readonly title = input<string>('');
	public readonly dismissible = input(false, { transform: booleanAttribute });
	public readonly announce = input(false, { transform: booleanAttribute });
	/** The close button's name; common.close (« Fermer ») when not given. */
	public readonly dismissLabel = input<string>();
	public readonly dismissed = output<void>();

	protected readonly closeIcon = ICON_X;
	protected readonly text = inject(UiTextService);
	protected readonly look = computed(() => TONES[this.tone()]);
	protected readonly classes = computed(
		() =>
			'flex items-start gap-3 rounded-ui-lg p-4 text-ui-fg ring-1 ring-inset ' + TONES[this.tone()].fill,
	);
}
