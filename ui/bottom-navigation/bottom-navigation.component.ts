import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { UiTextService } from '../core/ui-text';
import { UiIcon } from '../icon/ui-icon';
import { UiIconComponent } from '../icon/icon.component';

export interface UiBottomNavItem {
	readonly label: string;
	readonly path: string;
	readonly icon: UiIcon;
	/** Active only on the exact path (for a home item on `/`). */
	readonly exact?: boolean;
}

// Query parameters, matrix parameters and fragments never change which tab is current.
const MATCH_EXACT: IsActiveMatchOptions = { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' };
const MATCH_SUBSET: IsActiveMatchOptions = { ...MATCH_EXACT, paths: 'subset' };

/**
 * The phone tab bar: 3-5 items with an icon and a visible label, `aria-current="page"` on the
 * active one (emerald label in bold, a pale emerald pill behind the icon), 56 px plus the bottom safe area, hidden
 * at `lg` and up. The element name is kept for the print CSS.
 */
@Component({
	selector: 'app-bottom-navigation',
	standalone: true,
	imports: [RouterLink, RouterLinkActive, UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'fixed inset-x-0 bottom-0 z-40 block lg:hidden' },
	template: `
		<nav
			[attr.aria-label]="label() ?? text.get('shell.navLabel', 'Navigation principale')"
			class="border-t border-ui-line bg-ui-surface pb-[env(safe-area-inset-bottom)] text-ui-fg"
		>
			<ul class="flex">
				@for (item of items(); track item.path) {
					<li class="min-w-0 flex-1">
						<a
							[routerLink]="item.path"
							routerLinkActive
							ariaCurrentWhenActive="page"
							[routerLinkActiveOptions]="item.exact ? matchExact : matchSubset"
							class="group flex h-14 flex-col items-center justify-center gap-0.5 text-sm leading-tight text-ui-muted
								ui-focus focus-visible:-outline-offset-2 hover:text-ui-fg aria-[current=page]:font-semibold
								aria-[current=page]:text-ui-accent-ink"
						>
							<span
								class="rounded-full px-5 py-0.5 group-hover:bg-ui-accent-soft/60 group-aria-[current=page]:bg-ui-accent-soft
									motion-safe:transition-colors"
							>
								<app-ui-icon [icon]="item.icon" [size]="22" />
							</span>
							<span class="max-w-full truncate px-1">{{ item.label }}</span>
						</a>
					</li>
				}
			</ul>
		</nav>
	`,
})
export class UiBottomNavigationComponent {
	public readonly items = input.required<readonly UiBottomNavItem[]>();
	/** shell.navLabel (« Navigation principale ») when not given. */
	public readonly label = input<string>();

	protected readonly text = inject(UiTextService);
	protected readonly matchExact = MATCH_EXACT;
	protected readonly matchSubset = MATCH_SUBSET;
}
