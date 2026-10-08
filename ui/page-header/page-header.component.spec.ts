import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { ICON_X } from '../icon/icons';
import { UiPageHeaderComponent } from './page-header.component';

@Component({
	standalone: true,
	imports: [UiPageHeaderComponent],
	template: `
		<app-ui-page-header title="Tâches" subtitle="12 tâches" back="/projets">
			<button appUiPageActions type="button">Ajouter</button>
		</app-ui-page-header>
	`,
})
class HostComponent {}

@Component({
	standalone: true,
	imports: [UiPageHeaderComponent, UiIconButtonComponent],
	template: `
		<app-ui-page-header
			title="Mise à jour des horaires d'ouverture"
			subtitle="Ajustez les horaires d'ouverture et les activités s'adapteront automatiquement"
		>
			<button appUiPageEnd appUiIconButton type="button" label="Annuler et revenir" [icon]="close"></button>
			<button appUiPageActions type="button" class="w-64">Ajouter</button>
		</app-ui-page-header>
	`,
})
class EndHostComponent {
	protected readonly close = ICON_X;
}

@Component({
	standalone: true,
	imports: [UiPageHeaderComponent],
	template: `
		<app-ui-page-header id="marked" title="Le chapitre *Intro*" subtitle="Une équipe **soudée**" markdownTitle markdownSubtitle />
		<app-ui-page-header id="plain" title="*Tâches*" subtitle="**12** tâches" />
	`,
})
class MarkdownHostComponent {}

describe('UiPageHeaderComponent', () => {
	it('has one h1, a back link with a text label (44 px), and the actions', () => {
		TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement.querySelector('app-ui-page-header');
		const headings = element.querySelectorAll('h1');
		expect(headings.length).toBe(1);
		expect(headings[0].textContent).toBe('Tâches');
		const back = element.querySelector('a')!;
		expect(back.textContent?.trim()).toBe('Retour');
		expect(back.getAttribute('href')).toBe('/projets');
		expect(back.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		expect(element.querySelector('button')?.textContent).toBe('Ajouter');
		expect(element.textContent).toContain('12 tâches');
	});

	it('shows a typed title and subtitle with their marks, and any other text as it is', () => {
		TestBed.configureTestingModule({ imports: [MarkdownHostComponent], providers: [provideRouter([])] });
		const fixture = TestBed.createComponent(MarkdownHostComponent);
		fixture.detectChanges();
		const marked: HTMLElement = fixture.nativeElement.querySelector('#marked');
		expect(marked.querySelector('h1 em')!.textContent).toBe('Intro');
		expect(marked.querySelector('p strong')!.textContent).toBe('soudée');
		expect(marked.textContent).not.toMatch(/\*/);
		const plain: HTMLElement = fixture.nativeElement.querySelector('#plain');
		expect(plain.querySelector('em, strong')).toBeNull();
		expect(plain.querySelector('h1')!.textContent).toBe('*Tâches*');
		expect(plain.querySelector('p')!.textContent!.trim()).toBe('**12** tâches');
	});

	// A phone's content width (390 px less the 16 px gutters).
	it('keeps [appUiPageEnd] at the end of the first line, the title wrapping beside it, in LTR and RTL', () => {
		TestBed.configureTestingModule({ imports: [EndHostComponent], providers: [provideRouter([])] });
		const fixture = TestBed.createComponent(EndHostComponent);
		fixture.detectChanges();
		const host: HTMLElement = fixture.nativeElement;
		host.style.display = 'block';
		host.style.width = '358px';
		const header = host.querySelector('app-ui-page-header')!;
		const h1 = header.querySelector('h1')!;
		const end = header.querySelector<HTMLElement>('[appUiPageEnd]')!;
		const action = header.querySelector<HTMLElement>('[appUiPageActions]')!;
		const box = (e: Element) => e.getBoundingClientRect();
		const line = parseFloat(getComputedStyle(h1).lineHeight);

		for (const dir of ['ltr', 'rtl']) {
			host.setAttribute('dir', dir);
			const title = box(h1);
			const button = box(end);
			expect(title.height).withContext(dir).toBeGreaterThan(line * 1.5);
			expect(Math.abs(button.top + button.height / 2 - (title.top + line / 2))).withContext(dir).toBeLessThanOrEqual(1);
			expect(dir === 'ltr' ? box(host).right - button.right : button.left - box(host).left).withContext(dir).toBeCloseTo(0, 0);
			expect(dir === 'ltr' ? button.left - title.right : title.left - button.right).withContext(dir).toBeGreaterThanOrEqual(16);
			expect(box(action).top).withContext(dir).toBeGreaterThanOrEqual(box(header.querySelector('p')!).bottom);
			expect(header.scrollWidth).withContext(dir).toBeLessThanOrEqual(header.clientWidth);
		}
	});
});
