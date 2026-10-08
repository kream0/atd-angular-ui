import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	model,
	OnDestroy,
	output,
	untracked,
	viewChild,
} from '@angular/core';
import { firstFieldIn } from '../core/focus';
import { uiId } from '../core/ui-id';
import { UiTextService } from '../core/ui-text';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { ICON_X } from '../icon/icons';

export type UiDialogMode = 'dialog' | 'sheet' | 'drawer';
/** Why the dialog closed: 'dismiss' for Esc, the backdrop and the close button; any other role from `close()`. */
export type UiDialogRole = string;

const MODES: Record<UiDialogMode, string> = {
	// Centred from `sm` up, a bottom sheet below.
	dialog:
		'mx-0 mb-0 mt-auto w-full max-w-none max-h-[85dvh] rounded-t-ui-lg sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-lg ' +
		'sm:rounded-ui-lg',
	sheet: 'mx-0 mb-0 mt-auto w-full max-w-none max-h-[85dvh] rounded-t-ui-lg sm:mx-auto sm:max-w-lg',
	// The side drawer opens on the start side (left in LTR, right in RTL).
	drawer: 'my-0 ms-0 me-auto h-dvh max-h-none w-[min(20rem,85vw)] max-w-none rounded-none',
};

/**
 * A modal dialog on native `<dialog>` + `showModal()`: top layer, inert background, focus kept
 * inside, Esc closes. Modes: centred dialog (a bottom sheet on phones), bottom sheet, start-side drawer. 16 px
 * corners, a deep shadow and the title in the display face.
 *
 * Initial focus: an element marked `data-autofocus` (put it on "Annuler" for a destructive action), else the first
 * field, else the close button; a `destructive` dialog never starts on a field or the confirm button. Focus goes
 * back to the opener on close. Footer actions go in `[appUiDialogFooter]`. A title with marks (a markdown title) goes in
 * `[appUiDialogTitle]`, drawn in the heading instead of `title`; its text stays the dialog's name.
 */
@Component({
	selector: 'app-ui-dialog',
	standalone: true,
	imports: [UiIconButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<dialog
			#dialog
			[attr.aria-labelledby]="titleId"
			[class]="dialogClasses()"
			(cancel)="onCancel($event)"
			(close)="onNativeClose()"
			(pointerdown)="onPointerDown($event, dialog)"
			(click)="onClick($event, dialog)"
		>
			<header class="flex shrink-0 items-start gap-2 border-b border-ui-line py-1.5 pe-1.5 ps-4">
				<h2 [id]="titleId" class="min-w-0 flex-1 text-balance py-2 font-display text-ui-section font-semibold">
					<ng-content select="[appUiDialogTitle]">{{ title() }}</ng-content>
				</h2>
				<button #closeButton appUiIconButton type="button" [label]="closeLabel() ?? text.get('common.close', 'Fermer')" [icon]="closeIcon" (click)="close()"></button>
			</header>
			<div class="min-h-0 flex-1 overflow-y-auto p-4">
				<ng-content />
			</div>
			<ng-content select="[appUiDialogFooter]" />
		</dialog>
	`,
})
export class UiDialogComponent implements OnDestroy {
	public readonly open = model(false);
	public readonly title = input.required<string>();
	public readonly mode = input<UiDialogMode>('dialog');
	/** A destructive confirmation: focus starts on `data-autofocus` ("Annuler") or the close button. */
	public readonly destructive = input(false, { transform: booleanAttribute });
	/** The close button's name; common.close (« Fermer ») when not given. */
	public readonly closeLabel = input<string>();
	public readonly closed = output<UiDialogRole>();

	protected readonly titleId = uiId('ui-dialog-title');
	protected readonly closeIcon = ICON_X;
	protected readonly text = inject(UiTextService);
	protected pointerDownOnBackdrop = false;
	protected readonly dialogClasses = computed(
		() =>
			'border-0 bg-ui-surface p-0 text-ui-fg shadow-ui-lg ring-1 ring-ui-line open:flex open:flex-col ' +
			'pb-[env(safe-area-inset-bottom)] ' +
			MODES[this.mode()],
	);

	private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
	private readonly closeButton = viewChild<string, ElementRef<HTMLButtonElement>>('closeButton', { read: ElementRef });
	private opener: HTMLElement | null = null;

	constructor() {
		effect(() => {
			const element = this.dialog()?.nativeElement;
			if (!element) return;
			const open = this.open();
			untracked(() => {
				if (open && !element.open) this.show(element);
				else if (!open && element.open) this.hide(element);
			});
		});
	}

	/** Closes the dialog and reports `role` through `closed`. */
	public close(role: UiDialogRole = 'dismiss'): void {
		const element = this.dialog()?.nativeElement;
		if (!this.open() && !element?.open) return;
		this.open.set(false);
		if (element?.open) this.hide(element);
		this.closed.emit(role);
	}

	ngOnDestroy(): void {
		const element = this.dialog()?.nativeElement;
		if (element?.open) this.hide(element);
	}

	protected onCancel(event: Event): void {
		event.preventDefault();
		this.close('dismiss');
	}

	/**
	 * Notes where a press starts. A method, never `pointerDownOnBackdrop = …` in the template: Angular cancels an event
	 * whose handler gives `false`, and a cancelled press inside the panel never focuses a field nor opens a select.
	 */
	protected onPointerDown(event: PointerEvent, element: HTMLDialogElement): void {
		this.pointerDownOnBackdrop = event.target === element;
	}

	protected onClick(event: MouseEvent, element: HTMLDialogElement): void {
		// Only a press and release both on the backdrop: a text selection dragged out of the panel does not close it.
		if (event.target === element && this.pointerDownOnBackdrop) this.close('dismiss');
		this.pointerDownOnBackdrop = false;
	}

	/** A `<form method="dialog">` or another script closed the element: keep `open` in step. */
	protected onNativeClose(): void {
		// The event comes with the next frame: when the dialog has opened again since, it is stale and closes nothing.
		if (this.open() && !this.dialog()?.nativeElement.open) {
			this.open.set(false);
			this.restoreFocus();
			this.closed.emit(this.dialog()?.nativeElement.returnValue || 'dismiss');
		}
	}

	private show(element: HTMLDialogElement): void {
		const active = document.activeElement;
		this.opener = active instanceof HTMLElement && active !== document.body ? active : null;
		element.showModal();
		this.initialFocus(element)?.focus();
	}

	private hide(element: HTMLDialogElement): void {
		element.close();
		this.restoreFocus();
	}

	private restoreFocus(): void {
		const opener = this.opener;
		this.opener = null;
		if (opener?.isConnected) opener.focus();
	}

	private initialFocus(element: HTMLDialogElement): HTMLElement | null {
		const marked = element.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
		if (marked) return marked;
		const close = this.closeButton()?.nativeElement ?? null;
		if (this.destructive()) return close;
		return firstFieldIn(element) ?? close;
	}
}

/** The action row of a dialog: buttons at the end, wrapping on narrow screens. */
@Directive({
	selector: '[appUiDialogFooter]',
	standalone: true,
	host: { class: 'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-ui-line px-4 py-3' },
})
export class UiDialogFooterDirective {}
