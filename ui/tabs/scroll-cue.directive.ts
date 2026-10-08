import { DestroyRef, Directive, ElementRef, Injector, NgZone, afterNextRender, effect, inject, input } from '@angular/core';

/** The widest fade in px (2rem in styles.scss): an item scrolled into view is kept clear of it. */
const CUE = 32;

/**
 * The scroll cue of a tab row or a markdown table, on the element that scrolls sideways. While the row
 * is wider than its box, each edge with more to scroll fades out (classes `ui-more-start` and `ui-more-end`, drawn by
 * styles.scss; logical, so in RTL the start edge is on the right), over at most 2rem and less as that edge comes near.
 * The active item is scrolled into view, clear of the fade, on load, when the selection changes and when an item takes
 * the focus: smoothly, unless the user asks for reduced motion. With no active item (a table), the scroll stays where
 * the reader puts it. Only the row scrolls, never the page. Scroll and resize are handled outside Angular: they only
 * touch two classes and two custom properties.
 */
@Directive({
	selector: '[appUiScrollCue]',
	standalone: true,
	host: { class: 'ui-scroll-cue', '(focusin)': 'onFocusin($event)' },
})
export class UiScrollCueDirective {
	/** The selected value: when it changes, the active item is scrolled into view. */
	public readonly selected = input.required<unknown>({ alias: 'appUiScrollCue' });
	/** The items: a new list is observed and measured again. */
	public readonly items = input.required<readonly unknown[]>({ alias: 'uiScrollCueItems' });
	/** Matches the active item or an element inside it; none for a table, which has no active item. */
	public readonly active = input<string | null>(null, { alias: 'uiScrollCueActive' });

	private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
	private readonly injector = inject(Injector);
	private readonly zone = inject(NgZone);
	private readonly resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.measure());
	private loaded = false;

	constructor() {
		const measure = () => this.measure();
		this.zone.runOutsideAngular(() => this.host.addEventListener('scroll', measure, { passive: true }));
		inject(DestroyRef).onDestroy(() => {
			this.host.removeEventListener('scroll', measure);
			this.resize?.disconnect();
		});
		effect(() => {
			this.selected();
			this.items();
			// The first render jumps straight to the active item; later changes glide.
			const smooth = this.loaded;
			this.loaded = true;
			afterNextRender(
				() => {
					this.observe();
					const active = this.active();
					this.reveal(active ? this.itemOf(this.host.querySelector(active)) : null, smooth);
				},
				{ injector: this.injector },
			);
		});
	}

	protected onFocusin(event: FocusEvent): void {
		if (this.active()) this.reveal(this.itemOf(event.target as Element | null), true);
	}

	/** The row and its items: a label or a font that changes width changes the cue. */
	private observe(): void {
		const resize = this.resize;
		if (!resize) return;
		this.zone.runOutsideAngular(() => {
			resize.disconnect();
			resize.observe(this.host);
			for (const item of Array.from(this.host.children)) resize.observe(item);
		});
	}

	private measure(): void {
		const row = this.host;
		const max = row.scrollWidth - row.clientWidth;
		// scrollLeft runs from 0 to max in LTR and from 0 to -max in RTL: its size is the distance from the start.
		const start = max > 1 ? Math.min(Math.abs(row.scrollLeft), max) : 0;
		const end = max > 1 ? max - start : 0;
		row.classList.toggle('ui-more-start', start > 1);
		row.classList.toggle('ui-more-end', end > 1);
		row.style.setProperty('--ui-cue-start', `${Math.min(start, CUE)}px`);
		row.style.setProperty('--ui-cue-end', `${Math.min(end, CUE)}px`);
	}

	/** Scrolls the row (physical deltas, so the same in RTL) until `item` sits clear of both fades. */
	private reveal(item: HTMLElement | null, smooth: boolean): void {
		const row = this.host;
		if (item && row.scrollWidth - row.clientWidth > 1) {
			const box = row.getBoundingClientRect();
			const rect = item.getBoundingClientRect();
			let delta = 0;
			if (rect.left < box.left + CUE) delta = rect.left - box.left - CUE;
			else if (rect.right > box.right - CUE) delta = rect.right - box.right + CUE;
			if (Math.abs(delta) >= 1) {
				const reduce = row.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
				row.scrollBy({ left: delta, behavior: smooth && !reduce ? 'smooth' : 'instant' });
			}
		}
		this.measure();
	}

	/** The row's child that holds `node` (the tab, or the label around a radio). */
	private itemOf(node: Element | null): HTMLElement | null {
		while (node && node.parentElement !== this.host) node = node.parentElement;
		return node as HTMLElement | null;
	}
}
