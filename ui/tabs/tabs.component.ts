import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	input,
	model,
	viewChild,
	viewChildren,
} from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiScrollCueDirective } from './scroll-cue.directive';

export interface UiTab {
	readonly id: string;
	readonly label: string;
}

/**
 * Tabs: `tablist` with roving tabindex and automatic activation. Arrow keys follow the visual order
 * (swapped in RTL), Home and End jump to the ends. The row scrolls sideways on phones, with a fade on the edge that has
 * more tabs and the selected tab kept in view (UiScrollCueDirective); the line under the row sits on a wrapper, so the
 * fade leaves it whole. A page that pins the row styles that wrapper (`[&>:has(>[role=tablist])]`), so its background
 * is not faded either. The single projected panel shows the content of `selected`.
 */
@Component({
	selector: 'app-ui-tabs',
	standalone: true,
	imports: [UiScrollCueDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	template: `
		<div class="border-b border-ui-line">
			<div
				#tablist
				role="tablist"
				[attr.aria-label]="label()"
				class="flex overflow-x-auto"
				[appUiScrollCue]="selected()"
				[uiScrollCueItems]="tabs()"
				uiScrollCueActive="[aria-selected=true]"
				(keydown)="onKeydown($event)"
			>
				@for (tab of tabs(); track tab.id) {
					<button
						#tabButton
						type="button"
						role="tab"
						[id]="tabId(tab.id)"
						[attr.aria-selected]="tab.id === selected() ? 'true' : 'false'"
						[attr.aria-controls]="tab.id === selected() ? panelId : null"
						[tabIndex]="tab.id === selected() ? 0 : -1"
						class="relative min-h-11 shrink-0 whitespace-nowrap rounded-t-ui px-4 text-sm font-medium text-ui-muted ui-focus
							focus-visible:-outline-offset-2 hover:bg-ui-accent-soft/50 hover:text-ui-fg aria-selected:font-semibold
							aria-selected:text-ui-accent-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px]
							after:rounded-full aria-selected:after:bg-ui-accent-ink"
						(click)="select(tab.id)"
					>
						{{ tab.label }}
					</button>
				}
			</div>
		</div>
		<div
			role="tabpanel"
			[id]="panelId"
			[attr.aria-labelledby]="tabId(selected())"
			tabindex="0"
			class="rounded-ui pt-4 ui-focus"
		>
			<ng-content />
		</div>
	`,
})
export class UiTabsComponent {
	public readonly tabs = input.required<readonly UiTab[]>();
	public readonly selected = model.required<string>();
	/** Names the tab list for screen readers. */
	public readonly label = input.required<string>();

	protected readonly panelId = uiId('ui-tabpanel');
	private readonly prefix = uiId('ui-tab');
	private readonly tablist = viewChild.required<ElementRef<HTMLElement>>('tablist');
	private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

	protected tabId(id: string): string {
		return `${this.prefix}-${id}`;
	}

	protected select(id: string): void {
		this.selected.set(id);
	}

	protected onKeydown(event: KeyboardEvent): void {
		const tabs = this.tabs();
		const current = tabs.findIndex((tab) => tab.id === this.selected());
		const rtl = getComputedStyle(this.tablist().nativeElement).direction === 'rtl';
		let next: number;
		switch (event.key) {
			case 'ArrowRight':
				next = current + (rtl ? -1 : 1);
				break;
			case 'ArrowLeft':
				next = current + (rtl ? 1 : -1);
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = tabs.length - 1;
				break;
			default:
				return;
		}
		event.preventDefault();
		next = (next + tabs.length) % tabs.length;
		this.selected.set(tabs[next].id);
		this.buttons()[next]?.nativeElement.focus();
	}
}
