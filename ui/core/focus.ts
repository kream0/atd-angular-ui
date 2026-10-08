const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type=hidden])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

const FIELDS = 'input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled])';

function visible(el: HTMLElement): boolean {
	return el.getClientRects().length > 0;
}

/** Keyboard-focusable descendants of `root`, in DOM order, skipping hidden ones. */
export function focusableIn(root: ParentNode): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible);
}

/** The first visible form field in `root`, if any. */
export function firstFieldIn(root: ParentNode): HTMLElement | null {
	return Array.from(root.querySelectorAll<HTMLElement>(FIELDS)).find(visible) ?? null;
}
