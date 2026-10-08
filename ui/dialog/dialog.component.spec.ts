import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDialogComponent, UiDialogFooterDirective } from './dialog.component';

@Component({
	standalone: true,
	imports: [UiDialogComponent, UiDialogFooterDirective],
	template: `
		<button id="opener" type="button" (click)="open.set(true)">Ouvrir</button>
		<app-ui-dialog [(open)]="open" title="Nouvelle tâche" (closed)="closedWith = $event">
			<input id="titre" aria-label="Titre" />
			<div appUiDialogFooter><button type="button" (click)="open.set(false)">Enregistrer</button></div>
		</app-ui-dialog>
		<button id="danger-opener" type="button" (click)="confirm.set(true)">Supprimer</button>
		<app-ui-dialog [(open)]="confirm" title="Supprimer le projet ?" destructive>
			<p>Cette action est définitive.</p>
			<div appUiDialogFooter>
				<button id="cancel" type="button" data-autofocus (click)="confirm.set(false)">Annuler</button>
				<button type="button">Supprimer</button>
			</div>
		</app-ui-dialog>
		<button id="rich-opener" type="button" (click)="rich.set(true)">Programme</button>
		<app-ui-dialog [(open)]="rich" title="Thème du mois">
			<span appUiDialogTitle><strong>Thème</strong> du mois</span>
			<p>Programme du mois.</p>
		</app-ui-dialog>
	`,
})
class HostComponent {
	public readonly open = signal(false);
	public readonly confirm = signal(false);
	public readonly rich = signal(false);
	public closedWith: string | null = null;
}

describe('UiDialogComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let dialogs: HTMLDialogElement[];

	function settle(): void {
		fixture.detectChanges();
		TestBed.flushEffects();
		fixture.detectChanges();
	}

	function openFrom(id: string): void {
		const opener = fixture.nativeElement.querySelector(`#${id}`) as HTMLButtonElement;
		opener.focus();
		opener.click();
		settle();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		settle();
		dialogs = Array.from(fixture.nativeElement.querySelectorAll('dialog'));
	});

	afterEach(() => dialogs.forEach((dialog) => dialog.open && dialog.close()));

	it('opens as a native modal named by its title', () => {
		openFrom('opener');
		expect(dialogs[0].open).toBeTrue();
		expect(dialogs[0].matches(':modal')).toBeTrue();
		const titleId = dialogs[0].getAttribute('aria-labelledby')!;
		expect(document.getElementById(titleId)?.textContent).toBe('Nouvelle tâche');
	});

	// A markdown title keeps its marks in the heading, which still names the dialog.
	it('draws a title with marks from [appUiDialogTitle] instead of the title, once', () => {
		openFrom('rich-opener');
		const heading = document.getElementById(dialogs[2].getAttribute('aria-labelledby')!)!;
		expect(heading.tagName).toBe('H2');
		expect(heading.querySelector('strong')?.textContent).toBe('Thème');
		expect(heading.textContent!.trim()).toBe('Thème du mois');
		expect(dialogs[2].querySelector('p')!.textContent).toBe('Programme du mois.');
	});

	it('starts on the first field', () => {
		openFrom('opener');
		expect(document.activeElement?.id).toBe('titre');
	});

	it('a destructive dialog starts on "Annuler"', () => {
		openFrom('danger-opener');
		expect(document.activeElement?.id).toBe('cancel');
	});

	it('Esc closes it, reports "dismiss" and gives focus back to the opener', () => {
		openFrom('opener');
		const cancel = new Event('cancel', { cancelable: true });
		dialogs[0].dispatchEvent(cancel);
		settle();
		expect(cancel.defaultPrevented).toBeTrue();
		expect(dialogs[0].open).toBeFalse();
		expect(host.open()).toBeFalse();
		expect(host.closedWith).toBe('dismiss');
		expect(document.activeElement?.id).toBe('opener');
	});

	it('has a visible 44 px "Fermer" button that closes it', () => {
		openFrom('opener');
		const close = dialogs[0].querySelector('button[aria-label="Fermer"]') as HTMLButtonElement;
		const rect = close.getBoundingClientRect();
		expect(rect.width).toBeGreaterThanOrEqual(44);
		expect(rect.height).toBeGreaterThanOrEqual(44);
		close.click();
		settle();
		expect(dialogs[0].open).toBeFalse();
		expect(document.activeElement?.id).toBe('opener');
	});

	it('closing from the parent (model) also gives focus back', () => {
		openFrom('opener');
		(dialogs[0].querySelector('[appUiDialogFooter] button') as HTMLButtonElement).click();
		settle();
		expect(dialogs[0].open).toBeFalse();
		expect(document.activeElement?.id).toBe('opener');
	});

	it('another script closing it keeps "open" in step and reports "dismiss"', async () => {
		openFrom('opener');
		const closeEvent = new Promise((resolve) => dialogs[0].addEventListener('close', resolve, { once: true }));
		dialogs[0].close();
		await closeEvent;
		settle();
		expect(host.open()).toBeFalse();
		expect(host.closedWith).toBe('dismiss');
		expect(document.activeElement?.id).toBe('opener');
	});

	it('stays open when it opens again before the close event of the previous closing arrives', async () => {
		openFrom('opener');
		const closeEvent = new Promise((resolve) => dialogs[0].addEventListener('close', resolve, { once: true }));
		host.open.set(false);
		settle();
		host.open.set(true);
		settle();
		expect(dialogs[0].open).withContext('opened again').toBeTrue();
		await closeEvent;
		settle();
		expect(dialogs[0].open).withContext('after the late close event').toBeTrue();
		expect(host.open()).toBeTrue();
		expect(host.closedWith).toBeNull();
	});

	it('never cancels a press inside it, so a field takes focus and a select opens under the finger or the mouse', () => {
		openFrom('opener');
		for (const target of [fixture.nativeElement.querySelector('#titre') as HTMLElement, dialogs[0]]) {
			const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
			target.dispatchEvent(press);
			expect(press.defaultPrevented).withContext(target.tagName).toBeFalse();
		}
	});

	it('closes on a press and a click both on the backdrop, not on a press inside that ends on the backdrop', () => {
		const pressThenClick = (target: HTMLElement) => {
			target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
			dialogs[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			settle();
		};
		openFrom('opener');
		pressThenClick(fixture.nativeElement.querySelector('#titre'));
		expect(dialogs[0].open).toBeTrue();
		pressThenClick(dialogs[0]);
		expect(dialogs[0].open).toBeFalse();
		expect(host.closedWith).toBe('dismiss');
	});

	it('locks the page scroll while a modal is open', () => {
		openFrom('opener');
		expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
		dialogs[0].dispatchEvent(new Event('cancel', { cancelable: true }));
		settle();
		expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
	});
});
