import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiTextService } from '../core/ui-text';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_CHEVRON_LEFT } from '../icon/set/chevron-left';
import { UiMarkdownComponent } from '../markdown/markdown.component';

/**
 * The page's title block: the only `h1` of the page, in the display face, an optional back link with
 * a text label and `[appUiPageActions]` that wrap below the title on phones. `[appUiPageEnd]` holds small controls
 * (a close icon button, a badge) that stay at the end of the title's first line at every width: the title and the
 * subtitle wrap beside them instead.
 */
@Component({
	selector: 'app-ui-page-header',
	standalone: true,
	imports: [RouterLink, UiIconComponent, UiMarkdownComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		@if (back(); as back) {
			<a
				[routerLink]="back"
				class="-ms-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-ui pe-2 text-sm font-medium text-ui-accent-ink
					ui-focus"
			>
				<app-ui-icon [icon]="backIcon" [size]="20" />
				{{ backLabel() ?? text.get('common.back', 'Retour') }}
			</a>
		}
		<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
			<div class="flex min-w-0 grow items-start gap-4">
				<div class="min-w-0 grow">
					<h1 class="text-balance font-display text-ui-title font-semibold sm:text-3xl">
						@if (markdownTitle()) {
							<app-ui-markdown [text]="title()" inline />
						} @else {
							<ng-container>{{ title() }}</ng-container>
						}
					</h1>
					@if (subtitle()) {
						<p class="mt-1 text-sm text-ui-muted">
							@if (markdownSubtitle()) {
								<app-ui-markdown [text]="subtitle()" inline />
							} @else {
								<ng-container>{{ subtitle() }}</ng-container>
							}
						</p>
					}
				</div>
				<!-- A 44 px icon button centred on the title's first line (32 px, 36 px from sm), without making it taller. -->
				<div class="-my-1.5 flex shrink-0 items-center gap-2 empty:hidden sm:-my-1">
					<ng-content select="[appUiPageEnd]" />
				</div>
			</div>
			<div class="flex flex-wrap gap-2 empty:hidden">
				<ng-content select="[appUiPageActions]" />
			</div>
		</div>
	`,
})
export class UiPageHeaderComponent {
	public readonly title = input.required<string>();
	/** The title is a text typed in the markdown subset (see ../markdown): its marks show, its signs do not. */
	public readonly markdownTitle = input(false, { transform: booleanAttribute });
	public readonly subtitle = input<string>('');
	/** The subtitle is a text typed in the markdown subset (a description): its inline marks show. */
	public readonly markdownSubtitle = input(false, { transform: booleanAttribute });
	/** Where the back link goes (a router link); no back link when empty. */
	public readonly back = input<string | unknown[] | null>(null);
	/** common.back (« Retour ») when not given. */
	public readonly backLabel = input<string>();

	protected readonly backIcon = ICON_CHEVRON_LEFT;
	protected readonly text = inject(UiTextService);
}
