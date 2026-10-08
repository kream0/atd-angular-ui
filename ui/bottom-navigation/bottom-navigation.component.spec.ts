import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ICON_CALENDAR, ICON_HOME } from '../icon/icons';
import { ICON_USERS } from '../icon/set/users';
import { UiBottomNavigationComponent, UiBottomNavItem } from './bottom-navigation.component';

@Component({ standalone: true, template: '' })
class EmptyPageComponent {}

@Component({
	standalone: true,
	imports: [UiBottomNavigationComponent],
	template: `<app-bottom-navigation [items]="items" />`,
})
class HostComponent {
	public readonly items: UiBottomNavItem[] = [
		{ label: 'Accueil', path: '/', icon: ICON_HOME, exact: true },
		{ label: 'Agenda', path: '/agenda', icon: ICON_CALENDAR },
		{ label: 'Projets', path: '/projets', icon: ICON_USERS },
	];
}

describe('UiBottomNavigationComponent', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [
				provideRouter([
					{ path: '', component: EmptyPageComponent },
					{ path: 'agenda', component: EmptyPageComponent },
					{ path: 'agenda/:id', component: EmptyPageComponent },
					{ path: 'projets', component: EmptyPageComponent },
				]),
			],
		}),
	);

	it('is a named nav of links with visible labels, 56 px tall', () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
		const links = Array.from(nav.querySelectorAll('a'));

		expect(nav.getAttribute('aria-label')).toBe('Navigation principale');
		expect(links.map((link) => link.textContent?.trim())).toEqual(['Accueil', 'Agenda', 'Projets']);
		expect(links.every((link) => link.querySelector('app-ui-icon')?.getAttribute('aria-hidden') === 'true')).toBeTrue();
		expect(links[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
	});

	it('marks the active item with aria-current="page", Accueil only on the exact path', async () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await TestBed.inject(Router).navigateByUrl('/agenda/42');
		fixture.detectChanges();
		const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
		expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page', null]);
	});

	it('ignores query parameters: Accueil stays current on /?vue=semaine', async () => {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		await TestBed.inject(Router).navigateByUrl('/?vue=semaine');
		fixture.detectChanges();
		const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
		expect(links.map((link) => link.getAttribute('aria-current'))).toEqual(['page', null, null]);
	});
});
