let counter = 0;

/** A page-unique id for aria wiring (`ui-field-3`). Ids are never reused, so two instances never collide. */
export function uiId(prefix: string): string {
	counter += 1;
	return `${prefix}-${counter}`;
}
