import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiTextService } from '../core/ui-text';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_ALERT_CIRCLE } from '../icon/icons';

/** A group of radios or checkboxes named by its `legend`, with an optional hint and error. */
@Component({
	selector: 'fieldset[appUiFieldset]',
	standalone: true,
	imports: [UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'block min-w-0 border-0 p-0',
		'[attr.aria-describedby]': 'describedBy()',
	},
	template: `
		<legend class="text-sm font-medium text-ui-fg">
			{{ legend() }}
			@if (required()) {
				<span class="font-normal text-ui-muted">{{ text.get('common.requiredMark', '(obligatoire)') }}</span>
			}
		</legend>
		@if (hint()) {
			<p [id]="hintId" class="mt-1 text-sm text-ui-muted">{{ hint() }}</p>
		}
		<div class="mt-1">
			<ng-content />
		</div>
		@if (error()) {
			<p [id]="errorId" class="mt-1.5 flex items-start gap-1.5 text-sm text-ui-danger-ink">
				<app-ui-icon [icon]="alertIcon" [size]="18" />
				<span>{{ error() }}</span>
			</p>
		}
	`,
})
export class UiFieldsetComponent {
	public readonly legend = input.required<string>();
	public readonly hint = input<string>('');
	public readonly error = input<string>('');
	public readonly required = input(false, { transform: booleanAttribute });

	protected readonly hintId = uiId('ui-fieldset-hint');
	protected readonly errorId = uiId('ui-fieldset-error');
	protected readonly alertIcon = ICON_ALERT_CIRCLE;
	protected readonly text = inject(UiTextService);
	protected readonly describedBy = computed(
		() => [this.hint() ? this.hintId : '', this.error() ? this.errorId : ''].filter(Boolean).join(' ') || null,
	);
}
