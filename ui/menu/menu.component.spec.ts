import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiMenuComponent, UiMenuItemDirective } from './menu.component';

@Component({
	standalone: true,
	imports: [UiMenuComponent, UiMenuItemDirective],
	template: `
		<button id="before" type="button">Avant</button>
		<app-ui-menu label="Plus d'actions">
			<button appUiMenuItem type="button" (click)="chosen = 'modifier'">Modifier</button>
			<button appUiMenuItem type="button" disabled>Archiver</button>
			<button appUiMenuItem type="button">Dupliquer</button>
			<button appUiMenuItem type="button" tone="danger">Supprimer</button>
		</app-ui-menu>
	`,
})
class HostComponent {
	public chosen = '';
}

@Component({
	standalone: true,
	imports: [UiMenuComponent, UiMenuItemDirective],
	template: `
		<div class="flex" [attr.dir]="dir" [class.justify-end]="atEnd">
			<app-ui-menu label="Plus d'actions">
				<button appUiMenuItem type="button">Enregistrer comme modèle pour l'équipe</button>
			</app-ui-menu>
		</div>
	`,
})
class PlacedHostComponent {
	public dir: 'ltr' | 'rtl' = 'ltr';
	public atEnd = false;
}

/** A 400 px wide screen with the trigger 150 px from its inline start, as after « Aperçu » in a phone page header. */
@Component({
	standalone: true,
	imports: [UiMenuComponent, UiMenuItemDirective],
	template: `
		<div class="flex" style="width: 400px; padding-inline-start: 150px" [attr.dir]="dir">
			<app-ui-menu label="Plus d'actions">
				<button appUiMenuItem type="button">Enregistrer comme modèle pour l'équipe</button>
			</app-ui-menu>
		</div>
	`,
})
class MiddleHostComponent {
	public dir: 'ltr' | 'rtl' = 'ltr';
}

/**
 * A trigger with a list's room above it, as « ⋮ » on the last row of a list on a phone. It is fixed near the top of
 * Karma's frame, wherever other specs leave the page, so the list stays inside the frame and focusing it never scrolls
 * the window; the screen's height is spied.
 */
@Component({
	standalone: true,
	imports: [UiMenuComponent, UiMenuItemDirective],
	template: `
		<div style="position: fixed; top: 80px; inset-inline-start: 16px">
			<app-ui-menu label="Plus d'actions">
				<button appUiMenuItem type="button" tone="danger">Supprimer</button>
			</app-ui-menu>
		</div>
	`,
})
class LowHostComponent {}

