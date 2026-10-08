/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

// The tokens live in ./styles/ui.scss as RGB channels, so alpha modifiers (`bg-ui-accent/10`) keep working.
const ui = (name) => `rgb(var(--ui-${name}) / <alpha-value>)`;
const arabic = ['"Noto Naskh Arabic"', '"Geeza Pro"', '"Amiri"', '"Scheherazade New"', '"Traditional Arabic"', 'serif'];

// The UI kit's Tailwind 3 preset: the `ui-*` colours, radii, shadows, display sizes and font stacks, the class dark
// mode and the forms plugin. No `content`: the app's own config lists its files (and the copied `ui/` folder with them).
module.exports = {
	// The `dark` class on <html> switches the tokens (./styles/ui.scss). The primitives use no `dark:` variant.
	darkMode: ['class'],
	theme: {
		extend: {
			colors: {
				ui: {
					bg: ui('bg'),
					surface: ui('surface'),
					fg: ui('fg'),
					muted: ui('muted'),
					line: ui('line'),
					'line-strong': ui('line-strong'),
					accent: ui('accent'),
					'accent-fg': ui('accent-fg'),
					'accent-ink': ui('accent-ink'),
					focus: ui('focus'),
					danger: ui('danger'),
					'danger-ink': ui('danger-ink'),
					'success-ink': ui('success-ink'),
					'warning-ink': ui('warning-ink'),
					'accent-soft': ui('accent-soft'),
					'danger-soft': ui('danger-soft'),
					gold: ui('gold'),
					'gold-ink': ui('gold-ink'),
					band: ui('band'),
					'band-fg': ui('band-fg'),
				},
			},
			// Shape and depth tokens. Values live in ./styles/ui.scss.
			borderRadius: {
				'ui-sm': 'var(--ui-radius-sm)',
				ui: 'var(--ui-radius)',
				'ui-lg': 'var(--ui-radius-lg)',
			},
			boxShadow: {
				'ui-sm': 'var(--ui-shadow-sm)',
				'ui-lg': 'var(--ui-shadow-lg)',
			},
			fontSize: {
				// Display sizes for El Messiri titles; reading sizes are Tailwind's (xs 12, sm 14, base 16, lg 18).
				'ui-section': ['1.3125rem', { lineHeight: '1.75rem' }],
				'ui-title': ['1.625rem', { lineHeight: '2rem' }],
				'ui-hero': ['2rem', { lineHeight: '2.375rem' }],
			},
			fontFamily: {
				// The @font-face rules are in ./fonts.css.
				mono: ['"JetBrains Mono"', '"JetBrains Mono Fallback"', ...defaultTheme.fontFamily.mono, ...arabic],
				// El Messiri (Latin and Arabic subsets) for titles in both directions.
				display: ['"El Messiri"', '"El Messiri Fallback"', ...arabic],
				// System Arabic fonts, none bundled.
				arabic,
			},
		},
	},
	plugins: [require('@tailwindcss/forms')],
};
