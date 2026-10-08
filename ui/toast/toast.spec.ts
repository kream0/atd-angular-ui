import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { UiDialogComponent, UiDialogFooterDirective, UiDialogMode } from '../dialog';
import { UiStickyActionsDirective } from './sticky-actions.directive';
import { UiToasterComponent, UiToastItem } from './toaster.component';

@Component({
	standalone: true,
	imports: [UiToasterComponent],
	template: `<app-ui-toaster [toasts]="toasts()" (dismissed)="dismiss($event)" (action)="actions.push($event)" />`,
})
class HostComponent {
	public readonly toasts = signal<UiToastItem[]>([]);
	public readonly actions: string[] = [];

	public dismiss(id: string): void {
		this.toasts.update((list) => list.filter((toast) => toast.id !== id));
	}
}

describe('UiToasterComponent and UiToastComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;

	const alertRegion = (): HTMLElement => fixture.nativeElement.querySelector('[role=alert]');
	const statusRegion = (): HTMLElement => fixture.nativeElement.querySelector('[role=status]');

	function show(...toasts: UiToastItem[]): void {
		host.toasts.set(toasts);
		fixture.detectChanges();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => show());

	it('keeps both live regions in the page, even empty', () => {
		expect(statusRegion().getAttribute('aria-live')).toBe('polite');
		expect(statusRegion().getAttribute('aria-atomic')).toBe('false');
		expect(alertRegion()).not.toBeNull();
		expect(alertRegion().children.length).toBe(0);
	});

	it('announces errors as alerts and the rest politely, in text', () => {
		show({ id: 'a', kind: 'success', message: 'Tâche enregistrée.' }, { id: 'b', kind: 'error', message: 'Échec.' });
		expect(statusRegion().textContent).toContain('Tâche enregistrée.');
		expect(alertRegion().textContent).toContain('Échec.');
		expect(statusRegion().textContent).not.toContain('Échec.');
	});

	it('has a 44 px "Fermer" button and an optional action', () => {
		show({ id: 'a', kind: 'success', message: 'Tâche supprimée.', actionLabel: 'Annuler' });
		const close = statusRegion().querySelector('button[aria-label="Fermer"]') as HTMLButtonElement;
		expect(close.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		const action = Array.from(statusRegion().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Annuler')!;
		action.click();
		expect(host.actions).toEqual(['a']);
		close.click();
		fixture.detectChanges();
		expect(statusRegion().children.length).toBe(0);
	});

	it('closes by itself after at least 5 s, whatever duration is asked', fakeAsync(() => {
		show({ id: 'a', kind: 'info', message: 'Liste à jour.', duration: 1000 });
		tick(4999);
		fixture.detectChanges();
		expect(statusRegion().textContent).toContain('Liste à jour.');
		tick(1);
		fixture.detectChanges();
		expect(statusRegion().children.length).toBe(0);
	}));

	it('errors stay until closed', fakeAsync(() => {
		show({ id: 'b', kind: 'error', message: 'Échec.' });
		tick(60_000);
		fixture.detectChanges();
		expect(alertRegion().textContent).toContain('Échec.');
		show();
	}));

	it('pauses while the pointer is over it or focus is inside', fakeAsync(() => {
		show({ id: 'a', kind: 'success', message: 'Enregistré.' });
		const toast: HTMLElement = statusRegion().querySelector('app-ui-toast')!;
		tick(2000);
		toast.dispatchEvent(new MouseEvent('mouseenter'));
		tick(30_000);
		fixture.detectChanges();
		expect(statusRegion().textContent).toContain('Enregistré.');
		toast.dispatchEvent(new MouseEvent('mouseleave'));
		toast.dispatchEvent(new FocusEvent('focusin'));
		tick(30_000);
		fixture.detectChanges();
		expect(statusRegion().textContent).toContain('Enregistré.');
		toast.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
		tick(3999);
		fixture.detectChanges();
		expect(statusRegion().textContent).toContain('Enregistré.');
		tick(1);
		fixture.detectChanges();
		expect(statusRegion().children.length).toBe(0);
	}));

	it('shows its tone in the icon colour, not in a coloured border', () => {
		show({ id: 'a', kind: 'warning', message: 'Connexion lente.' });
		const toast: HTMLElement = statusRegion().querySelector('app-ui-toast')!;
		expect(toast.querySelector('app-ui-icon')?.parentElement?.classList).toContain('text-ui-warning-ink');
		expect(toast.classList).not.toContain('border-s-4');
	});

	// Layout Instability API: a box whose start moves on screen without user input, a transform's own move aside.
	// On a page longer than the screen, as most app pages are: there Chrome counted the toasts' moves inside a toaster
	// raised by a transform, at the top of the page or scrolled (0.0136 at 390 × 844), and on a short page it did not.
	// The spacer only lengthens the page, it never scrolls it.
	it('never shifts layout on a long page: a toast arriving, one below it, an error above them, the oldest leaving', async () => {
		expect(PerformanceObserver.supportedEntryTypes).toContain('layout-shift');
		const entries: PerformanceEntry[] = [];
		const observer = new PerformanceObserver((list) => entries.push(...list.getEntries()));
		observer.observe({ type: 'layout-shift' });
		const shifts = async (): Promise<number[]> => {
			await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			await new Promise((resolve) => setTimeout(resolve, 50));
			entries.push(...observer.takeRecords());
			return entries.splice(0).map((entry) => (entry as PerformanceEntry & { value: number }).value);
		};
		const warning = (id: string): UiToastItem => ({ id, kind: 'warning', title: 'Attention', message: 'Aucun résultat.' });
		const error: UiToastItem = { id: 'e', kind: 'error', message: 'Le serveur ne répond pas.' };

		// A box moved without a transform is reported here, so an empty list below means something.
		const probe = document.createElement('div');
		probe.style.cssText = 'position: fixed; top: 0; left: 0; width: 200px; height: 200px; background: gray';
		document.body.append(probe);
		await shifts();
		probe.style.top = '100px';
		expect((await shifts()).length).withContext('a moved box').toBeGreaterThan(0);
		probe.remove();
		const spacer = document.createElement('div');
		spacer.style.height = '300vh';
		document.body.append(spacer);
		await shifts();

		const steps: [string, UiToastItem[]][] = [
			['a first toast', [warning('a')]],
			['a second one below it', [warning('a'), warning('b')]],
			['an error above them', [warning('a'), warning('b'), error]],
			['the oldest leaving', [warning('b'), error]],
			['the last ones leaving', []],
		];
		try {
			for (const [step, toasts] of steps) {
				show(...toasts);
				expect(await shifts()).withContext(step).toEqual([]);
				if (!toasts.length) continue;
				// Same place as ever: the newest polite toast sits on the bottom padding of the box that holds both regions,
				// at the viewport's bottom.
				const last = statusRegion().lastElementChild!.getBoundingClientRect();
				const bottom = window.innerHeight - parseFloat(getComputedStyle(statusRegion().parentElement!).paddingBottom);
				expect(Math.abs(last.bottom - bottom)).withContext(step).toBeLessThanOrEqual(0.5);
				expect(alertRegion().getBoundingClientRect().bottom).withContext(step).toBeLessThanOrEqual(last.top);
			}
		} finally {
			spacer.remove();
			observer.disconnect();
		}
	});

	// The toaster spans the screen to hold its toasts in place: only the toasts take the pointer.
	it('takes the pointer on its toasts and lets it through everywhere else', () => {
		show({ id: 'a', kind: 'success', message: 'Tâche supprimée.', actionLabel: 'Annuler' });
		const hit = (element: Element): boolean => {
			const box = element.getBoundingClientRect();
			return element.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
		};
		const buttons = Array.from(statusRegion().querySelectorAll('button'));
		expect(buttons.map((button) => button.textContent?.trim() || button.getAttribute('aria-label'))).toEqual(['Annuler', 'Fermer']);
		for (const button of buttons) expect(hit(button)).withContext(button.textContent ?? '').toBeTrue();
		const toaster: HTMLElement = fixture.nativeElement.querySelector('app-ui-toaster');
		expect(toaster.contains(document.elementFromPoint(1, 1))).withContext('the top corner').toBeFalse();
	});

	it('adds nothing to the page size, nor a sideways scroll, in ltr and rtl', () => {
		const root = document.documentElement;
		const size = (): number[] => [root.scrollWidth, root.scrollHeight];
		try {
			for (const dir of ['ltr', 'rtl']) {
				root.setAttribute('dir', dir);
				const before = size();
				show({ id: 'a', kind: 'warning', message: 'Aucun résultat.' }, { id: 'e', kind: 'error', message: 'Échec.' });
				expect(size()).withContext(dir).toEqual(before);
				show();
			}
		} finally {
			root.removeAttribute('dir');
		}
	});
});

// Everything outside an open modal <dialog> is inert: no pointer, no focus, out of the accessibility tree.
describe('UiToasterComponent while a modal dialog is open', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let dialogs: HTMLDialogElement[];

	const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));
	const toaster = (): HTMLElement => document.querySelector('app-ui-toaster') as HTMLElement;
	const closeButton = (): HTMLButtonElement => toaster().querySelector('button[aria-label="Fermer"]') as HTMLButtonElement;
	const onTop = (element: HTMLElement): boolean => {
		const box = element.getBoundingClientRect();
		return element.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
	};

	function openDialog(text: string): HTMLDialogElement {
		const dialog = document.createElement('dialog');
		dialog.innerHTML = `<p>${text}</p><button type="button">Annuler</button>`;
		document.body.appendChild(dialog);
		dialogs.push(dialog);
		dialog.showModal();
		return dialog;
	}

	function show(...toasts: UiToastItem[]): void {
		host.toasts.set(toasts);
		fixture.detectChanges();
	}

	beforeEach(() => {
		dialogs = [];
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(async () => {
		show();
		dialogs.forEach((dialog) => dialog.open && dialog.close());
		await settle();
		dialogs.forEach((dialog) => dialog.remove());
	});

	it('keeps a toast on top of the dialog, clickable and focusable', async () => {
		const dialog = openDialog('Supprimer la tâche ?');
		await settle();
		show({ id: 'a', kind: 'error', message: 'Le serveur ne répond pas.' });

		expect(onTop(closeButton())).withContext('the toast is under the dialog').toBeTrue();
		closeButton().focus();
		expect(document.activeElement).withContext('the toast is inert').toBe(closeButton());
		expect(toaster().querySelector('[role=alert]')?.closest('dialog')).withContext('the alert region is hidden behind the modal').toBe(dialog);

		closeButton().click();
		fixture.detectChanges();
		expect(host.toasts()).toEqual([]);
		expect(dialog.open).withContext('closing the toast leaves the dialog open').toBeTrue();
	});

	it('follows the newest of two modal dialogs, then goes back to its place', async () => {
		const place = toaster().parentElement;
		openDialog('Modifier le projet');
		const second = openDialog('Supprimer le projet ?');
		await settle();
		show({ id: 'a', kind: 'success', message: 'Tâche supprimée.' });
		expect(onTop(closeButton())).withContext('above the newest dialog').toBeTrue();

		second.close();
		await settle();
		expect(onTop(closeButton())).withContext('above the dialog left open').toBeTrue();

		dialogs[0].close();
		await settle();
		expect(toaster().parentElement).toBe(place);
		expect(toaster().querySelector('[role=status][aria-live=polite]')?.textContent).toContain('Tâche supprimée.');
		expect(onTop(closeButton())).toBeTrue();
	});

	it('sits at the top while a dialog is open, at the bottom again once it closes', async () => {
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		const toast = (): DOMRect => toaster().querySelector('app-ui-toast')!.getBoundingClientRect();
		const first = openDialog('Modifier le projet');
		const second = openDialog('Supprimer le projet ?');
		await settle();
		show({ id: 'a', kind: 'error', message: 'Le serveur ne répond pas.' });
		// 0.5rem under the top edge (no safe area in the test browser), over the app bar the backdrop covers.
		expect(Math.abs(toast().top - 0.5 * rem)).withContext('over the dialog').toBeLessThanOrEqual(0.5);

		second.close();
		await settle();
		expect(Math.abs(toast().top - 0.5 * rem)).withContext('over the dialog left open').toBeLessThanOrEqual(0.5);

		first.close();
		await settle();
		// Back on the bottom padding: the polite region last, empty, the error above it.
		const region = toaster().querySelector('[role=status]')!;
		const polite = region.getBoundingClientRect();
		const bottom = window.innerHeight - parseFloat(getComputedStyle(region.parentElement!).paddingBottom);
		expect(Math.abs(polite.bottom - bottom)).withContext('no dialog open').toBeLessThanOrEqual(0.5);
		expect(toast().bottom).withContext('no dialog open').toBeLessThanOrEqual(polite.top);
		expect(toast().top).withContext('no dialog open').toBeGreaterThan(window.innerHeight / 2);
		expect(toaster().hasAttribute('data-modal')).toBeFalse();
	});
});

