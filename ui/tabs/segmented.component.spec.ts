import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSegmentedComponent } from './segmented.component';

@Component({
	standalone: true,
	imports: [UiSegmentedComponent],
	template: `<app-ui-segmented label="Période" [options]="options" [(value)]="value" />`,
})
class HostComponent {
	public readonly value = signal('semaine');
	public readonly options = [
		{ value: 'semaine', label: 'Semaine' },
		{ value: 'mois', label: 'Mois' },
	];
}

describe('UiSegmentedComponent', () => {
	it('is a native radio group named by a legend, 44 px segments, two-way bound', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const radios = Array.from(element.querySelectorAll('input')) as HTMLInputElement[];

		expect(element.querySelector('fieldset > legend')?.textContent?.trim()).toBe('Période');
		expect(radios.every((radio) => radio.type === 'radio' && radio.name === radios[0].name)).toBeTrue();
		expect(radios[0].checked).toBeTrue();
		expect(radios[1].labels?.[0]?.textContent?.trim()).toBe('Mois');
		expect(radios[1].labels![0].getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

		radios[1].click();
		fixture.detectChanges();
		expect(fixture.componentInstance.value()).toBe('mois');
		expect(radios[1].checked).toBeTrue();
	});

	it('gets no fade when every segment fits', () => {
		TestBed.configureTestingModule({ imports: [HostComponent] });
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const row: HTMLElement = fixture.nativeElement.querySelector('.ui-scroll-cue');
		expect(row.className).not.toMatch(/ui-more-/);
		expect(getComputedStyle(row).getPropertyValue('mask-image')).toBe('none');
	});
});

@Component({
	standalone: true,
	imports: [UiSegmentedComponent],
	template: `
		<div [attr.dir]="dir()" style="width: 220px">
			<app-ui-segmented label="Filtre" [options]="options" [(value)]="value" />
		</div>
	`,
})
class NarrowHostComponent {
	public readonly dir = signal<'ltr' | 'rtl'>('ltr');
	public readonly value = signal('o4');
	public readonly options = Array.from({ length: 5 }, (_, i) => ({ value: `o${i}`, label: `Option numéro ${i}` }));
}

describe('UiSegmentedComponent scroll cue', () => {
	let fixture: ComponentFixture<NarrowHostComponent>;
	let row: HTMLElement;
	let labels: HTMLLabelElement[];

	function render(dir: 'ltr' | 'rtl'): void {
		TestBed.configureTestingModule({ imports: [NarrowHostComponent] });
		fixture = TestBed.createComponent(NarrowHostComponent);
		fixture.componentInstance.dir.set(dir);
		fixture.detectChanges();
		row = fixture.nativeElement.querySelector('.ui-scroll-cue');
		labels = Array.from(row.querySelectorAll('label'));
	}

	const cue = () => ({ start: row.classList.contains('ui-more-start'), end: row.classList.contains('ui-more-end') });
	const inView = (label: HTMLElement) => {
		const box = row.getBoundingClientRect();
		const rect = label.getBoundingClientRect();
		return rect.left >= box.left - 1 && rect.right <= box.right + 1;
	};

	it('scrolls the checked segment into view on load and fades only the edge with more', () => {
		render('ltr');
		expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
		expect(inView(labels[4])).toBeTrue();
		expect(cue()).toEqual({ start: true, end: false });
		expect(getComputedStyle(row).getPropertyValue('mask-image')).toContain('linear-gradient(to right');
	});

	it('keeps the frame whole: only the segments inside it fade', () => {
		render('ltr');
		const frame = row.parentElement as HTMLElement;
		expect(getComputedStyle(frame).getPropertyValue('mask-image')).toBe('none');
		expect(getComputedStyle(frame).boxShadow).not.toBe('none');
	});

	it('brings a picked segment into view (a jump with reduced motion)', () => {
		const real = window.matchMedia.bind(window);
		spyOn(window, 'matchMedia').and.callFake((query: string) =>
			query.includes('prefers-reduced-motion') ? ({ matches: true, media: query } as MediaQueryList) : real(query),
		);
		render('ltr');
		labels[0].querySelector('input')!.click();
		fixture.detectChanges();
		expect(fixture.componentInstance.value()).toBe('o0');
		expect(inView(labels[0])).toBeTrue();
		expect(cue()).toEqual({ start: false, end: true });
	});

	it('in RTL, scrolls the other way and puts the start fade on the right', () => {
		render('rtl');
		expect(row.scrollLeft).toBeLessThan(0);
		expect(inView(labels[4])).toBeTrue();
		expect(cue()).toEqual({ start: true, end: false });
		expect(getComputedStyle(row).getPropertyValue('mask-image')).toContain('linear-gradient(to left');
	});
});
