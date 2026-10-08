#!/usr/bin/env node
// The "Overlays are never clipped" rule (README, UI rules) as a static check: it flags a hand-made floating panel,
// an `absolute` or `fixed` element placed against its parent's edge with `top-full`/`bottom-full` (also as
// `[class.top-full]`). That is the shape of a menu, list, picker or tooltip that any container's overflow, transform
// or z-index hides. A floating panel opens in the top layer instead: `app-ui-menu`, the bottom sheet, `app-ui-dialog`
// or a native control.
//   node scripts/check-ui.mjs [dir|file]...      (default: ui showcase)
// Scans .html, .ts (not .spec.ts) and .scss files. Prints `file:line rule` for each hit (never the line itself), then
// a count; exit 1 if anything is found. Comments are skipped. Put `check-ui-ignore` in a comment on the tag's first
// line or on the line just above it, with the reason, to exempt one element. The menu (its list is a popover placed
// from the trigger's box) and the toaster (a fixed layer the size of the screen) are exempt.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FLOATING_PANEL = 'hand-made floating panel';
const EXEMPT = /(?:^|\/)ui\/(?:menu\/|toast\/toaster\.component\.ts$)/;
const EXT = /\.(html|ts|scss)$/;
const POSITIONED = /(?<![\w-])(?:absolute|fixed)(?![\w-])/;
const AT_EDGE = /(?<![\w-])(?:top|bottom)-full(?![\w-])/;
/** An opening tag, quoted attribute values kept whole (they may hold `>`), over any number of lines. */
const TAG = /<[a-zA-Z][\w-]*(?:\s+[^\s"'>=\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/g;

/** `text` with comments blanked to spaces, so offsets and lines stay: comments render nothing. */
function uncommented(text) {
	return text
		.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '))
		.split('\n')
		.map((line) => (/^\s*(?:\/\/|\/?\*)/.test(line) ? ' '.repeat(line.length) : line))
		.join('\n');
}

/** The lines (1-based) where an absolute or fixed element sits at its parent's top or bottom edge. */
function floatingPanels(text) {
	const found = new Set();
	const code = uncommented(text);
	const lineOf = (index) => code.slice(0, index).split('\n').length;
	for (const match of code.matchAll(TAG)) {
		if (POSITIONED.test(match[0]) && AT_EDGE.test(match[0])) found.add(lineOf(match.index));
	}
	// A class string outside a tag, e.g. a host binding or a computed class.
	code.split('\n').forEach((line, i) => {
		if (POSITIONED.test(line) && AT_EDGE.test(line)) found.add(i + 1);
	});
	return [...found];
}

/** The hits in `text`; `file` (its path) exempts the menu and the toaster. */
export function check(text, file = '') {
	if (EXEMPT.test(file.replaceAll('\\', '/'))) return [];
	const lines = text.split('\n');
	const ignored = (i) => lines[i].includes('check-ui-ignore') || (i > 0 && lines[i - 1].includes('check-ui-ignore'));
	return floatingPanels(text)
		.filter((line) => !ignored(line - 1))
		.sort((a, b) => a - b)
		.map((line) => ({ line, rule: FLOATING_PANEL }));
}

export function* files(path) {
	const st = statSync(path);
	if (st.isFile()) {
		if (EXT.test(path) && !path.endsWith('.spec.ts')) yield path;
		return;
	}
	for (const name of readdirSync(path).sort()) {
		if (name === 'node_modules' || name.startsWith('.')) continue;
		yield* files(join(path, name));
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	let args = process.argv.slice(2);
	if (!args.length) {
		process.chdir(fileURLToPath(new URL('..', import.meta.url)));
		args = ['ui', 'showcase'];
	}
	let total = 0;
	for (const arg of args) {
		for (const file of files(arg)) {
			for (const hit of check(readFileSync(file, 'utf8'), file)) {
				console.log(`${file}:${hit.line} ${hit.rule}`);
				total++;
			}
		}
	}
	console.log(`check-ui: ${total} hit(s)`);
	process.exit(total ? 1 : 0);
}
