import { computed, DestroyRef, Directive, inject, Injectable, signal } from '@angular/core';

/** The sticky action rows on the page (`appUiStickyActions`): while there is one, toasts sit under the app bar. */
@Injectable({ providedIn: 'root' })
export class UiStickyActionsService {
	private readonly count = signal(0);
	public readonly shown = computed(() => this.count() > 0);

	/** Counts one row in and returns what counts it out. */
	public add(): () => void {
		this.count.update((n) => n + 1);
		return () => this.count.update((n) => n - 1);
	}
}

/**
 * The action row of a page form that sticks to the bottom of the screen (above the phone tab bar, at the bottom edge
 * from `lg`), where the toaster shows its toasts. While one is on the page, the toaster moves under the app bar, so
 * an error toast that stays until closed never covers Annuler or Enregistrer.
 */
@Directive({
	selector: '[appUiStickyActions]',
	standalone: true,
})
export class UiStickyActionsDirective {
	constructor() {
		inject(DestroyRef).onDestroy(inject(UiStickyActionsService).add());
	}
}
