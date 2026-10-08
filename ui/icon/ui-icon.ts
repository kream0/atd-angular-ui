/**
 * One icon for app-ui-icon. `paths` are SVG path `d` strings, compile-time constants only (never user data).
 * `fill`: a solid icon (filled with currentColor, no stroke). `mirror`: a directional icon, flipped in RTL.
 */
export interface UiIcon {
	readonly name: string;
	readonly paths: readonly string[];
	readonly fill?: boolean;
	readonly evenodd?: boolean;
	readonly viewBox?: string;
	readonly mirror?: boolean;
}
