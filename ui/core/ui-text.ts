import { inject, Injectable, InjectionToken, Provider } from '@angular/core';

export type UiTextParams = Record<string, string | number>;

/**
 * Where the primitives' own words come from: the app's translations. `translate` gives the text of `key` with its
 * params filled in, or null when the app has none. Read signals in it (the language, the loaded translations): the
 * primitives call it in templates and computeds, so they follow a change of language, OnPush included.
 */
export interface UiTextSource {
	translate(key: string, params?: UiTextParams): string | null | undefined;
}

export const UI_TEXT_SOURCE = new InjectionToken<UiTextSource>('UI_TEXT_SOURCE');

/** Provides the primitives' text source. `factory` runs in an injection context, so it may `inject()` a translate service. */
export function provideUiTextSource(factory: () => UiTextSource): Provider {
	return { provide: UI_TEXT_SOURCE, useFactory: factory };
}

/**
 * A text source from flat dictionaries (`{ 'common.close': 'Close' }`), `{{name}}` placeholders filled from the params.
 * `texts` is read on every call: pass a signal or a computed to switch languages.
 */
export function uiTextDictionary(texts: () => Readonly<Record<string, string>>): UiTextSource {
	return {
		translate: (key, params) => {
			const text = texts()[key];
			if (text === undefined) return null;
			return params ? text.replace(/\{\{\s*(\w+)\s*\}\}/g, (sign, name: string) => (name in params ? String(params[name]) : sign)) : text;
		},
	};
}

/**
 * The primitives' own few words: "(obligatoire)", "Chargement…" and the like. `get(key, fallback)` gives the app's
 * text for `key` (UI_TEXT_SOURCE), or the French `fallback` where there is none: no source provided, or a language
 * that lacks the key. Read in a template or a computed, it follows the language as the source's signals change.
 */
@Injectable({ providedIn: 'root' })
export class UiTextService {
	private readonly source = inject(UI_TEXT_SOURCE, { optional: true });

	public get(key: string, fallback: string, params?: UiTextParams): string {
		const text: unknown = this.source?.translate(key, params);
		return typeof text === 'string' && text !== key ? text : fallback;
	}
}
