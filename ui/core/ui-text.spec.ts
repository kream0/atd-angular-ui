import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UiButtonComponent } from '../button/button.component';
import { UiFieldComponent } from '../field/field.component';
import { provideUiTextSource, uiTextDictionary, UiTextService } from './ui-text';

@Component({
	standalone: true,
	imports: [UiButtonComponent, UiFieldComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button appUiButton loading>Enregistrer</button>
		<app-ui-field label="Nom" required><input /></app-ui-field>
	`,
})
class HostComponent {}

const TEXTS: Record<string, Record<string, string>> = {
	fr: { 'common.loading': 'Chargement...', 'common.stepOf': 'Étape {{current}} sur {{total}}' },
	ar: { 'common.loading': 'جاري التحميل...', 'common.requiredMark': '(مطلوب)' },
};

describe('UiTextService', () => {
	it('gives the French fallback when the app provides no text source', () => {
		expect(TestBed.inject(UiTextService).get('common.loading', 'Chargement…')).toBe('Chargement…');
	});

	it('renders the primitives with no text source at all, in French, without throwing', () => {
		let page: HTMLElement | undefined;
		expect(() => {
			const fixture = TestBed.createComponent(HostComponent);
			fixture.detectChanges();
			page = fixture.nativeElement as HTMLElement;
		}).not.toThrow();
		expect(page?.querySelector('button .sr-only')?.textContent).toBe('Chargement…');
		expect(page?.querySelector('label span')?.textContent?.trim()).toBe('(obligatoire)');
	});

	describe('with a text source', () => {
		const lang = signal<'fr' | 'ar'>('fr');

		beforeEach(() => {
			lang.set('fr');
			TestBed.configureTestingModule({ providers: [provideUiTextSource(() => uiTextDictionary(() => TEXTS[lang()]))] });
		});

		it('translates the key, with its params, and falls back on a key the language lacks', () => {
			const text = TestBed.inject(UiTextService);
			expect(text.get('common.stepOf', 'Repli 2/4', { current: 2, total: 4 })).toBe('Étape 2 sur 4');
			expect(text.get('common.absent', 'Repli')).toBe('Repli');
		});

		it('follows the language in the primitives, which are OnPush', () => {
			const fixture = TestBed.createComponent(HostComponent);
			fixture.detectChanges();
			const page = fixture.nativeElement as HTMLElement;
			expect(page.querySelector('button .sr-only')?.textContent).toBe('Chargement...');
			expect(page.querySelector('label span')?.textContent?.trim()).withContext('fr lacks it: the fallback').toBe('(obligatoire)');

			lang.set('ar');
			fixture.detectChanges();
			expect(page.querySelector('button .sr-only')?.textContent).toBe('جاري التحميل...');
			expect(page.querySelector('label span')?.textContent?.trim()).toBe('(مطلوب)');
		});
	});
});
