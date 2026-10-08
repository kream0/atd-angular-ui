/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [require('./theme/tailwind-preset.js')],
	content: ['./ui/**/*.{html,ts}', './showcase/**/*.{html,ts}'],
	// No `bg-opacity-*`-style utilities (use the `/70` modifier): a colour class is then one declaration, not a
	// `--tw-*-opacity` variable and an rgb() that reads it. Same colours, smaller styles. The primitives need none of
	// them; an app that uses the opacity utilities leaves this out.
	corePlugins: {
		backgroundOpacity: false,
		borderOpacity: false,
		divideOpacity: false,
		placeholderOpacity: false,
		ringOpacity: false,
		textOpacity: false,
	},
};
