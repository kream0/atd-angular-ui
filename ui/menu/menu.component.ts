import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChildren,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { uiId } from '../core/ui-id';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { UiIcon } from '../icon/ui-icon';
import { ICON_DOTS_VERTICAL } from '../icon/icons';

/** Below this width a menu with more than SHEET_MIN_ITEMS items opens as a bottom sheet (Tailwind `sm`). */
const SHEET_QUERY = '(max-width: 639.98px)';
const SHEET_MIN_ITEMS = 6;
const ITEM_HEIGHT = 44;
/** A list moved back inside the screen keeps the page's side gutter at the screen's edge. */
const SCREEN_GUTTER = 16;

/**
 * Where the room under a trigger ends: the top of the phone tab bar (`app-bottom-navigation`, fixed at the bottom),
 * or the bottom of the screen when there is no bar or it is hidden (wide screens).
 */
function screenBottom(): number {
	const bar = document.querySelector('app-bottom-navigation')?.getBoundingClientRect();
	return bar && bar.height > 0 ? Math.min(window.innerHeight, bar.top) : window.innerHeight;
}

/** True when a list placed at the trigger's inline end crosses the screen's inline-start edge. */
function leavesScreenAtStart(panel: HTMLElement): boolean {
	const rect = panel.getBoundingClientRect();
	return getComputedStyle(panel).direction === 'rtl' ? rect.right > document.documentElement.clientWidth : rect.left < 0;
}

/**
 * How far, in px, a list placed at the trigger's inline start crosses the screen's inline-end edge, gutter included;
 * 0 when it stays inside. A long list under a trigger in the middle of a phone screen crosses one edge or the other.
 */
function overflowAtEnd(panel: HTMLElement, anchor: HTMLElement): number {
	const width = panel.getBoundingClientRect().width;
	const box = anchor.getBoundingClientRect();
	const over = getComputedStyle(panel).direction === 'rtl'
		? SCREEN_GUTTER - (box.right - width)
		: box.left + width - (document.documentElement.clientWidth - SCREEN_GUTTER);
	return Math.max(0, Math.ceil(over));
}

/** One action of an `app-ui-menu`. Choosing it closes the menu and puts focus back on the trigger first. */
@Directive({
	selector: 'button[appUiMenuItem], a[appUiMenuItem]',
	standalone: true,
	host: {
		role: 'menuitem',
		tabindex: '-1',
		'[class]': 'classes()',
		'(click)': 'menu.close(true)',
	},
})
export class UiMenuItemDirective {
	public readonly tone = input<'default' | 'danger'>('default');

	// Declared before the menu (which queries it); the menu class exists by the time an item is created.
	protected readonly menu = inject(UiMenuComponent);
	// An item marked `aria-current` (the page or view in use) is emerald, bold and tinted; hover and focus get a
	// lighter tint.
	protected readonly classes = computed(
		() =>
			'flex min-h-11 w-full items-center gap-3 rounded-ui px-3 text-start text-sm ' +
			'ui-focus focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ' +
			(this.tone() === 'danger'
				? 'text-ui-danger-ink hover:bg-ui-danger-soft focus:bg-ui-danger-soft'
				: 'text-ui-fg hover:bg-ui-accent-soft/60 focus:bg-ui-accent-soft/60 aria-[current]:bg-ui-accent-soft ' +
					'aria-[current]:font-semibold aria-[current]:text-ui-accent-ink'),
	);
}

/**
 * An actions menu: an icon button with `aria-haspopup="menu"` opens a `role="menu"` of
 * `[appUiMenuItem]` buttons or links. Arrow keys, Home and End move, Esc closes and gives focus back to the
 * trigger, Tab closes, a click outside closes. The list opens under the trigger at its inline end (above it when
 * there is no room below, the phone tab bar not counted as room, at its inline start when it would leave the screen,
 * e.g. actions at the start of a phone page header, moved back inside the screen when it would then cross the other
 * edge); on phones a menu of more than 5 items opens as a bottom sheet.
 */