@Component({
	standalone: true,
	imports: [UiDialogComponent, UiDialogFooterDirective, UiToasterComponent],
	template: `
		<app-ui-toaster [toasts]="toasts()" (dismissed)="toasts.set([])" />
		<app-ui-dialog [(open)]="open" title="Modifier le projet" [mode]="mode()">
			<p style="height: 200vh">Fiche du projet</p>
			<!-- Buttons a row each: an action row taller than the toaster's bottom padding. -->
			<div appUiDialogFooter>
				<button type="button" style="width: 100%; height: 44px">Supprimer</button>
				<button type="button" style="width: 100%; height: 44px">Annuler</button>
				<button type="button" style="width: 100%; height: 44px">Enregistrer</button>
			</div>
		</app-ui-dialog>
	`,
})
class SheetHostComponent {
	public readonly toasts = signal<UiToastItem[]>([]);
	public readonly open = signal(false);
	public readonly mode = signal<UiDialogMode>('sheet');
}

describe('UiToasterComponent over a dialog or a bottom sheet', () => {
	let fixture: ComponentFixture<SheetHostComponent>;

	// The next frame, as on screen: a dialog's close event comes with it, so a closing never lands in a later step.
	const settle = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
	const intersects = (a: DOMRect, b: DOMRect): boolean =>
		a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

	/** Opens the dialog with an error toast and returns the toast's box. */
	async function errorOver(mode: UiDialogMode): Promise<DOMRect> {
		fixture.componentInstance.mode.set(mode);
		fixture.componentInstance.open.set(true);
		fixture.detectChanges();
		await settle();
		fixture.componentInstance.toasts.set([{ id: 'e', kind: 'error', title: 'Erreur', message: "Le projet a changé." }]);
		fixture.detectChanges();
		return document.querySelector('app-ui-toast')!.getBoundingClientRect();
	}

	function actionRow(): HTMLButtonElement[] {
		return Array.from(document.querySelectorAll<HTMLButtonElement>('dialog [appUiDialogFooter] button'));
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [SheetHostComponent] });
		fixture = TestBed.createComponent(SheetHostComponent);
		fixture.detectChanges();
	});

	afterEach(async () => {
		fixture.componentInstance.toasts.set([]);
		fixture.componentInstance.open.set(false);
		fixture.detectChanges();
		await settle();
		document.documentElement.removeAttribute('dir');
	});

	for (const mode of ['sheet', 'dialog'] as UiDialogMode[]) {
		it(`never covers the action row of a ${mode}, nor its close button`, async () => {
			const toast = await errorOver(mode);
			const close = document.querySelector<HTMLButtonElement>('dialog header button')!;
			expect(intersects(toast, close.getBoundingClientRect())).withContext('the close button under the toast').toBeFalse();
			expect(actionRow().length).toBe(3);
			for (const button of actionRow()) {
				const box = button.getBoundingClientRect();
				expect(intersects(toast, box)).withContext(`${button.textContent} under the toast`).toBeFalse();
				expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).withContext(`${button.textContent} reachable`).toBe(button);
			}
		});
	}

	it('sits at the same height in rtl, mirrored', async () => {
		const ltr = await errorOver('sheet');
		fixture.componentInstance.open.set(false);
		fixture.detectChanges();
		await settle();
		document.documentElement.setAttribute('dir', 'rtl');
		const rtl = await errorOver('sheet');
		expect(rtl.top).toBeCloseTo(ltr.top, 1);
		expect(rtl.width).toBeCloseTo(ltr.width, 1);
		expect(rtl.left).toBeCloseTo(document.documentElement.clientWidth - ltr.right, 1);
		for (const button of actionRow()) {
			expect(intersects(rtl, button.getBoundingClientRect())).withContext(`${button.textContent} under the toast`).toBeFalse();
		}
	});
});

