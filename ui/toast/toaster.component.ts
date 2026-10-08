import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, output } from '@angular/core';
import { UiStickyActionsService } from './sticky-actions.directive';
import { UI_TOAST_DEFAULT_MS, UiToastComponent, UiToastTone } from './toast.component';

export interface UiToastItem {
	readonly id: string;
	readonly kind: UiToastTone;
	readonly title?: string;
	readonly message: string;
	readonly duration?: number;
	readonly actionLabel?: string;
}

/**
 * Where toasts appear: two live regions that always exist, a polite one for information and a
 * `role="alert"` one for errors, above the phone tab bar and the home indicator. Placed once in the app shell.
 *
 * A toast that comes or goes is never a layout shift (CLS): the box of toasts is laid out downwards from the bottom
 * edge of the viewport and raised by its own height with a transform, so it keeps its place in layout and the toasts
 * already on screen either keep their place or move with that transform only. The host is a fixed layer the size of
 * the viewport that lets the pointer through, and the box sits in it, absolute: a box fixed to the viewport itself
 * moved its toasts in layout on any page longer than the screen, and Chrome counted those moves (0.0136 at 390 × 844
 * for an error coming above a toast), though the transform kept them in place on screen.
 *
 * While a modal `<dialog>` is open, everything outside it is inert (no pointer, no focus, out of the accessibility
 * tree), a popover shown after it included. So the toaster moves into the newest open modal dialog and comes back
 * when it closes: toasts stay on top, clickable, reachable with Tab and announced. Without `:modal` it stays put.
 * In a dialog it sits at the top of the screen (`data-modal`), over the app bar the backdrop covers, and centred from
 * `sm` up: a toast never covers the action row of a dialog or a bottom sheet, nor the close button at the end of its
 * header when it is 85dvh tall (at 390 × 844 under the app bar it did, and at the end side over a centred dialog).
 * There it is laid out downwards with no transform: a toast arriving after the others keeps them in place, one
 * leaving moves those below it (two toasts at once over a dialog).
 *
 * Outside a dialog, while a page form shows an action row stuck to the bottom of the screen (`appUiStickyActions`),
 * where the toasts would cover its buttons, it sits under the app bar (`data-sticky-actions`), laid out the same way.
 */
@Component({
	selector: 'app-ui-toaster',
	standalone: true,
	imports: [UiToastComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'group pointer-events-none fixed inset-0 z-[60]' },
	template: `
		<div
			class="absolute inset-x-0 top-full flex flex-col items-center gap-2 px-4 -translate-y-full
				pb-[calc(5rem+env(safe-area-inset-bottom))] sm:items-end sm:px-6 lg:pb-6
				group-data-[modal]:top-[env(safe-area-inset-top)] group-data-[modal]:translate-y-0 group-data-[modal]:pt-2
				sm:group-data-[modal]:items-center
				group-data-[sticky-actions]:top-[calc(3.5rem+env(safe-area-inset-top))] group-data-[sticky-actions]:translate-y-0
				group-data-[sticky-actions]:pt-2"
		>
			<div role="alert" aria-atomic="false" class="flex w-full max-w-sm flex-col gap-2">
				@for (toast of errors(); track toast.id) {
					<app-ui-toast
						[kind]="toast.kind"
						[title]="toast.title ?? ''"
						[message]="toast.message"
						[duration]="toast.duration ?? defaultDuration"
						[actionLabel]="toast.actionLabel ?? ''"
						(closed)="dismissed.emit(toast.id)"
						(action)="action.emit(toast.id)"
					/>
				}
			</div>
			<div role="status" aria-live="polite" aria-atomic="false" class="flex w-full max-w-sm flex-col gap-2">
				@for (toast of others(); track toast.id) {
					<app-ui-toast
						[kind]="toast.kind"
						[title]="toast.title ?? ''"
						[message]="toast.message"
						[duration]="toast.duration ?? defaultDuration"
						[actionLabel]="toast.actionLabel ?? ''"
						(closed)="dismissed.emit(toast.id)"
						(action)="action.emit(toast.id)"
					/>
				}
			</div>
		</div>
	`,
})
export class UiToasterComponent {
	public readonly toasts = input.required<readonly UiToastItem[]>();
	public readonly dismissed = output<string>();
	public readonly action = output<string>();

	protected readonly defaultDuration = UI_TOAST_DEFAULT_MS;
	protected readonly errors = computed(() => this.toasts().filter((toast) => toast.kind === 'error'));
	protected readonly others = computed(() => this.toasts().filter((toast) => toast.kind !== 'error'));

	private readonly host: HTMLElement = inject(ElementRef).nativeElement;
	private readonly stickyActions = inject(UiStickyActionsService).shown;
	/** Open modal dialogs, newest last. */
	private modals: HTMLDialogElement[] = [];
	/** Holds the toaster's place in the page while it sits in a dialog. */
	private home: Comment | null = null;

	constructor() {
		effect(() => this.place());
		if (typeof MutationObserver === 'undefined') return;
		const observer = new MutationObserver((records) => this.onDialogsChanged(records));
		observer.observe(this.host.ownerDocument, { attributes: true, attributeFilter: ['open'], subtree: true });
		inject(DestroyRef).onDestroy(() => {
			observer.disconnect();
			this.home?.remove();
		});
	}

	private onDialogsChanged(records: MutationRecord[]): void {
		for (const { target } of records) {
			if (!(target instanceof HTMLDialogElement)) continue;
			this.modals = this.modals.filter((dialog) => dialog !== target);
			if (isModal(target)) this.modals.push(target);
		}
		// A dialog taken out of the page while open is no longer in the top layer.
		this.modals = this.modals.filter(isModal);
		this.moveInto(this.modals.at(-1) ?? null);
	}

	private moveInto(dialog: HTMLDialogElement | null): void {
		if (dialog) {
			if (this.host.parentNode === dialog) return;
			if (!this.home) {
				if (!this.host.parentNode) return;
				this.home = this.host.ownerDocument.createComment('app-ui-toaster');
				this.host.before(this.home);
			}
			dialog.append(this.host);
			this.place();
		} else if (this.home) {
			this.home.replaceWith(this.host);
			this.home = null;
			this.place();
		}
	}

	private place(): void {
		// Read first: the effect that calls this keeps following the sticky rows while the toaster is in a dialog.
		const stickyActions = this.stickyActions();
		this.host.toggleAttribute('data-modal', this.home !== null);
		this.host.toggleAttribute('data-sticky-actions', this.home === null && stickyActions);
	}
}

function isModal(dialog: HTMLDialogElement): boolean {
	try {
		return dialog.isConnected && dialog.open && dialog.matches(':modal');
	} catch {
		return false;
	}
}