describe('UiMenuComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let trigger: HTMLButtonElement;

	function settle(): void {
		fixture.detectChanges();
		TestBed.flushEffects();
		fixture.detectChanges();
	}

	function press(target: Element, key: string): KeyboardEvent {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		target.dispatchEvent(event);
		settle();
		return event;
	}

	const menu = (): HTMLElement | null => fixture.nativeElement.querySelector('[role=menu]');
	const items = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role=menuitem]'));

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		fixture = TestBed.createComponent(HostComponent);
		settle();
		trigger = fixture.nativeElement.querySelector('button[aria-haspopup=menu]');
		trigger.focus();
	});

	it('the trigger is a named 44x44 button that says it opens a menu', () => {
		expect(trigger.getAttribute('aria-label')).toBe("Plus d'actions");
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		const rect = trigger.getBoundingClientRect();
		expect(rect.width).toBeGreaterThanOrEqual(44);
		expect(rect.height).toBeGreaterThanOrEqual(44);
		expect(menu()).toBeNull();
	});

	it('a click opens the menu on its first item', () => {
		trigger.click();
		settle();
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(menu()!.id);
		expect(menu()!.getAttribute('aria-labelledby')).toBe(trigger.id);
		expect(document.activeElement).toBe(items()[0]);
		expect(items()[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
	});

	it('arrow keys wrap and skip disabled items; Home and End jump', () => {
		trigger.click();
		settle();
		press(document.activeElement!, 'ArrowDown');
		expect(document.activeElement?.textContent?.trim()).toBe('Dupliquer');
		press(document.activeElement!, 'End');
		expect(document.activeElement?.textContent?.trim()).toBe('Supprimer');
		press(document.activeElement!, 'ArrowDown');
		expect(document.activeElement?.textContent?.trim()).toBe('Modifier');
		press(document.activeElement!, 'ArrowUp');
		expect(document.activeElement?.textContent?.trim()).toBe('Supprimer');
		press(document.activeElement!, 'Home');
		expect(document.activeElement?.textContent?.trim()).toBe('Modifier');
	});

	it('ArrowUp on the trigger opens on the last item', () => {
		press(trigger, 'ArrowUp');
		expect(document.activeElement?.textContent?.trim()).toBe('Supprimer');
	});

	it('Esc closes and gives focus back to the trigger', () => {
		trigger.click();
		settle();
		press(document.activeElement!, 'Escape');
		expect(menu()).toBeNull();
		expect(document.activeElement).toBe(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});

	it('Tab closes the menu without trapping focus', () => {
		trigger.click();
		settle();
		const event = press(document.activeElement!, 'Tab');
		expect(event.defaultPrevented).toBeFalse();
		expect(menu()).toBeNull();
	});

	it('choosing an item runs it, closes the menu and refocuses the trigger', () => {
		trigger.click();
		settle();
		items()[0].click();
		settle();
		expect(fixture.componentInstance.chosen).toBe('modifier');
		expect(menu()).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it('a press outside closes it', () => {
		trigger.click();
		settle();
		document.getElementById('before')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		settle();
		expect(menu()).toBeNull();
	});
});

describe('UiMenuComponent placement', () => {
	function open(dir: 'ltr' | 'rtl', atEnd: boolean): { list: DOMRect; trigger: DOMRect } {
		TestBed.configureTestingModule({ imports: [PlacedHostComponent] });
		const fixture = TestBed.createComponent(PlacedHostComponent);
		Object.assign(fixture.componentInstance, { dir, atEnd });
		fixture.detectChanges();
		const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-haspopup=menu]');
		trigger.click();
		fixture.detectChanges();
		TestBed.flushEffects();
		fixture.detectChanges();
		const list: HTMLElement = fixture.nativeElement.querySelector('[role=menu]');
		return { list: list.getBoundingClientRect(), trigger: trigger.getBoundingClientRect() };
	}

	const screenWidth = (): number => document.documentElement.clientWidth;

	it('opens at the trigger\'s inline end when there is room', () => {
		const { list, trigger } = open('ltr', true);
		expect(list.width).toBeGreaterThan(trigger.width);
		expect(list.right).toBeCloseTo(trigger.right, 0);
		expect(list.right).toBeLessThanOrEqual(screenWidth());
	});

	it('opens at the trigger\'s inline start when the end would leave the screen', () => {
		const { list, trigger } = open('ltr', false);
		expect(list.width).toBeGreaterThan(trigger.width);
		expect(list.left).toBeCloseTo(trigger.left, 0);
		expect(list.left).toBeGreaterThanOrEqual(0);
	});

	it('right to left: opens at the trigger\'s inline end when there is room', () => {
		const { list, trigger } = open('rtl', true);
		expect(list.left).toBeCloseTo(trigger.left, 0);
		expect(list.left).toBeGreaterThanOrEqual(0);
	});

	it('right to left: opens at the trigger\'s inline start when the end would leave the screen', () => {
		const { list, trigger } = open('rtl', false);
		expect(list.right).toBeCloseTo(trigger.right, 0);
		expect(list.right).toBeLessThanOrEqual(screenWidth());
	});

	for (const dir of ['ltr', 'rtl'] as const) {
		it(`${dir}: moves the list back inside the screen when it would cross either edge`, () => {
			TestBed.configureTestingModule({ imports: [MiddleHostComponent] });
			const fixture = TestBed.createComponent(MiddleHostComponent);
			fixture.componentInstance.dir = dir;
			fixture.detectChanges();
			// The screen ends where the 400 px host ends.
			const edge = (fixture.nativeElement.querySelector('div') as HTMLElement).getBoundingClientRect().right;
			spyOnProperty(document.documentElement, 'clientWidth').and.returnValue(edge);
			fixture.nativeElement.querySelector('button[aria-haspopup=menu]').click();
			fixture.detectChanges();
			TestBed.flushEffects();
			fixture.detectChanges();
			const list = (fixture.nativeElement.querySelector('[role=menu]') as HTMLElement).getBoundingClientRect();
			expect(list.width).toBeGreaterThan(250); // wider than the room on either side of the trigger
			expect(list.left).toBeGreaterThanOrEqual(16 - 0.5);
			expect(list.right).toBeLessThanOrEqual(edge - 16 + 0.5);
		});
	}
});

describe('UiMenuComponent above the phone tab bar', () => {
	let bar: HTMLElement | null = null;

	afterEach(() => {
		bar?.remove();
		bar = null;
	});

	/**
	 * Opens the menu with 80 px of screen under its trigger, room for its one item (52 px). The tab bar, when there is
	 * one, starts 20 px under the trigger; 'hidden' is the bar on a wide screen (`lg:hidden`).
	 */
	function open(tabBar: 'none' | 'shown' | 'hidden'): { list: DOMRect; trigger: DOMRect } {
		TestBed.configureTestingModule({ imports: [LowHostComponent] });
		const fixture = TestBed.createComponent(LowHostComponent);
		fixture.detectChanges();
		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-haspopup=menu]');
		const trigger = button.getBoundingClientRect();
		spyOnProperty(window, 'innerHeight').and.returnValue(trigger.bottom + 80);
		if (tabBar !== 'none') {
			bar = document.createElement('app-bottom-navigation');
			bar.style.cssText = `position: fixed; inset-inline: 0; top: ${trigger.bottom + 20}px; height: 56px;`;
			if (tabBar === 'hidden') bar.style.display = 'none';
			document.body.appendChild(bar);
		}
		button.click();
		fixture.detectChanges();
		TestBed.flushEffects();
		fixture.detectChanges();
		const list = (fixture.nativeElement.querySelector('[role=menu]') as HTMLElement).getBoundingClientRect();
		return { list, trigger: button.getBoundingClientRect() };
	}

	it('opens under the trigger when the screen has room there and there is no tab bar, as before', () => {
		const { list, trigger } = open('none');
		expect(list.top).toBeGreaterThanOrEqual(trigger.bottom);
	});

	it('opens above the trigger when the tab bar covers the room under it', () => {
		const { list, trigger } = open('shown');
		expect(list.bottom).toBeLessThanOrEqual(trigger.top);
	});

	it('a tab bar hidden on a wide screen changes nothing', () => {
		const { list, trigger } = open('hidden');
		expect(list.top).toBeGreaterThanOrEqual(trigger.bottom);
	});
});
