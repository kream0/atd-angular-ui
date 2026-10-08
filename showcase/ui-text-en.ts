// English texts for the primitives' own words, the keys of UiTextService. Without a text source the primitives speak
// French (each call's fallback); an app copies this map, translates it, or wires its own translations instead.
export const UI_TEXT_EN: Readonly<Record<string, string>> = {
	'common.back': 'Back',
	'common.close': 'Close',
	'common.countOf': '{{value}} of {{max}}',
	'common.loading': 'Loading…',
	'common.markdown.bold': 'Bold',
	'common.markdown.italic': 'Italic',
	'common.markdown.list': 'List',
	'common.markdown.preview': 'Preview',
	'common.markdown.quote': 'Quotation',
	'common.markdown.quotes': 'Quotation marks',
	'common.markdown.table': 'Table',
	'common.markdown.toolbar': 'Formatting',
	'common.newTab': '(new tab)',
	'common.requiredMark': '(required)',
	'common.stepDone': '(done)',
	'common.stepOf': 'Step {{current}} of {{total}}',
	'shell.navLabel': 'Main navigation',
};
