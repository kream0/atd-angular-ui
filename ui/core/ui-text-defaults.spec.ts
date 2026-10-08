import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UiBannerComponent } from '../banner/banner.component';
import { UiBottomNavigationComponent } from '../bottom-navigation/bottom-navigation.component';
import { UiDialogComponent } from '../dialog/dialog.component';
import { UiPageHeaderComponent } from '../page-header/page-header.component';
import { UiProgressComponent } from '../progress/progress.component';
import { UiSkeletonComponent } from '../skeleton/skeleton.component';
import { UiSpinnerComponent } from '../spinner/spinner.component';
import { UiToastComponent } from '../toast/toast.component';
import { provideUiTextSource, uiTextDictionary } from './ui-text';

/** Every primitive with words of its own (UiTextService): closing, going back, loading, counting. */
@Component({
	standalone: true,
	imports: [
		UiBannerComponent,
		UiBottomNavigationComponent,
		UiDialogComponent,
		UiPageHeaderComponent,
		UiProgressComponent,
		UiSkeletonComponent,
		UiSpinnerComponent,
		UiToastComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-ui-banner dismissible>Texte</app-ui-banner>
		<app-ui-toast kind="error" message="Message" />
		<app-ui-dialog title="Titre"><p>Contenu</p></app-ui-dialog>
		<app-ui-page-header title="Page" back="/" />
		<app-ui-spinner />
		<app-ui-skeleton />
		<app-bottom-navigation [items]="[]" />
		<app-ui-progress label="Progression" [value]="3" [max]="8" [countLabel]="true" />
	`,
})
class HostComponent {}

@Component({
	standalone: true,
	imports: [UiBannerComponent, UiToastComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<app-ui-banner dismissible dismissLabel="Masquer">Texte</app-ui-banner>
		<app-ui-toast kind="error" message="Message" closeLabel="Annuler" />
	`,
})
class LabelledHostComponent {}

/** The texts the primitives show by themselves, read from the page. */
function texts(page: HTMLElement) {
	return {
		banner: page.querySelector('app-ui-banner button')?.getAttribute('aria-label'),
		toast: page.querySelector('app-ui-toast button')?.getAttribute('aria-label'),
		dialog: page.querySelector('app-ui-dialog header button')?.getAttribute('aria-label'),
		back: page.querySelector('app-ui-page-header a')?.textContent?.trim(),
		spinner: page.querySelector('app-ui-spinner .sr-only')?.textContent,
		skeleton: page.querySelector('app-ui-skeleton .sr-only')?.textContent,
		nav: page.querySelector('app-bottom-navigation nav')?.getAttribute('aria-label'),
		count: page.querySelector('app-ui-progress .tabular-nums')?.textContent,
	};
}

describe('UI primitives: their own words', () => {
	it('are the French fallbacks when the app provides no text source', () => {
		TestBed.configureTestingModule({ providers: [provideRouter([])] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		expect(texts(fixture.nativeElement)).toEqual({
			banner: 'Fermer',
			toast: 'Fermer',
			dialog: 'Fermer',
			back: 'Retour',
			spinner: 'Chargement…',
			skeleton: 'Chargement…',
			nav: 'Navigation principale',
			count: '3 sur 8',
		});
	});

	describe('with a text source', () => {
		const dictionaries: Record<string, Record<string, string>> = {
			fr: {
				'common.close': 'Fermer',
				'common.back': 'Retour',
				'common.loading': 'Chargement...',
				'common.countOf': '{{value}} sur {{max}}',
				'shell.navLabel': 'Navigation principale',
			},
			ar: {
				'common.close': 'إغلاق',
				'common.back': 'رجوع',
				'common.loading': 'جاري التحميل...',
				'common.countOf': '{{value}} من {{max}}',
				'shell.navLabel': 'التنقل الرئيسي',
			},
		};
		const lang = signal<'fr' | 'ar'>('fr');

		beforeEach(() => {
			lang.set('fr');
			TestBed.configureTestingModule({
				providers: [provideRouter([]), provideUiTextSource(() => uiTextDictionary(() => dictionaries[lang()]))],
			});
		});

		it('are the Arabic texts in Arabic, and follow a change of language (OnPush)', () => {
			const fixture = TestBed.createComponent(HostComponent);
			fixture.detectChanges();
			const page: HTMLElement = fixture.nativeElement;
			expect(texts(page).spinner).toBe('Chargement...');
			expect(texts(page).count).toBe('3 sur 8');

			lang.set('ar');
			fixture.detectChanges();
			expect(texts(page)).toEqual({
				banner: 'إغلاق',
				toast: 'إغلاق',
				dialog: 'إغلاق',
				back: 'رجوع',
				spinner: 'جاري التحميل...',
				skeleton: 'جاري التحميل...',
				nav: 'التنقل الرئيسي',
				count: '3 من 8',
			});
		});

		it('give way to a label the page passes', () => {
			lang.set('ar');
			const fixture = TestBed.createComponent(LabelledHostComponent);
			fixture.detectChanges();
			const page: HTMLElement = fixture.nativeElement;
			expect(page.querySelector('app-ui-banner button')?.getAttribute('aria-label')).toBe('Masquer');
			expect(page.querySelector('app-ui-toast button')?.getAttribute('aria-label')).toBe('Annuler');
		});
	});
});
