import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCardComponent, UiCardFooterDirective, UiCardHeaderDirective, UiStretchedLinkDirective } from './card.component';

@Component({
	standalone: true,
	imports: [UiCardComponent, UiCardHeaderDirective, UiCardFooterDirective, UiStretchedLinkDirective],
	template: `
		<app-ui-card style="width: 300px">
			<h3 appUiCardHeader><a appUiStretchedLink href="#reunion">Réunion du jeudi</a></h3>
			<p>Corps</p>
			<div appUiCardFooter><button type="button" class="relative z-10">Détails</button></div>
		</app-ui-card>
	`,
})
class HostComponent {}

describe('UiCardComponent', () => {
	let card: HTMLElement;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		card = fixture.nativeElement.querySelector('app-ui-card');
	});

	it('puts the header, the body and the footer in that order', () => {
		const children = Array.from(card.children);
		expect(children[0].tagName).toBe('H3');
		expect(children[1].textContent?.trim()).toBe('Corps');
		expect(children[2].hasAttribute('appUiCardFooter')).toBeTrue();
	});

	it('a stretched link covers the whole card, so the card is one target with one name', () => {
		const link: HTMLAnchorElement = card.querySelector('a')!;
		const after = getComputedStyle(link, '::after');
		expect(after.position).toBe('absolute');
		expect(getComputedStyle(card).position).toBe('relative');
		expect(card.querySelectorAll('a').length).toBe(1);
	});
});
