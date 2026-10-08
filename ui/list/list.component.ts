import { ChangeDetectionStrategy, Component, Directive } from '@angular/core';

/** A real list with dividers. `role="list"` keeps the list semantics Safari drops on unstyled lists. */
@Directive({
	selector: 'ul[appUiList], ol[appUiList]',
	standalone: true,
	host: { role: 'list', class: 'divide-y divide-ui-line' },
})
export class UiListDirective {}

/**
 * A list row at least 56 px tall: `[appUiListLeading]`, `[appUiListTitle]`, `[appUiListMeta]`, `[appUiListTrailing]`.
 * The whole row is one link or button: mark the title link `appUiStretchedLink`. Secondary actions go in a menu
 * in the trailing slot (it sits above the stretched link).
 */
@Component({
	selector: 'li[appUiListItem]',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'relative flex min-h-14 items-center gap-3 px-4 py-2' },
	template: `
		<ng-content select="[appUiListLeading]" />
		<div class="min-w-0 flex-1">
			<ng-content select="[appUiListTitle]" />
			<ng-content select="[appUiListMeta]" />
			<ng-content />
		</div>
		<ng-content select="[appUiListTrailing]" />
	`,
})
export class UiListItemComponent {}

@Directive({ selector: '[appUiListLeading]', standalone: true, host: { class: 'shrink-0' } })
export class UiListLeadingDirective {}

@Directive({
	selector: '[appUiListTitle]',
	standalone: true,
	host: { class: 'block truncate font-medium text-ui-fg ui-focus' },
})
export class UiListTitleDirective {}

// Two lines at most, so a long date or place stays readable on a phone; a `flex flex-wrap` meta keeps its flex layout.
@Directive({ selector: '[appUiListMeta]', standalone: true, host: { class: 'line-clamp-2 text-sm text-ui-muted' } })
export class UiListMetaDirective {}

@Directive({
	selector: '[appUiListTrailing]',
	standalone: true,
	host: { class: 'relative z-10 flex shrink-0 items-center gap-1' },
})
export class UiListTrailingDirective {}
