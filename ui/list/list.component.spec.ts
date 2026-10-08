import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStretchedLinkDirective } from '../card/card.component';
import {
	UiListDirective,
	UiListItemComponent,
	UiListLeadingDirective,
	UiListMetaDirective,
	UiListTitleDirective,
	UiListTrailingDirective,
} from './list.component';

@Component({
	standalone: true,
	imports: [
		UiListDirective,
		UiListItemComponent,
		UiListLeadingDirective,
		UiListMetaDirective,
		UiListTitleDirective,
		UiListTrailingDirective,
		UiStretchedLinkDirective,
	],
	template: `
		<ul appUiList style="width: 360px">
			<li appUiListItem>
				<span appUiListLeading>A</span>
				<a appUiListTitle appUiStretchedLink href="#a">Élément Alpha</a>
				<span appUiListMeta>Brouillon</span>
				<button appUiListTrailing type="button">Plus</button>
			</li>
			<li appUiListItem>
				<a appUiListTitle href="#b">Élément Bêta</a>
			</li>
		</ul>
	`,
})
class HostComponent {}

describe('UiListDirective and UiListItemComponent', () => {
	let list: HTMLUListElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		list = fixture.nativeElement.querySelector('ul');
	});

	it('is a real list (role kept even without bullets)', () => {
		expect(list.getAttribute('role')).toBe('list');
		expect(list.querySelectorAll(':scope > li').length).toBe(2);
	});

	it('rows are at least 56 px tall', () => {
		for (const row of Array.from(list.querySelectorAll('li'))) {
			expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
		}
	});

	it('puts the slots in order and keeps the trailing action above the stretched link', () => {
		const row = list.querySelector('li')!;
		expect(row.firstElementChild?.textContent).toBe('A');
		expect(row.lastElementChild?.tagName).toBe('BUTTON');
		const trailing = row.lastElementChild as HTMLElement;
		expect(getComputedStyle(trailing).position).toBe('relative');
		expect(Number(getComputedStyle(trailing).zIndex)).toBeGreaterThan(0);
	});
});
