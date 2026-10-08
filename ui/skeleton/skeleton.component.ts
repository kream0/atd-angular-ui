import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';

export type UiSkeletonKind = 'lines' | 'list' | 'card';

/**
 * Placeholder blocks while content loads: `aria-busy` with a hidden "Chargement…". Size the rows
 * like the final content so nothing shifts when it arrives.
 */
@Component({
	selector: 'app-ui-skeleton',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block', 'aria-busy': 'true' },
	template: `
		<span class="sr-only">{{ label() ?? text.get('common.loading', 'Chargement…') }}</span>
		<div aria-hidden="true" class="flex flex-col" [class.gap-3]="kind() !== 'list'">
			@for (row of rowList(); track $index) {
				@switch (kind()) {
					@case ('list') {
						<div class="flex min-h-14 items-center gap-3 px-4 py-2">
							<div class="size-10 shrink-0 rounded-full bg-ui-line motion-safe:animate-pulse"></div>
							<div class="flex flex-1 flex-col gap-2">
								<div class="h-4 w-2/3 rounded-ui-sm bg-ui-line motion-safe:animate-pulse"></div>
								<div class="h-3 w-1/3 rounded-ui-sm bg-ui-line motion-safe:animate-pulse"></div>
							</div>
						</div>
					}
					@case ('card') {
						<div class="h-28 rounded-ui-lg bg-ui-line motion-safe:animate-pulse"></div>
					}
					@default {
						<div class="h-4 rounded-ui-sm bg-ui-line motion-safe:animate-pulse" [class]="$last && !$first ? 'w-2/3' : ''"></div>
					}
				}
			}
		</div>
	`,
})
export class UiSkeletonComponent {
	public readonly kind = input<UiSkeletonKind>('lines');
	public readonly rows = input<number>(3);
	/** common.loading (« Chargement… ») when not given. */
	public readonly label = input<string>();

	protected readonly text = inject(UiTextService);
	protected readonly rowList = computed(() => Array.from({ length: Math.max(1, this.rows()) }));
}
