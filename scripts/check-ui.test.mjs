// node --test scripts/check-ui.test.mjs: the « hand-made floating panel » rule of check-ui.mjs.
// A list placed as an absolute box under its trigger (`top-full`) is hidden by any box around it that clips
// (`overflow-hidden`). A floating panel opens in the top layer instead (README, "Overlays are never clipped").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, files } from './check-ui.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGE = 'showcase/sample.component.ts';

const panels = (text, file = PAGE) => check(text, file).map((hit) => hit.line);

test('an absolute list under its trigger is a hand-made floating panel', () => {
	const text = [
		'<div class="relative">',
		'    <button type="button" aria-haspopup="listbox">Choisir</button>',
		'    <ul class="absolute z-50 top-full mt-1 rounded-ui-lg bg-ui-surface">',
		'        <li>Un</li>',
		'    </ul>',
		'</div>',
	].join('\n');
	assert.deepEqual(panels(text), [3]);
});

test('a list over several lines with bound classes is one, named at its first line', () => {
	const text = [
		'/**',
		' * A comment line above shifts nothing.',
		' */',
		'template: `',
		'    <div',
		'        #panel',
		'        role="menu"',
		'        class="absolute z-50 w-max min-w-48 rounded-ui-lg bg-ui-surface p-1"',
		'        [class.top-full]="!above()"',
		'        [class.bottom-full]="above()"',
		'        (keydown)="onKeydown($event)"',
		'    >',
		'`,',
	].join('\n');
	assert.deepEqual(panels(text), [5]);
});

test('fixed with bottom-full, a `>` inside a quoted value, and a class string outside a tag count too', () => {
	assert.deepEqual(panels('<div (click)="count > 2 && pick()" class="fixed bottom-full">x</div>'), [1]);
	assert.deepEqual(panels("host: { class: 'absolute inset-x-0 top-full' },"), [1]);
});

test('a box in the flow, or positioned without an edge class, is no floating panel', () => {
	assert.deepEqual(panels('<div class="relative top-full">x</div>\n<div class="absolute inset-0">y</div>'), []);
	assert.deepEqual(panels('<div class="absolute">\n<p class="h-full">x</p>\n</div>'), []);
	assert.deepEqual(panels('<div class="h-full top-full-bleed absolute-ish">x</div>'), []);
});

test('comments, an ignore comment above the tag, the menu and the toaster are exempt', () => {
	const list = '<ul class="absolute top-full">\n<li>x</li>\n</ul>';
	assert.deepEqual(panels(`<!--\n${list}\n-->`), []);
	assert.deepEqual(panels(`// ${list.split('\n')[0]}`), []);
	assert.deepEqual(panels(`<!-- check-ui-ignore: a sample -->\n${list}`), []);
	assert.deepEqual(panels(list, 'ui/menu/menu.component.ts'), []);
	assert.deepEqual(panels(list, 'ui/toast/toaster.component.ts'), []);
	assert.deepEqual(panels(list, 'ui/toast/toast.component.ts'), [1]);
	assert.deepEqual(panels(list, 'ui/menu-like/list.component.ts'), [1]);
});

test('the kit has no hand-made floating panel', () => {
	const found = [];
	for (const dir of ['ui', 'showcase']) {
		for (const path of files(fileURLToPath(new URL(`../${dir}`, import.meta.url)))) {
			const file = relative(ROOT, path);
			for (const line of panels(readFileSync(path, 'utf8'), file)) found.push(`${file}:${line}`);
		}
	}
	assert.deepEqual(found, []);
});
