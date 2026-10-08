/**
 * The markdown subset: one small, safe subset for the texts people type (titles, descriptions, notes).
 * The store keeps the text as typed. The views parse it here and draw the tree with Angular bindings only, never
 * innerHTML, so HTML, a script or a style typed in a text shows as the text it is.
 *
 * Inline, in every text (titles too): **bold** or __bold__, *italic* or _italic_, [a link](https://…) and bare
 * https links (http, https, mailto and tel only). A backslash keeps the next sign as typed (`\*`). Marks nest 32 levels
 * deep at most: deeper signs stay as typed.
 * Blocks, in multi-line texts only: paragraphs (line breaks kept), quotes (`> `), bullet lists (`- ` or `* `) and
 * numbered lists (`1. `, the first number kept). Nothing else: a `#` line, a table or a code sign stays as typed.
 *
 * A document (`{ document: true }`: a long report written elsewhere and pasted) reads more: headings (`# ` to `###### `), GFM pipe tables (`| a | b |` over `| --- | :-: |`, at most 32
 * columns), rules (`---`) and ==highlight==. Code signs still stay as typed.
 *
 * `plainText` gives the same text without its signs, for every place that needs plain text (page title, share text,
 * export, search, sort).
 */

export type MdInline =
	| { readonly kind: 'text'; readonly text: string }
	/** `mark`: ==highlight==, in a document only. */
	| { readonly kind: 'strong' | 'em' | 'mark'; readonly children: readonly MdInline[] }
	| { readonly kind: 'link'; readonly href: string; readonly children: readonly MdInline[] };

export type MdBlock =
	| { readonly kind: 'paragraph'; readonly content: readonly MdInline[] }
	/** `dir`: from the quote's first letter, as the page cannot find it (see textDirection). */
	| { readonly kind: 'quote'; readonly dir: TextDirection | null; readonly blocks: readonly MdBlock[] }
	| { readonly kind: 'list'; readonly ordered: boolean; readonly start: number; readonly items: readonly (readonly MdInline[])[] }
	// In a document only:
	| { readonly kind: 'heading'; readonly level: 1 | 2 | 3 | 4 | 5 | 6; readonly content: readonly MdInline[] }
	/** Each row has as many cells as the head; `dir` from the head's first letter, as for a quote. */
	| {
			readonly kind: 'table';
			readonly dir: TextDirection | null;
			readonly align: readonly MdAlign[];
			readonly head: readonly (readonly MdInline[])[];
			readonly rows: readonly (readonly (readonly MdInline[])[])[];
	  }
	| { readonly kind: 'rule' };

/** A table column's alignment, as its `:` signs set it (left, right or both); null when it has none. */
export type MdAlign = 'left' | 'center' | 'right' | null;

export interface MdOptions {
	/** A long text pasted from elsewhere (a report): headings, tables, rules and ==highlight== too. */
	readonly document?: boolean;
}

/** Where a link may lead: the web, a mail or a phone number. Anything else (javascript:, data:, a page path) stays text. */
const SAFE_LINK = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d][\d\s.()-]*)$/i;
/**
 * Read at a position (sticky), so nothing is copied. A slash after `//` makes no link, so a run of `(https:///` is
 * not read to its end at each of its `h`.
 */
