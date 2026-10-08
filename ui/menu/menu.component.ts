import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChildren,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	NgZone,
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
/** The space between the trigger and its list (px). */
const GAP = 4;

/**
 * Where the room under a trigger ends: the top of the phone tab bar (`app-bottom-navigation`, fixed at the bottom),
 * or the bottom of the screen when there is no bar or it is hidden (wide screens).
 */
function screenBottom(): number {
	const bar = document.querySelector('app-bottom-navigation')?.getBoundingClientRect();
	return bar && bar.height > 0 ? Math.min(window.innerHeight, bar.top) : window.innerHeight;
}

/** False once the element is wholly off the screen, e.g. scrolled away. */
function onScreen(element: HTMLElement): boolean {
	const box = element.getBoundingClientRect();
	const width = document.documentElement.clientWidth;
	return box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < width;
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
 *
 * The list opens in the browser's top layer: a manual popover, fixed and placed from the trigger's box, so no
 * container's overflow, transform or stacking order can hide it, inside a modal dialog too. It stays in the menu's DOM:
 * content projection, focus order, the click-outside test and change detection are unchanged. It follows its trigger
 * when anything scrolls or the screen is resized, once per frame, and closes when the trigger leaves the screen. A
 * browser without popovers still gets the fixed list. The bottom sheet is a modal dialog, already in the top layer.
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
				<!-- inset, margin, border and overflow reset the browser's popover styles -->
				<div
					#panel
					role="menu"
					popover="manual"
					[id]="menuId"
					[attr.aria-labelledby]="triggerId"
					class="fixed inset-auto z-50 m-0 w-max min-w-48 max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-ui-lg
						border-0 bg-ui-surface p-1 text-ui-fg shadow-ui-lg ring-1 ring-ui-line"
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
	protected readonly triggerId = uiId('ui-menu-trigger');
	protected readonly menuId = uiId('ui-menu');

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly zone = inject(NgZone);
	private readonly trigger = viewChild.required<string, ElementRef<HTMLButtonElement>>('trigger', { read: ElementRef });
	private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
	private readonly sheetDialog = viewChild<ElementRef<HTMLDialogElement>>('sheetDialog');
	private readonly menuItems = contentChildren(UiMenuItemDirective, { descendants: true });
	private readonly itemCount = computed(() => this.menuItems().length);
	/** Which item gets focus once the list is rendered: 'first' or 'last'. */
	private pendingFocus: 'first' | 'last' | null = null;
	/** Whether the list opens above the trigger, chosen on opening and kept while it follows the trigger. */
	private above = false;
	/** Places the open list again on the next frame after a scroll or a resize; null while no list follows. */
	private follow: (() => void) | null = null;
	private frame = 0;

	constructor() {
		effect(() => {
			const panel = this.panel()?.nativeElement;
			if (!panel) return;
			untracked(() => {
				const dialog = this.sheetDialog()?.nativeElement;
				if (dialog && !dialog.open) dialog.showModal();
				if (!dialog) {
					// A popover is measured once shown (hidden, it is not rendered).
					if (typeof panel.showPopover === 'function' && !panel.matches(':popover-open')) panel.showPopover();
					this.place(panel);
					this.startFollowing(panel);
				}
				const target = this.pendingFocus;
				this.pendingFocus = null;
				if (target) this.focusItem(target === 'first' ? 0 : this.items().length - 1);
			});
		});
		inject(DestroyRef).onDestroy(() => this.stopFollowing());
	}

	public openMenu(focus: 'first' | 'last' = 'first'): void {
		if (this.open()) return;
		const rect = this.trigger().nativeElement.getBoundingClientRect();
		const height = this.itemCount() * ITEM_HEIGHT + 8;
		const roomBelow = screenBottom() - rect.bottom;
		this.above = roomBelow < height && rect.top > roomBelow;
		this.sheet.set(this.itemCount() >= SHEET_MIN_ITEMS && window.matchMedia(SHEET_QUERY).matches);
		this.pendingFocus = focus;
		this.open.set(true);
	}

	/** Closes the menu; `returnFocus` puts focus back on the trigger (keyboard, item choice). */
	public close(returnFocus: boolean): void {
		if (!this.open()) return;
		this.stopFollowing();
		this.sheetDialog()?.nativeElement.close();
		// Hidden at once, before the list leaves the DOM: Tab then moves on from the trigger, past the list.
		const panel = this.panel()?.nativeElement;
		if (panel && typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) panel.hidePopover();
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

	/**
	 * Puts the list next to the trigger (the menu's box), in screen coordinates: under it or above it as chosen on
	 * opening, at its inline end, or at its inline start when the end would leave the screen, moved back inside the
	 * screen's gutter when it would then cross the other edge. It is never taller than the room on its side.
	 */
	private place(panel: HTMLElement): void {
		const box = this.host.nativeElement.getBoundingClientRect();
		const room = this.above ? box.top - 2 * GAP : screenBottom() - box.bottom - 2 * GAP;
		panel.style.maxHeight = `${Math.max(room, ITEM_HEIGHT + 8)}px`;
		const { width, height } = panel.getBoundingClientRect();
		const screenWidth = document.documentElement.clientWidth;
		const rtl = getComputedStyle(panel).direction === 'rtl';
		let left = rtl ? box.left : box.right - width;
		if (rtl ? left + width > screenWidth : left < 0) {
			left = rtl
				? box.right - width + Math.max(0, Math.ceil(SCREEN_GUTTER - (box.right - width)))
				: box.left - Math.max(0, Math.ceil(box.left + width - (screenWidth - SCREEN_GUTTER)));
		}
		panel.style.left = `${left}px`;
		panel.style.top = `${this.above ? box.top - GAP - height : box.bottom + GAP}px`;
	}

	/** Scrolls anywhere (caught on the way down) and resizes move the list with its trigger, outside Angular. */
	private startFollowing(panel: HTMLElement): void {
		this.stopFollowing();
		const follow = (): void => {
			if (this.frame) return;
			this.frame = requestAnimationFrame(() => {
				this.frame = 0;
				if (onScreen(this.host.nativeElement)) this.place(panel);
				else this.zone.run(() => this.leave(panel));
			});
		};
		this.follow = follow;
		this.zone.runOutsideAngular(() => {
			window.addEventListener('scroll', follow, { capture: true, passive: true });
			window.addEventListener('resize', follow, { passive: true });
		});
	}

	private stopFollowing(): void {
		cancelAnimationFrame(this.frame);
		this.frame = 0;
		if (!this.follow) return;
		window.removeEventListener('scroll', this.follow, { capture: true });
		window.removeEventListener('resize', this.follow);
		this.follow = null;
	}

	/** The trigger has left the screen: the list closes, and focus inside it goes back to the trigger, unscrolled. */
	private leave(panel: HTMLElement): void {
		const focused = panel.contains(document.activeElement);
		this.close(false);
		if (focused) this.trigger().nativeElement.focus({ preventScroll: true });
	}
}
