import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The top bar: a `header` landmark, sticky, 56 px plus the top safe area. Slots
 * `[appUiAppBarLeading]` (back or menu icon button) and `[appUiAppBarActions]` (at most one action on phones).
 */
@Component({
	selector: 'app-ui-app-bar',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'sticky top-0 z-40 block' },
	template: `
		<header
			class="box-content flex h-14 items-center gap-1 border-b border-ui-line bg-ui-surface px-1 pt-[env(safe-area-inset-top)]
				text-ui-fg"
		>
			<ng-content select="[appUiAppBarLeading]" />
			<span class="min-w-0 flex-1 truncate px-2 text-lg font-semibold">{{ title() }}</span>
			<ng-content select="[appUiAppBarActions]" />
		</header>
	`,
})
export class UiAppBarComponent {
	public readonly title = input<string>('');
}
