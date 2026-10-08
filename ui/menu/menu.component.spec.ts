import { NgTemplateOutlet } from '@angular/common';
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

type Box = 'clip' | 'scroll' | 'transform' | 'dialog';

/**
 * A menu inside each kind of container that hid the old list, an absolute box inside the menu: a 48 px tall
 * box that clips, a box that scrolls, a transformed box with a painted block after it, an open modal dialog that
 * scrolls. It is fixed near the top of Karma's frame, so the list has room under its trigger and nothing scrolls the
 * window.
 */
@Component({
	standalone: true,
	imports: [NgTemplateOutlet, UiMenuComponent, UiMenuItemDirective],
	template: `
		<ng-template #menu>
			<div class="flex justify-end">
				<app-ui-menu label="Plus d'actions">
					<button appUiMenuItem type="button">Renommer</button>
					<button appUiMenuItem type="button">Partager</button>
					<button appUiMenuItem type="button">Télécharger</button>
					<button appUiMenuItem type="button" tone="danger">Supprimer</button>
				</app-ui-menu>
			</div>
		</ng-template>
		<div id="frame" style="position: fixed; top: 40px; inset-inline-start: 16px; width: 360px" [attr.dir]="dir">
			@switch (box) {
				@case ('clip') {
					<div style="height: 48px; overflow: hidden"><ng-container [ngTemplateOutlet]="menu" /></div>
				}
				@case ('scroll') {
					<div id="scroller" style="height: 100px; overflow-y: auto">
						<ng-container [ngTemplateOutlet]="menu" />
						<div style="height: 400px"></div>
					</div>
				}
				@case ('transform') {
					<div style="transform: translateX(0)"><ng-container [ngTemplateOutlet]="menu" /></div>
					<div style="position: relative; height: 320px; background: white"></div>
				}
				@case ('dialog') {
					<dialog style="inset: 40px auto auto 16px; width: 360px; height: 140px; margin: 0; padding: 0; overflow: auto">
						<ng-container [ngTemplateOutlet]="menu" />
					</dialog>
				}
			}
		</div>
	`,
})
class BoxedHostComponent {
	public box: Box = 'clip';
	public dir: 'ltr' | 'rtl' = 'ltr';
}

/**
 * Where an open list does not show itself: its four corners 2 px inside its rounded edge, its centre, and the
 * midpoints of its edges that are on screen, each named with what shows there instead.
 */
function hiddenAt(list: HTMLElement): string[] {
	const r = list.getBoundingClientRect();
	const corner = 2 + parseFloat(getComputedStyle(list).borderTopLeftRadius) * (1 - Math.SQRT1_2);
	const [midX, midY] = [r.left + r.width / 2, r.top + r.height / 2];
	const onScreen = ([, x, y]: [string, number, number]): boolean =>
		x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight;
	const points: [string, number, number][] = [
		['top left', r.left + corner, r.top + corner],
		['top right', r.right - corner, r.top + corner],
		['bottom left', r.left + corner, r.bottom - corner],
		['bottom right', r.right - corner, r.bottom - corner],
		['centre', midX, midY],
		...([
			['top', midX, r.top + 2],
			['bottom', midX, r.bottom - 2],
			['left', r.left + 2, midY],
			['right', r.right - 2, midY],
		] as [string, number, number][]).filter(onScreen),
	];
	return points
		.filter(([, x, y]) => !list.contains(document.elementFromPoint(x, y)))
		.map(([name, x, y]) => `${name}: ${document.elementFromPoint(x, y)?.tagName.toLowerCase() ?? 'off screen'}`);
}

const frames = async (count: number): Promise<void> => {
	for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
};

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

describe('UiMenuComponent in the top layer', () => {
	let fixture: ComponentFixture<BoxedHostComponent>;

	afterEach(() => fixture.nativeElement.querySelector('dialog')?.close());

	function settle(): void {
		fixture.detectChanges();
		TestBed.flushEffects();
		fixture.detectChanges();
	}

	function open(box: Box, dir: 'ltr' | 'rtl'): HTMLElement {
		TestBed.configureTestingModule({ imports: [BoxedHostComponent] });
		fixture = TestBed.createComponent(BoxedHostComponent);
		Object.assign(fixture.componentInstance, { box, dir });
		fixture.detectChanges();
		fixture.nativeElement.querySelector('dialog')?.showModal();
		fixture.nativeElement.querySelector('button[aria-haspopup=menu]').click();
		settle();
		return fixture.nativeElement.querySelector('[role=menu]');
	}

	for (const box of ['clip', 'scroll', 'transform', 'dialog'] as const) {
		for (const dir of ['ltr', 'rtl'] as const) {
			it(`${box}, ${dir}: the whole list shows over its container, in the top layer`, () => {
				const list = open(box, dir);
				expect(list.matches(':popover-open')).withContext(':popover-open').toBeTrue();
				expect(hiddenAt(list)).toEqual([]);
				expect(document.activeElement).toBe(list.querySelector('[role=menuitem]'));
			});
		}
	}

	it('stays under its trigger when a box around it scrolls', async () => {
		const list = open('scroll', 'ltr');
		const host: HTMLElement = fixture.nativeElement.querySelector('app-ui-menu');
		const gap = (): number => list.getBoundingClientRect().top - host.getBoundingClientRect().bottom;
		const before = { gap: gap(), top: host.getBoundingClientRect().top };
		(fixture.nativeElement.querySelector('#scroller') as HTMLElement).scrollTop = 30;
		await frames(3);
		expect(host.getBoundingClientRect().top).toBeCloseTo(before.top - 30, 0);
		expect(gap()).toBeCloseTo(before.gap, 0);
		expect(hiddenAt(list)).toEqual([]);
	});

	it('closes when its trigger leaves the screen', async () => {
		open('clip', 'rtl');
		(fixture.nativeElement.querySelector('#frame') as HTMLElement).style.top = '-200px';
		window.dispatchEvent(new Event('resize'));
		await frames(3);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('[role=menu]')).toBeNull();
		expect(fixture.nativeElement.querySelector('button[aria-haspopup=menu]').getAttribute('aria-expanded')).toBe('false');
	});

	it('a browser without popovers still gets a fixed list, out of a box that clips', () => {
		const show = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover')!;
		Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: undefined });
		// Such a browser ignores the popover attribute, so it has no rule that hides an unshown popover either.
		const uaRule = document.head.appendChild(document.createElement('style'));
		uaRule.textContent = '[popover]:not(:popover-open) { display: block; }';
		try {
			const list = open('clip', 'ltr');
			expect(list.matches(':popover-open')).toBeFalse();
			expect(getComputedStyle(list).position).toBe('fixed');
			expect(hiddenAt(list)).toEqual([]);
		} finally {
			Object.defineProperty(HTMLElement.prototype, 'showPopover', show);
			uaRule.remove();
		}
	});

	it('Esc in a dialog closes the list only, focus back on the trigger', () => {
		const list = open('dialog', 'ltr');
		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		list.querySelector('[role=menuitem]')!.dispatchEvent(event);
		settle();
		expect(fixture.nativeElement.querySelector('[role=menu]')).toBeNull();
		expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
		expect(document.activeElement).toBe(fixture.nativeElement.querySelector('button[aria-haspopup=menu]'));
	});
});
