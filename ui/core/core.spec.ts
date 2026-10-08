import { firstFieldIn, focusableIn } from './focus';
import { uiId } from './ui-id';

describe('UI core helpers', () => {
	let root: HTMLElement;

	beforeEach(() => {
		root = document.createElement('div');
		document.body.appendChild(root);
	});

	afterEach(() => root.remove());

	it('uiId gives a new id on every call', () => {
		expect(uiId('x')).not.toBe(uiId('x'));
	});

	it('focusableIn skips disabled, hidden and tabindex=-1 elements', () => {
		root.innerHTML = `
			<button id="a">A</button>
			<button disabled>B</button>
			<a href="#">C</a>
			<span tabindex="-1">D</span>
			<input hidden />
			<div style="display:none"><button>E</button></div>
		`;
		expect(focusableIn(root).map((element) => element.textContent)).toEqual(['A', 'C']);
	});

	it('firstFieldIn returns the first visible form field', () => {
		root.innerHTML = `<button>Fermer</button><input type="hidden" /><select><option>1</option></select><input />`;
		expect(firstFieldIn(root)?.tagName).toBe('SELECT');
	});
});