@Component({
	standalone: true,
	imports: [UiDialogComponent, UiStickyActionsDirective, UiToasterComponent],
	template: `
		<app-ui-toaster [toasts]="toasts()" (dismissed)="toasts.set([])" />
		<form>
			<h1>Modifier le projet</h1>
			@for (row of rows(); track row) {
				<!-- Stuck above a 3.5rem tab bar, as page forms on a phone. -->
				<div appUiStickyActions style="position: fixed; inset-inline: 0; bottom: 3.5rem; display: flex; gap: 0.75rem; padding: 0.75rem 1rem">
					<button type="button" style="height: 44px">Annuler</button>
					<button type="submit" style="height: 44px; flex: 1">Enregistrer</button>
				</div>
			}
		</form>
		<app-ui-dialog [(open)]="open" title="Supprimer le projet ?">
			<p>Cette action est définitive.</p>
		</app-ui-dialog>
	`,
})
class FormHostComponent {
	public readonly toasts = signal<UiToastItem[]>([]);
	public readonly rows = signal<string[]>([]);
	public readonly open = signal(false);
}

describe('UiToasterComponent over a page form with a sticky action row', () => {
	let fixture: ComponentFixture<FormHostComponent>;
	let host: FormHostComponent;

	const rem = (): number => parseFloat(getComputedStyle(document.documentElement).fontSize);
	const toaster = (): HTMLElement => document.querySelector('app-ui-toaster') as HTMLElement;
	const toast = (): DOMRect => document.querySelector('app-ui-toast')!.getBoundingClientRect();
	const intersects = (a: DOMRect, b: DOMRect): boolean =>
		a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
	const actionRow = (): HTMLButtonElement[] => Array.from(document.querySelectorAll<HTMLButtonElement>('[appUiStickyActions] button'));
	// 0.5rem under the 3.5rem app bar (no safe area in the test browser).
	const underAppBar = (): boolean => Math.abs(toast().top - 4 * rem()) <= 0.5;
	const atTopEdge = (): boolean => Math.abs(toast().top - 0.5 * rem()) <= 0.5;
	const atBottom = (): boolean => toast().top > window.innerHeight / 2;

	// Up to the next frame, as on screen: a dialog's close event comes with it, so a closing never lands in a later step.
	async function render(): Promise<void> {
		fixture.detectChanges();
		await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
	}

	async function showError(): Promise<void> {
		host.toasts.set([{ id: 'e', kind: 'error', title: 'Erreur', message: "Le projet n'a pas été enregistré." }]);
		await render();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [FormHostComponent] });
		fixture = TestBed.createComponent(FormHostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(async () => {
		host.toasts.set([]);
		host.rows.set([]);
		host.open.set(false);
		await render();
		document.documentElement.removeAttribute('dir');
	});

	it('sits under the app bar while the row is on the page, clear of Annuler and Enregistrer', async () => {
		host.rows.set(['form']);
		await showError();
		expect(toaster().hasAttribute('data-sticky-actions')).toBeTrue();
		expect(underAppBar()).withContext(`toast top ${toast().top}`).toBeTrue();
		expect(actionRow().length).toBe(2);
		for (const button of actionRow()) {
			const box = button.getBoundingClientRect();
			expect(intersects(toast(), box)).withContext(`${button.textContent} under the toast`).toBeFalse();
			expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).withContext(`${button.textContent} reachable`).toBe(button);
		}
	});

	it('stays under the app bar while one row is left, at the bottom again once none is', async () => {
		host.rows.set(['form', 'other']);
		await showError();
		host.rows.set(['form']);
		await render();
		expect(underAppBar()).withContext('one row left').toBeTrue();
		host.rows.set([]);
		await render();
		expect(toaster().hasAttribute('data-sticky-actions')).toBeFalse();
		expect(atBottom()).withContext(`toast top ${toast().top}, no row`).toBeTrue();
	});

	it('leaves a dialog opened over the form as it was, and follows the rows meanwhile', async () => {
		host.rows.set(['form']);
		await showError();
		host.open.set(true);
		await render();
		expect(toaster().hasAttribute('data-modal')).toBeTrue();
		expect(toaster().hasAttribute('data-sticky-actions')).withContext('in the dialog').toBeFalse();
		expect(atTopEdge()).withContext(`toast top ${toast().top} over the dialog`).toBeTrue();

		host.rows.set([]);
		await render();
		host.open.set(false);
		await render();
		expect(toaster().hasAttribute('data-modal')).toBeFalse();
		expect(atBottom()).withContext('row gone while the dialog was open').toBeTrue();

		host.open.set(true);
		await render();
		host.rows.set(['form']);
		await render();
		host.open.set(false);
		await render();
		expect(toaster().hasAttribute('data-sticky-actions')).toBeTrue();
		expect(underAppBar()).withContext('row back while the dialog was open').toBeTrue();
	});

	it('sits at the same height in rtl, mirrored', async () => {
		host.rows.set(['form']);
		await showError();
		const ltr = toast();
		const ltrBox = toaster().getBoundingClientRect();
		document.documentElement.setAttribute('dir', 'rtl');
		await render();
		const rtl = toast();
		const rtlBox = toaster().getBoundingClientRect();
		expect(rtl.top).toBeCloseTo(ltr.top, 1);
		expect(rtl.width).toBeCloseTo(ltr.width, 1);
		// Against the toaster's own box: a page scrollbar moves to the left in rtl.
		expect(rtl.left - rtlBox.left).toBeCloseTo(ltrBox.right - ltr.right, 1);
		for (const button of actionRow()) {
			expect(intersects(rtl, button.getBoundingClientRect())).withContext(`${button.textContent} under the toast`).toBeFalse();
		}
	});
});
