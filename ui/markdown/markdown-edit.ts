/**
 * What a toolbar button of the markdown input does: wrap the selection (bold, italic, French quotes « ») or mark its
 * lines (quote, list).
 */
export type MdMark = 'bold' | 'italic' | 'quotes' | 'quote' | 'list';

export interface MdEdit {
	readonly value: string;
	/** The selection after the edit: the same words, inside their new signs. */
	readonly start: number;
	readonly end: number;
}

export interface MdMarkOptions {
	/** Quotes with no space inside (Arabic: «نص»); else the French « text », with no-break spaces. */
	readonly tight?: boolean;
}

const PREFIXES: Record<'quote' | 'list', string> = { quote: '> ', list: '- ' };

/** Whether `text` starts (or ends) with `sign`. An italic sign is one `*`: the edge of a bold `**` is not one, the edge of a bold italic `***` is. */
function signed(text: string, sign: string, atEnd: boolean): boolean {
	const has = (s: string) => (atEnd ? text.endsWith(s) : text.startsWith(s));
	return has(sign) && (sign !== '*' || !has('**') || has('***'));
}

/** Puts the signs around the selection, or takes them off when they are already there. Spaces stay outside. */
function wrap(value: string, start: number, end: number, open: string, close: string): MdEdit {
	let from = start;
	let to = end;
	while (from < to && /\s/.test(value[from])) from++;
	while (to > from && /\s/.test(value[to - 1])) to--;
	const before = value.slice(0, from);
	const after = value.slice(to);
	const inner = value.slice(from, to);
	if (signed(before, open, true) && signed(after, close, false)) {
		return { value: before.slice(0, -open.length) + inner + after.slice(close.length), start: from - open.length, end: to - open.length };
	}
	if (inner.length > open.length + close.length && signed(inner, open, false) && signed(inner, close, true)) {
		const bare = inner.slice(open.length, -close.length);
		return { value: before + bare + after, start: from, end: from + bare.length };
	}
	return { value: before + open + inner + close + after, start: from + open.length, end: to + open.length };
}

/** Marks every line the selection touches (quote or list), or unmarks them when all already are. Empty lines stay. */
function prefixLines(value: string, start: number, end: number, prefix: string): MdEdit {
	const lineStart = value.lastIndexOf('\n', start - 1) + 1;
	const nextBreak = value.indexOf('\n', Math.max(end - (end > start && value[end - 1] === '\n' ? 1 : 0), start));
	const lineEnd = nextBreak < 0 ? value.length : nextBreak;
	const lines = value.slice(lineStart, lineEnd).split('\n');
	const marker = prefix.trimEnd();
	const filled = lines.filter((line) => line.trim());
	const allMarked = filled.length > 0 && filled.every((line) => line.startsWith(marker));
	const changed = lines.map((line) => {
		if (!line.trim()) return line;
		if (allMarked) return line.startsWith(prefix) ? line.slice(prefix.length) : line.slice(marker.length);
		return line.startsWith(marker) ? line : prefix + line;
	});
	const block = changed.join('\n');
	return { value: value.slice(0, lineStart) + block + value.slice(lineEnd), start: lineStart, end: lineStart + block.length };
}

/** The text after a toolbar button, on the selection from `start` to `end`. */
export function applyMark(value: string, start: number, end: number, mark: MdMark, options: MdMarkOptions = {}): MdEdit {
	const from = Math.max(0, Math.min(start, end, value.length));
	const to = Math.min(value.length, Math.max(start, end));
	switch (mark) {
		case 'bold':
			return wrap(value, from, to, '**', '**');
		case 'italic':
			return wrap(value, from, to, '*', '*');
		case 'quotes':
			return options.tight ? wrap(value, from, to, '«', '»') : wrap(value, from, to, '«\u00a0', '\u00a0»');
		default:
			return prefixLines(value, from, to, PREFIXES[mark]);
	}
}
