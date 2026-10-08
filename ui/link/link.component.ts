import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';

/**
 * A text link: accent ink and underlined, so colour is not the only signal.
 * `external` opens a new tab with `rel="noopener noreferrer"` and says so to screen readers.
 */
@Component({
	selector: 'a[appUiLink]',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class:
			'rounded-ui-sm text-ui-accent-ink underline decoration-1 underline-offset-[3px] hover:decoration-2 ui-focus',
		'[attr.target]': 'external() ? "_blank" : null',
		'[attr.rel]': 'external() ? "noopener noreferrer" : null',
	},
	template: `<ng-content />@if (external()) {<span class="sr-only"> {{ text.get('common.newTab', '(nouvel onglet)') }}</span>}`,
})
export class UiLinkComponent {
	public readonly external = input(false, { transform: booleanAttribute });

	protected readonly text = inject(UiTextService);
}
