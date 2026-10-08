import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiTextService } from '../core/ui-text';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_ALERT_CIRCLE } from '../icon/icons';

/**
 * A labelled form field: label, optional hint, the projected control (marked `appUiControl`) and an
 * error. It wires `for`, `id`, `aria-describedby`, `aria-invalid` and `required`, and writes "(obligatoire)" as text.
 */
@Component({
	selector: 'app-ui-field',
	standalone: true,
	imports: [UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		<label [attr.for]="controlId()" class="block text-sm font-medium text-ui-fg">
			{{ label() }}
			@if (required()) {
				<span class="font-normal text-ui-muted">{{ text.get('common.requiredMark', '(obligatoire)') }}</span>
			}
		</label>
		@if (hint()) {
			<p [id]="hintId" class="mt-1 text-sm text-ui-muted">{{ hint() }}</p>
		}
		<div class="mt-1.5">
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
export class UiFieldComponent {
	public readonly label = input.required<string>();
	public readonly hint = input<string>('');
	/** The error text. Set it only when the error should show (after a blur or a submit). */
	public readonly error = input<string>('');
	public readonly required = input(false, { transform: booleanAttribute });

	public readonly hintId = uiId('ui-field-hint');
	public readonly errorId = uiId('ui-field-error');
	private readonly generatedId = uiId('ui-field');
	private readonly ownId = signal<string | null>(null);
	public readonly controlId = computed(() => this.ownId() ?? this.generatedId);
	public readonly describedBy = computed(
		() => [this.hint() ? this.hintId : '', this.error() ? this.errorId : ''].filter(Boolean).join(' ') || null,
	);
	protected readonly alertIcon = ICON_ALERT_CIRCLE;
	protected readonly text = inject(UiTextService);

	/** Called by appUiControl when the control already has an id. */
	public useControlId(id: string): void {
		this.ownId.set(id);
	}
}