const BARE_LINK = /https?:\/\/(?!\/)[^\s<>"«»]+/iy;
const LINK_TARGET = /\(\s*([^\s()]+)\s*\)/y;
/** The signs that end a sentence, left out at the end of a bare address. */
const SENTENCE_END = '.,;:!?\'")]';
const ESCAPABLE = /[!-/:-@[-`{-~]/;
const WHITESPACE = /\s/;
const PUNCTUATION = /[\p{P}\p{S}]/u;
const LETTER = /\p{L}/u;
const RIGHT_TO_LEFT_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
/** Quotes inside quotes, at most this deep; a deeper `>` stays text. */
const MAX_QUOTE_DEPTH = 3;

const QUOTE_LINE = /^ {0,3}>(?: ?)(.*)$/;
// `(?! )`: the spaces after the sign are read once, so a line of spaces that ends in a line separator fails at once.
const BULLET_LINE = /^ {0,3}[-*] +(?! )(.*)$/;
const ORDERED_LINE = /^ {0,3}(\d{1,9})[.)] +(?! )(.*)$/;
const RULE_LINE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const TABLE_DELIMITER_CELL = /^:?-+:?$/;
/** A table at most this wide: a wider head stays text, so a short row is never filled out to thousands of cells. */
const MAX_TABLE_COLUMNS = 32;
/** Emphasis drawn this many levels deep at most (bounds the work on hostile input): deeper signs stay as typed. */
const MAX_EMPHASIS_DEPTH = 32;
/** What `.` does not read in a pattern: a heading line holding one is no heading. */
const LINE_END = /[\n\r\u2028\u2029]/;

// ---- Inline ----

interface Delimiter {
	readonly delimiter: true;
	readonly char: '*' | '_';
	count: number;
	readonly original: number;
	readonly canOpen: boolean;
	readonly canClose: boolean;
}

type InlineToken = string | Delimiter | MdInline;

function isDelimiter(token: InlineToken): token is Delimiter {
	return typeof token === 'object' && 'delimiter' in token;
}

function isSpace(char: string): boolean {
	return char === '' || WHITESPACE.test(char);
}

function isPunctuation(char: string): boolean {
	return char !== '' && PUNCTUATION.test(char);
}

/** The run of `*` or `_` at `start`, and whether it may open or close an emphasis (the CommonMark flanking rules). */
function delimiterAt(text: string, start: number, char: '*' | '_'): Delimiter {
	let end = start;
	while (text[end] === char) end++;
	const before = text[start - 1] ?? '';
	const after = text[end] ?? '';
	const leftFlanking = !isSpace(after) && (!isPunctuation(after) || isSpace(before) || isPunctuation(before));
	const rightFlanking = !isSpace(before) && (!isPunctuation(before) || isSpace(after) || isPunctuation(after));
	const canOpen = char === '*' ? leftFlanking : leftFlanking && (!rightFlanking || isPunctuation(before));
	const canClose = char === '*' ? rightFlanking : rightFlanking && (!leftFlanking || isPunctuation(after));
	return { delimiter: true, char, count: end - start, original: end - start, canOpen, canClose };
}

/**
 * What a text's links are read from, once per text, so a long run of `[` costs no more than the text: from each
 * position, the first `]` (a backslash skips the sign after it) or the text's length; for each `]`, the `(href)` after it.
 */
interface LinkFinder {
	readonly closes: Int32Array;
	readonly targets: Map<number, RegExpExecArray | null>;
}

function linkFinder(text: string): LinkFinder {
	const closes = new Int32Array(text.length + 2).fill(text.length);
	for (let p = text.length - 1; p >= 0; p--) closes[p] = text[p] === ']' ? p : closes[p + (text[p] === '\\' ? 2 : 1)];
	return { closes, targets: new Map() };
}

/** `[label](href)` at `start`: its end, label and href, or null when the text there is not one. */
function linkAt(text: string, start: number, finder: LinkFinder): { end: number; label: string; href: string } | null {
	const close = finder.closes[start + 1];
	if (close >= text.length || text[close + 1] !== '(') return null;
	if (!finder.targets.has(close)) {
		LINK_TARGET.lastIndex = close + 1;
		finder.targets.set(close, LINK_TARGET.exec(text));
	}
	const target = finder.targets.get(close);
	const label = text.slice(start + 1, close);
	if (!target || !label.trim()) return null;
	return { end: close + 1 + target[0].length, label, href: target[1] };
}

/** A bare web address at `start`, without the punctuation that ends its sentence. */
function bareLinkAt(text: string, start: number): string | null {
	const before = text[start - 1] ?? '';
	if (before && !isSpace(before) && !'(«"\''.includes(before)) return null;
	BARE_LINK.lastIndex = start;
	const found = BARE_LINK.exec(text);
	if (!found) return null;
	// The signs taken off are never `(`: whether the address holds one stays the same.
	const opens = found[0].includes('(');
	let end = start + found[0].length;
	while (SENTENCE_END.includes(text[end - 1]) && !(text[end - 1] === ')' && opens)) end--;
	const link = text.slice(start, end);
	return /^https?:\/\/[^/]/i.test(link) ? link : null;
}

/** `==highlight==` at `start`: its end and inner text, or null (`a == b`, `===`, nothing to close it). */
function markAt(text: string, start: number): { end: number; inner: string } | null {
	const close = text.indexOf('==', start + 2);
	const inner = text.slice(start + 2, close);
	if (close < 0 || !inner || text[start + 2] === '=' || isSpace(inner[0]) || isSpace(inner[inner.length - 1])) return null;
	return { end: close + 2, inner };
}

function tokenize(text: string, links: boolean, document: boolean): InlineToken[] {
	const tokens: InlineToken[] = [];
	let buffer = '';
	const flush = () => {
		if (buffer) tokens.push(buffer);
		buffer = '';
	};
	let finder: LinkFinder | undefined;
	let i = 0;
	while (i < text.length) {
		const char = text[i];
		const link = links && char === '[' ? linkAt(text, i, (finder ??= linkFinder(text))) : null;
		const href = links && (char === 'h' || char === 'H') ? bareLinkAt(text, i) : null;
		if (char === '\\' && ESCAPABLE.test(text[i + 1] ?? '')) {
			buffer += text[i + 1];
			i += 2;
		} else if (char === '*' || char === '_') {
			flush();
			const run = delimiterAt(text, i, char);
			tokens.push(run);
			i += run.count;
		} else if (link) {
			if (SAFE_LINK.test(link.href)) {
				flush();
				tokens.push({ kind: 'link', href: link.href, children: inlineTree(link.label, false, document) });
			} else {
				buffer += text.slice(i, link.end);
			}
			i = link.end;
		} else if (document && char === '=' && text[i + 1] === '=') {
			const mark = markAt(text, i);
			if (mark) {
				flush();
				tokens.push({ kind: 'mark', children: inlineTree(mark.inner, links, document) });
				i = mark.end;
			} else {
				buffer += '==';
				i += 2;
			}
		} else if (href) {
			flush();
			tokens.push({ kind: 'link', href, children: [{ kind: 'text', text: href }] });
			i += href.length;
		} else {
			buffer += char;
			i++;
		}
	}
	flush();
	return tokens;
}

function asText(token: InlineToken): MdInline {
	if (typeof token === 'string') return { kind: 'text', text: token };
	if (isDelimiter(token)) return { kind: 'text', text: token.char.repeat(token.count) };
	return token;
}

/** Adjacent texts joined, so a view draws one text where the signs were left as typed. */
function merged(nodes: readonly MdInline[]): MdInline[] {
	const out: MdInline[] = [];
	for (const node of nodes) {
		const last = out[out.length - 1];
		if (node.kind === 'text' && last?.kind === 'text') out[out.length - 1] = { kind: 'text', text: last.text + node.text };
		else if (node.kind !== 'text' || node.text) out.push(node);
	}
	return out;
}

/** The signs of each emphasis, as typed (`*`, `**`, `_` or `__`), for one drawn deeper than MAX_EMPHASIS_DEPTH. */
const EMPHASIS_SIGNS = new WeakMap<MdInline, string>();

/**
 * CommonMark's emphasis pass, without its edge cases nobody types: each closer takes the nearest opener of its sign.
 * Read once, left to right, into `read`: a closer's emphasis takes the tokens read after its opener. When a closer
 * finds no opener, the next closer of its kind (sign, can open, length mod 3) looks no lower than it did (CommonMark's
 * openers_bottom), so a long text costs no more than its length.
 */
function emphasise(tokens: readonly InlineToken[]): MdInline[] {
	const read: InlineToken[] = [];
	/** Per kind of closer: below this many tokens of `read`, none is its opener. */
	const bottoms: number[] = new Array(12).fill(0);
	for (const token of tokens) {
		if (!isDelimiter(token) || !token.canClose) {
			read.push(token);
			continue;
		}
		const closer = token;
		const kind = (closer.char === '*' ? 0 : 6) + (closer.canOpen ? 3 : 0) + (closer.original % 3);
		while (closer.count > 0) {
			let openerIndex = read.length - 1;
			for (; openerIndex >= bottoms[kind]; openerIndex--) {
				const opener = read[openerIndex];
				if (!isDelimiter(opener) || opener.char !== closer.char || !opener.canOpen || opener.count === 0) continue;
				const both = opener.canClose || closer.canOpen;
				if (both && (opener.original + closer.original) % 3 === 0 && (opener.original % 3 !== 0 || closer.original % 3 !== 0)) continue;
				break;
			}
			if (openerIndex < bottoms[kind]) {
				bottoms[kind] = read.length;
				read.push(closer.canOpen ? closer : asText(closer));
				break;
			}
			const opener = read[openerIndex] as Delimiter;
			const used = opener.count >= 2 && closer.count >= 2 ? 2 : 1;
			const node: MdInline = { kind: used === 2 ? 'strong' : 'em', children: merged(read.slice(openerIndex + 1).map(asText)) };
			EMPHASIS_SIGNS.set(node, closer.char.repeat(used));
			opener.count -= used;
			closer.count -= used;
			read.length = opener.count === 0 ? openerIndex : openerIndex + 1;
			for (let k = 0; k < bottoms.length; k++) bottoms[k] = Math.min(bottoms[k], read.length);
			read.push(node);
		}
	}
	return merged(read.map(asText));
}

type MdParent = Exclude<MdInline, { kind: 'text' }>;

/** Whether an emphasis lies deeper than MAX_EMPHASIS_DEPTH (a link or a highlight adds no level). */
function tooDeep(nodes: readonly MdInline[]): boolean {
	const left: [readonly MdInline[], number][] = [[nodes, 0]];
	while (left.length) {
		const [list, depth] = left.pop()!;
		for (const node of list) {
			if (node.kind === 'text') continue;
			const inner = node.kind === 'em' || node.kind === 'strong' ? depth + 1 : depth;
			if (inner > MAX_EMPHASIS_DEPTH) return true;
			left.push([node.children, inner]);
		}
	}
	return false;
}

/**
 * The tree with its emphasis drawn MAX_EMPHASIS_DEPTH levels deep at most, the outer ones first: a deeper one is its
 * signs and its content, as typed. Read with a list of open nodes, not by recursion, so no text runs out of stack.
 */
function capped(nodes: MdInline[]): MdInline[] {
	if (!tooDeep(nodes)) return nodes;
	interface Open {
		readonly node: MdParent | null;
		readonly children: readonly MdInline[];
		readonly depth: number;
		/** Where its content goes: its own list, or its parent's when it stays as typed. */
		readonly out: MdInline[];
		readonly typed: boolean;
		next: number;
	}
	const open: Open[] = [{ node: null, children: nodes, depth: 0, out: [], typed: false, next: 0 }];
	for (;;) {
		const current = open[open.length - 1];
		if (current.next < current.children.length) {
			const child = current.children[current.next++];
			if (child.kind === 'text') {
				current.out.push(child);
				continue;
			}
			const depth = child.kind === 'em' || child.kind === 'strong' ? current.depth + 1 : current.depth;
			const typed = depth > MAX_EMPHASIS_DEPTH && depth > current.depth;
			if (typed) current.out.push({ kind: 'text', text: EMPHASIS_SIGNS.get(child) ?? '' });
			open.push({ node: child, children: child.children, depth, out: typed ? current.out : [], typed, next: 0 });
			continue;
		}
		open.pop();
		const parent = open[open.length - 1];
		if (!parent) return merged(current.out);
		if (current.typed) current.out.push({ kind: 'text', text: EMPHASIS_SIGNS.get(current.node!) ?? '' });
		else parent.out.push({ ...current.node!, children: merged(current.out) });
	}
}

function inlineTree(text: string, links: boolean, document: boolean): MdInline[] {
	return emphasise(tokenize(text, links, document));
}

/** One line or paragraph's inline marks. `links` false inside a link's label: no link in a link. `document`: ==highlight== too. */
export function parseInline(text: string, links = true, document = false): MdInline[] {
	return capped(inlineTree(text, links, document));
}

// ---- Blocks ----

function isBlank(char: string | undefined): boolean {
	return char === ' ' || char === '\t';
}

/**
 * A heading line (`# ` to `###### `): its level and its text without the closing `#` signs, or null. Read once, left
 * then right, as the pattern `^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$` reads it, without going over a run of
 * spaces again at each of its spaces.
 */
function headingAt(line: string): { level: number; text: string } | null {
	let start = 0;
	while (start < 3 && line[start] === ' ') start++;
	let level = 0;
	while (line[start + level] === '#') level++;
	const after = start + level;
	if (level === 0 || level > 6 || !isBlank(line[after]) || LINE_END.test(line)) return null;
	let from = after;
	while (isBlank(line[from])) from++;
	let end = line.length;
	while (end > from && isBlank(line[end - 1])) end--;
	// Spaces only: the pattern keeps the last of them as the text, when there are two or more.
	if (end === from) return from - after >= 2 ? { level, text: line[from - 1] } : null;
	let hashes = end;
	while (hashes > from && line[hashes - 1] === '#') hashes--;
	if (hashes < end && hashes > from && isBlank(line[hashes - 1])) {
		end = hashes - 1;
		while (isBlank(line[end - 1])) end--;
	}
	return { level, text: line.slice(from, end) };
}

/** A table row's cells, without its outer pipes; an escaped `\|` stays in its cell, for the inline marks to read. */
function rowCells(line: string): string[] {
	let row = line.trim();
	if (row.startsWith('|')) row = row.slice(1);
	if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
	const cells: string[] = [];
	let start = 0;
	for (let i = 0; i < row.length; i++) {
		if (row[i] === '\\' && row[i + 1] === '|') i++;
		else if (row[i] === '|') {
			cells.push(row.slice(start, i).trim());
			start = i + 1;
		}
	}
	cells.push(row.slice(start).trim());
	return cells;
}

/** The column alignments when `lines[i]` heads a table (a row of pipes over a row of dashes, as many cells), else null. */
function tableAt(lines: readonly string[], i: number): MdAlign[] | null {
	const delimiter = lines[i + 1];
	if (!lines[i].includes('|') || !delimiter?.includes('|')) return null;
	const signs = rowCells(delimiter);
	if (signs.length > MAX_TABLE_COLUMNS || !signs.every((sign) => TABLE_DELIMITER_CELL.test(sign))) return null;
	if (signs.length !== rowCells(lines[i]).length) return null;
	return signs.map((sign) => (sign.startsWith(':') ? (sign.endsWith(':') ? 'center' : 'left') : sign.endsWith(':') ? 'right' : null));
}

/** Whether `lines[i]` starts a block of its own, so the paragraph before it ends there. */
function startsBlock(lines: readonly string[], i: number, document: boolean): boolean {
	const line = lines[i];
	if (QUOTE_LINE.test(line) || ORDERED_LINE.exec(line)?.[1] === '1') return true;
	if (document && (headingAt(line) || RULE_LINE.test(line) || tableAt(lines, i))) return true;
	return BULLET_LINE.test(line);
}

function parseBlocks(lines: readonly string[], depth: number, document: boolean): MdBlock[] {
	const blocks: MdBlock[] = [];
	const inline = (text: string) => parseInline(text, true, document);
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (!line.trim()) {
			i++;
			continue;
		}
		if (depth < MAX_QUOTE_DEPTH && QUOTE_LINE.test(line)) {
			const inner: string[] = [];
			while (i < lines.length && QUOTE_LINE.test(lines[i])) inner.push(QUOTE_LINE.exec(lines[i++])![1]);
			const quoted = parseBlocks(inner, depth + 1, document);
			blocks.push({ kind: 'quote', dir: textDirection(blocksPlain(quoted)), blocks: quoted });
			continue;
		}
		const heading = document ? headingAt(line) : null;
		if (heading) {
			blocks.push({ kind: 'heading', level: heading.level as 1 | 2 | 3 | 4 | 5 | 6, content: inline(heading.text) });
			i++;
			continue;
		}
		if (document && RULE_LINE.test(line)) {
			blocks.push({ kind: 'rule' });
			i++;
			continue;
		}
		const align = document ? tableAt(lines, i) : null;
		if (align) {
			const width = align.length;
			// A row's cells read once; a short row filled out to the head's width, a long one cut to it.
			const cells = (row: string) => {
				const typed = rowCells(row);
				const read: MdInline[][] = [];
				for (let n = 0; n < width; n++) read.push(n < typed.length ? inline(typed[n]) : []);
				return read;
			};
			const head = cells(line);
			const rows: MdInline[][][] = [];
			for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) rows.push(cells(lines[i]));
			blocks.push({ kind: 'table', dir: textDirection(head.map(inlinePlain).join(' ')), align, head, rows });
			continue;
		}
		const ordered = ORDERED_LINE.exec(line);
		if (ordered || BULLET_LINE.test(line)) {
			const pattern = ordered ? ORDERED_LINE : BULLET_LINE;
			const items: string[] = [];
			while (i < lines.length && lines[i].trim()) {
				const item = pattern.exec(lines[i]);
				if (item) items.push(item[ordered ? 2 : 1]);
				else if (/^\s+\S/.test(lines[i])) items[items.length - 1] += `\n${lines[i].trim()}`;
				else break;
				i++;
			}
			blocks.push({ kind: 'list', ordered: !!ordered, start: ordered ? Number(ordered[1]) : 1, items: items.map(inline) });
			continue;
		}
		const paragraph = [line];
		i++;
		// A quote, a bullet or a list that starts at 1 ends the paragraph; « 2026. Une année » does not.
		while (i < lines.length && lines[i].trim() && !startsBlock(lines, i, document)) paragraph.push(lines[i++]);
		blocks.push({ kind: 'paragraph', content: inline(paragraph.join('\n')) });
	}
	return blocks;
}

export type TextDirection = 'ltr' | 'rtl';

/**
 * A text's direction from its first letter (« ﴿ », digits and signs are not letters); null when it has none. For an
 * element whose text sits in children with their own `dir`: `dir="auto"` skips those, so it would read left to right.
 */
export function textDirection(text: string): TextDirection | null {
	const letter = LETTER.exec(text)?.[0];
	if (!letter) return null;
	return RIGHT_TO_LEFT_LETTER.test(letter) ? 'rtl' : 'ltr';
}

/** A multi-line text's blocks. */
export function parseMarkdown(text: string | null | undefined, options: MdOptions = {}): MdBlock[] {
	return parseBlocks((text ?? '').replace(/\r\n?/g, '\n').split('\n'), 0, !!options.document);
}

// ---- Plain text ----

/** A link whose label starts at `from` in inlinePlain's parts, to read once its label is. */
interface LinkEnd {
	readonly link: Extract<MdInline, { kind: 'link' }>;
	readonly from: number;
}

/** The nodes' text, read with a list of what is left, not by recursion, so no tree runs out of stack. */
function inlinePlain(nodes: readonly MdInline[]): string {
	const parts: string[] = [];
	const left: (MdInline | LinkEnd)[] = [];
	const later = (list: readonly MdInline[]) => {
		for (let n = list.length - 1; n >= 0; n--) left.push(list[n]);
	};
	later(nodes);
	while (left.length) {
		const item = left.pop()!;
		if ('link' in item) {
			const label = parts.splice(item.from).join('');
			const target = item.link.href.replace(/^(mailto|tel):/i, '');
			parts.push(label === item.link.href || label === target ? label : `${label} (${target})`);
		} else if (item.kind === 'text') {
			parts.push(item.text);
		} else {
			if (item.kind === 'link') left.push({ link: item, from: parts.length });
			later(item.children);
		}
	}
	return parts.join('');
}

function blocksPlain(blocks: readonly MdBlock[]): string {
	return blocks
		.map((block) => {
			if (block.kind === 'paragraph' || block.kind === 'heading') return inlinePlain(block.content);
			if (block.kind === 'quote') return blocksPlain(block.blocks);
			if (block.kind === 'table') return [block.head, ...block.rows].map((row) => row.map(inlinePlain).join(' | ')).join('\n');
			if (block.kind === 'rule') return '';
			return block.items.map((item, n) => `${block.ordered ? `${block.start + n}.` : '-'} ${inlinePlain(item)}`).join('\n');
		})
		.filter((part) => part !== '')
		.join('\n\n');
}

/**
 * The text without its markdown signs, for every place that needs plain text. `inline` reads only inline marks, as a
 * title or a label does; else the blocks too. A link keeps its address: « label (address) ».
 */
export function plainText(text: string | null | undefined, inline = false): string {
	if (!text) return '';
	return inline ? inlinePlain(parseInline(text)) : blocksPlain(parseMarkdown(text));
}

/** A plain text (a name) put where a title is read as markdown: its `*`, `_`, `[` and `\\` stay as typed. */
export function escapeMarkdown(text: string): string {
	return text.replace(/[\\*_[]/g, '\\$&');
}

/** Whether the text has any markdown a view draws (a mark, a link, a quote or a list), so a preview is worth showing. */
export function hasMarkdown(text: string | null | undefined, inline = false, options: MdOptions = {}): boolean {
	if (!text) return false;
	const marked = (nodes: readonly MdInline[]) => nodes.some((node) => node.kind !== 'text');
	if (inline) return marked(parseInline(text));
	const blocks = (list: readonly MdBlock[]): boolean =>
		list.some((block) => block.kind !== 'paragraph' || marked(block.content));
	return blocks(parseMarkdown(text, options));
}
