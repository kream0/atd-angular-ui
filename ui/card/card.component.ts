import { ChangeDetectionStrategy, Component, Directive } from '@angular/core';

/**
 * A card: surface, 16 px corners, a hairline ring and a soft shadow. Optional `[appUiCardHeader]` and `[appUiCardFooter]`
 * slots. A clickable card has exactly one link marked `appUiStretchedLink`; other controls inside need `relative`.
 */
@Component({
	selector: 'app-ui-card',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'relative block rounded-ui-lg bg-ui-surface text-ui-fg shadow-ui-sm ring-1 ring-ui-line' },
	template: `
		<ng-content select="[appUiCardHeader]" />
		<div class="p-4">
			<ng-content />
		</div>
		<ng-content select="[appUiCardFooter]" />
	`,
})
export class UiCardComponent {}

@Directive({
	selector: '[appUiCardHeader]',
	standalone: true,
	host: { class: 'flex items-center gap-3 border-b border-ui-line px-4 py-3' },
})
export class UiCardHeaderDirective {}

@Directive({
	selector: '[appUiCardFooter]',
	standalone: true,
	host: { class: 'flex flex-wrap items-center justify-end gap-2 border-t border-ui-line px-4 py-3' },
})
export class UiCardFooterDirective {}

/**
 * Stretches a link or button over its nearest `relative` ancestor (a card or a list row) with `::after`, so the
 * whole block is one target without nesting interactive elements. The focus ring is drawn on the stretched area.
 */
@Directive({
	selector: '[appUiStretchedLink]',
	standalone: true,
	host: {
		class:
			'after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none ' +
			'focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 ' +
			'focus-visible:after:outline-ui-focus',
	},
})
export class UiStretchedLinkDirective {}
