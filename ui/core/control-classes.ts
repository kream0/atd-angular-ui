/**
 * Shared look of the text controls (input, textarea, select). The `focus:ring-0` and `focus:border-*` classes undo
 * the @tailwindcss/forms base focus ring; `.ui-focus` draws the visible focus instead.
 */
export const UI_CONTROL_CLASSES =
	'block w-full min-h-11 rounded-ui border border-ui-line-strong bg-ui-surface py-2 text-base text-ui-fg ' +
	'placeholder:text-ui-muted hover:border-ui-fg/60 focus:border-ui-focus focus:ring-0 focus:ring-offset-0 ui-focus ' +
	'aria-[invalid=true]:border-ui-danger-ink disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Native checkbox and radio: the browser draws the mark in a colour that contrasts with `accent-color`.
 * `text-transparent`, `border-0` and `checked:bg-none` switch off the @tailwindcss/forms custom drawing.
 */
export const UI_CHOICE_CLASSES =
	'size-5 shrink-0 cursor-pointer appearance-auto border-0 text-transparent accent-ui-accent-ink checked:bg-none ' +
	'ui-focus focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50';