@Component({
	selector: 'app-ui-menu',
	standalone: true,
	imports: [NgTemplateOutlet, UiIconButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'relative inline-block',
		'(document:pointerdown)': 'onDocumentPointerDown($event)',
	},
	template: `
		<button
			#trigger
			appUiIconButton
			type="button"
			[id]="triggerId"
			[label]="label()"
			[icon]="icon()"
			aria-haspopup="menu"
			[attr.aria-expanded]="open() ? 'true' : 'false'"
			[attr.aria-controls]="open() ? menuId : null"
			(click)="toggle()"
			(keydown)="onTriggerKeydown($event)"
		></button>
		@if (open()) {
			@if (sheet()) {
				<dialog
					#sheetDialog
					[attr.aria-labelledby]="triggerId"
					class="mx-0 mb-0 mt-auto w-full max-w-none max-h-[85dvh] overflow-y-auto rounded-t-ui-lg border-0 bg-ui-surface
						p-0 pb-[env(safe-area-inset-bottom)] text-ui-fg shadow-ui-lg"
					(cancel)="$event.preventDefault(); close(true)"
					(click)="$event.target === sheetDialog && close(true)"
				>
					<div #panel role="menu" [id]="menuId" [attr.aria-labelledby]="triggerId" class="p-2" (keydown)="onMenuKeydown($event)">
						<ng-container [ngTemplateOutlet]="items" />
					</div>
				</dialog>
			} @else {
				<div
					#panel
					role="menu"
					[id]="menuId"
					[attr.aria-labelledby]="triggerId"
					class="absolute z-50 w-max min-w-48 max-w-[min(20rem,calc(100vw-2rem))] rounded-ui-lg bg-ui-surface p-1
						text-ui-fg shadow-ui-lg ring-1 ring-ui-line"
					[class.end-0]="!atStart()"
					[class.start-0]="atStart()"
					[style.margin-inline-start.px]="pullBack() ? -pullBack() : null"
					[class.top-full]="!above()"
					[class.mt-1]="!above()"
					[class.bottom-full]="above()"
					[class.mb-1]="above()"
					(keydown)="onMenuKeydown($event)"
				>
					<ng-container [ngTemplateOutlet]="items" />
				</div>
			}
		}
		<ng-template #items><ng-content /></ng-template>
	`,
})
export class UiMenuComponent {
	/** The trigger's accessible name, e.g. "Plus d'actions". */
	public readonly label = input.required<string>();
	public readonly icon = input<UiIcon>(ICON_DOTS_VERTICAL);

	protected readonly open = signal(false);
	protected readonly sheet = signal(false);
	protected readonly above = signal(false);
	protected readonly atStart = signal(false);
	/** How far a list at the trigger's inline start moves back toward the inline start to stay inside the screen (px). */
	protected readonly pullBack = signal(0);
	protected readonly triggerId = uiId('ui-menu-trigger');
	protected readonly menuId = uiId('ui-menu');

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly trigger = viewChild.required<string, ElementRef<HTMLButtonElement>>('trigger', { read: ElementRef });
	private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
	private readonly sheetDialog = viewChild<ElementRef<HTMLDialogElement>>('sheetDialog');
	private readonly menuItems = contentChildren(UiMenuItemDirective, { descendants: true });
	private readonly itemCount = computed(() => this.menuItems().length);
	/** Which item gets focus once the list is rendered: 'first' or 'last'. */
	private pendingFocus: 'first' | 'last' | null = null;

	constructor() {
		effect(() => {
			const panel = this.panel()?.nativeElement;
			if (!panel) return;
			untracked(() => {
				const dialog = this.sheetDialog()?.nativeElement;
				if (dialog && !dialog.open) dialog.showModal();
				if (!dialog) {
					const atStart = leavesScreenAtStart(panel);
					this.atStart.set(atStart);
					this.pullBack.set(atStart ? overflowAtEnd(panel, this.host.nativeElement) : 0);
				}
				const target = this.pendingFocus;
				this.pendingFocus = null;
				if (target) this.focusItem(target === 'first' ? 0 : this.items().length - 1);
			});
		});
	}

	public openMenu(focus: 'first' | 'last' = 'first'): void {
		if (this.open()) return;
		const rect = this.trigger().nativeElement.getBoundingClientRect();
		const height = this.itemCount() * ITEM_HEIGHT + 8;
		const roomBelow = screenBottom() - rect.bottom;
		this.above.set(roomBelow < height && rect.top > roomBelow);
		this.atStart.set(false);
		this.pullBack.set(0);
		this.sheet.set(this.itemCount() >= SHEET_MIN_ITEMS && window.matchMedia(SHEET_QUERY).matches);
		this.pendingFocus = focus;
		this.open.set(true);
	}

	/** Closes the menu; `returnFocus` puts focus back on the trigger (keyboard, item choice). */
	public close(returnFocus: boolean): void {
		if (!this.open()) return;
		this.sheetDialog()?.nativeElement.close();
		this.open.set(false);
		if (returnFocus) this.trigger().nativeElement.focus();
	}

	protected toggle(): void {
		if (this.open()) this.close(true);
		else this.openMenu('first');
	}

	protected onTriggerKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			this.openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
		}
	}

	protected onMenuKeydown(event: KeyboardEvent): void {
		const items = this.items();
		const current = items.indexOf(document.activeElement as HTMLElement);
		switch (event.key) {
			case 'ArrowDown':
				this.focusItem((current + 1) % items.length);
				break;
			case 'ArrowUp':
				this.focusItem((current - 1 + items.length) % items.length);
				break;
			case 'Home':
				this.focusItem(0);
				break;
			case 'End':
				this.focusItem(items.length - 1);
				break;
			case 'Escape':
				this.close(true);
				break;
			case 'Tab':
				// Focus goes back to the trigger, then the browser moves it on to the next element.
				this.close(true);
				return;
			default:
				return;
		}
		event.preventDefault();
		event.stopPropagation();
	}

	protected onDocumentPointerDown(event: PointerEvent): void {
		if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close(false);
	}

	private items(): HTMLElement[] {
		const panel = this.panel()?.nativeElement;
		if (!panel) return [];
		return Array.from(panel.querySelectorAll<HTMLElement>('[role=menuitem]')).filter(
			(item) => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true',
		);
	}

	private focusItem(index: number): void {
		this.items()[index]?.focus();
	}
}
