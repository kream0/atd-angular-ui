import { Directive } from '@angular/core';

/**
 * A passage of Arabic text inside a page in another language (a quotation, a name, a formula). `lang="ar"` lets
 * screen readers switch voice and the browser shape and break the text as Arabic; `dir="rtl"` lays it out right to
 * left in both UI directions; `font-arabic` is the Arabic stack from the Tailwind preset. A whole page in Arabic needs
 * none of this: `lang="ar" dir="rtl"` on `<html>` does it.
 */
@Directive({
	selector: '[appUiArabic]',
	standalone: true,
	host: { lang: 'ar', dir: 'rtl', class: 'font-arabic text-start leading-loose' },
})
export class UiArabicDirective {}
