# atd-angular-ui

A UI kit of Angular 19 standalone components styled with Tailwind CSS 3, and a small Angular workspace that renders every component on one showcase page and runs their specs.

The kit is meant to be copied into an app as source, not installed as a package. This README is written for a coding agent that will reuse the kit in another project and extend it.

## What it is

- 33 folders under `ui/`: one folder per component, plus `core/` (shared helpers), `icon/` (icon component and icon set) and `showcase/` (the demo page).
- Angular 19 standalone components and directives. They all use `ChangeDetectionStrategy.OnPush` and signal APIs (`input()`, `input.required()`, `model()`, `output()`, `computed()`), and set host attributes with `host: {}`.
- Styled with Tailwind 3 classes in inline templates. There are no component stylesheets.
- Native elements wherever possible: `<button>`, `<a>`, `<input>`, `<select>`, `<dialog>`, `<progress>`. The kit adds behaviour with attribute selectors (`button[appUiButton]`), so `type`, `disabled`, `routerLink`, `ngModel` and reactive forms work without a ControlValueAccessor.
- No runtime dependency beyond Angular itself: no @angular/cdk, no popper library, no icon font, no animation library.

### Look

The kit started as an Angular port of the ATD design system. ATD's look is a sand / obsidian / ink / signal / fault palette, mono type for chrome, serif titles, `rounded-sm` corners, and rings instead of shadows.

The visual identity of this fork has since moved away from ATD. What the code ships today:

- **Palette:** ivory and pale sage grounds, a deep emerald accent and brass used sparingly. Dark mode is a green-black night with the same hues lifted.
- **Type:** titles in El Messiri 600 (display face, Latin and Arabic subsets bundled). Reading text and controls use the system sans in sentence case. JetBrains Mono is bundled for codes and counters only.
- **Shape:** radii of 6, 10 and 16 px (`rounded-ui-sm`, `rounded-ui`, `rounded-ui-lg`) plus `rounded-full`.
- **Depth:** green-tinted shadows (`shadow-ui-sm`, `shadow-ui-lg`) together with a `ring-1 ring-ui-line` hairline.

To go back to the ATD look, change the token values in `theme/styles/ui.scss` and the fonts. The components only use tokens, so they need no edit.

### Components

All selectors use the `app` prefix. "Slot" means an attribute that marks projected content.

| Folder | Selector(s) | What it is |
|---|---|---|
| `app-bar` | `app-ui-app-bar`; slots `[appUiAppBarLeading]`, `[appUiAppBarActions]` | Sticky top bar: a `header` landmark, 56 px plus the top safe area. Input `title`. |
| `arabic` | `[appUiArabic]` | A passage of Arabic text inside a page in another language. Sets `lang="ar"`, `dir="rtl"` and `font-arabic text-start leading-loose`. |
| `avatar` | `app-ui-avatar` | A round photo, or initials when there is none. Inputs: `name` (required), `src`, `size`, `decorative`. |
| `badge` | `app-ui-badge` | A pill with a decorative dot; the text carries the meaning. Inputs: `tone` (neutral, accent, success, warning, danger) and `dot`. |
| `banner` | `app-ui-banner` | An inline message with an icon. Inputs: `tone` (info, success, warning, danger), `title`, `dismissible`, `announce`, `dismissLabel`. Output: `dismissed`. |
| `bottom-navigation` | `app-bottom-navigation` | The phone tab bar: `nav` with 3 to 5 router links, an icon and a visible label each, and `aria-current="page"`. Hidden from `lg` up and in print. Inputs: `items` (`UiBottomNavItem[]`) and `label`. |
| `button` | `button[appUiButton]`, `a[appUiButton]` | Text button or link button. Inputs: `variant` (primary, secondary, ghost, danger), `size` (md, sm; both at least 44 px tall), `loading` (sets `aria-busy` and disables the button, with a hidden "loading" text) and `disabled`. |
| `card` | `app-ui-card`; slots `[appUiCardHeader]`, `[appUiCardFooter]`; `[appUiStretchedLink]` | A surface. `appUiStretchedLink` on the card's one link makes the whole card clickable through `::after`, with no nested interactive elements. |
| `checkbox` | `input[type=checkbox][appUiCheckbox]` | A native checkbox. Put it inside a label at least 44 px tall. |
| `core` | (no selector) | `uiId()` (page-unique ids), `focusableIn()` and `firstFieldIn()`, `UI_CONTROL_CLASSES`, and the UI text layer (`UiTextService`, `UI_TEXT_SOURCE`, `provideUiTextSource`, `uiTextDictionary`). |
| `dialog` | `app-ui-dialog`; slots `[appUiDialogFooter]`, `[appUiDialogTitle]` | A modal on native `<dialog>` + `showModal()`. Two-way `open` (`model`). Inputs: `title` (required), `mode` (dialog, sheet, drawer), `destructive`, `closeLabel`. Output: `closed` (a role string). |
| `empty-state` | `app-ui-empty-state` | An empty list or page: icon, real heading, text and one action. Inputs: `title` (required), `text`, `icon`, `headingLevel` (2, 3 or 4). |
| `field` | `app-ui-field`; `[appUiControl]` on the projected control | Label, hint and error around one control. Wires `for`, `id`, `aria-describedby`, `aria-invalid` and `required`, and writes the required mark as text. Inputs: `label` (required), `hint`, `error`, `required`. |
| `icon` | `app-ui-icon` | An inline SVG icon in `currentColor`, decorative unless it has a `label`. Inputs: `icon` (required, a `UiIcon` constant), `size`, `strokeWidth`, `label`. Icons with `mirror: true` flip in RTL. |
| `icon-button` | `button[appUiIconButton]`, `a[appUiIconButton]` | A 44 × 44 button with only an icon. Inputs: `label` (required, becomes `aria-label`), `icon`, `iconSize`, `variant` (ghost, secondary, primary), `pressed` (`aria-pressed` toggle), `disabled`. |
| `input` | `input[appUiInput]` | A text input: 16 px text, `dir="auto"` by default. Input: `dir`. |
| `link` | `a[appUiLink]` | An underlined text link in the accent ink. With `external`, it opens a new tab with `rel="noopener noreferrer"` and a hidden "(new tab)" text. |
| `list` | `ul[appUiList]`, `ol[appUiList]`, `li[appUiListItem]`; slots `[appUiListLeading]`, `[appUiListTitle]`, `[appUiListMeta]`, `[appUiListTrailing]` | A stacked list. Each row is at least 56 px tall and is one link or button (use `appUiStretchedLink`). |
| `markdown` | `app-ui-markdown`, `app-ui-markdown-input` | A small, safe markdown subset (`markdown.ts`), drawn with Angular bindings and never with `innerHTML`. `app-ui-markdown` inputs: `text`, `inline`, `document`. `app-ui-markdown-input` wraps a field's control with a formatting toolbar and a preview; inputs `inline`, `document`, `value`. `plainText()` strips the signs. |
| `menu` | `app-ui-menu`, `button[appUiMenuItem]`, `a[appUiMenuItem]` | An actions menu behind an icon-button trigger. Menu inputs: `label` (required) and `icon`; item input: `tone` (default, danger). See "Overlays" below for how it is positioned. |
| `page-header` | `app-ui-page-header`; slots `[appUiPageActions]`, `[appUiPageEnd]` | The page's only `h1`, in the display face, with an optional back link and actions. Inputs: `title` (required), `subtitle`, `back` (a router path), `backLabel`, `markdownTitle`, `markdownSubtitle`. |
| `progress` | `app-ui-progress` | A native `<progress>` with a visible text value. Inputs: `label` (required), `value` (required), `max`, `countLabel` ("3 of 8" instead of a percentage). |
| `radio` | `input[type=radio][appUiRadio]`, `fieldset[appUiFieldset]` | A native radio, and a fieldset whose `legend` names the group. Fieldset inputs: `legend` (required), `hint`, `error`, `required`. |
| `select` | `select[appUiSelect]` | A native select. The chevron sits at the inline end. |
| `showcase` | `app-ui-showcase` | Every component on one page, with sample data. `?theme=dark` and `?dir=rtl` set the theme and direction on load. You can delete this folder in an app. |
| `skeleton` | `app-ui-skeleton` | Placeholder blocks while content loads (`aria-busy`). Inputs: `kind` (lines, list, card), `rows`, `label`. |
| `spinner` | `app-ui-spinner` | A loading arc with `role="status"` and a hidden label. Inputs: `size`, `label`, `decorative`. |
| `steps` | `app-ui-steps` | Multi-step progress: an `ol` with `aria-current="step"` and a visible "Step 2 of 4". Inputs: `steps` (required) and `current` (required). |
| `switch` | `input[type=checkbox][appUiSwitch]` | A native checkbox with `role="switch"`. |
| `tabs` | `app-ui-tabs`, `app-ui-segmented`, `[appUiScrollCue]` | Tabs: `tablist` with roving tabindex. Two-way `selected`; inputs `tabs` and `label` (all required). Segmented: a radio group for 2 to 4 views. Two-way `value`; inputs `options` and `label` (all required). The scroll cue fades the edge of a row that has more to scroll. |
| `textarea` | `textarea[appUiTextarea]` | A textarea with the input look. Inputs: `rows`, `dir`. |
| `toast` | `app-ui-toaster`, `app-ui-toast`, `[appUiStickyActions]` | Toasts in two live regions. Errors stay until closed; other toasts last at least 5 s. Toaster input: `toasts` (`UiToastItem[]`); outputs `dismissed` and `action` (the toast id). A single `app-ui-toast` takes `kind` (info, success, warning, error), `message` (required), `title`, `duration`, `actionLabel`, `closeLabel`, and emits `closed` and `action`. `appUiStickyActions` marks a sticky form action row, so that toasts move under the app bar. |

Every folder has an `index.ts`, and `ui/index.ts` re-exports every folder except `showcase`. Icons are not all in the barrel: import each from its own file, `ui/icon/set/<name>`, except the few that the first screen needs, which `ui/icon/icons.ts` re-exports (see the comment at its top: an icon re-exported there lands in the initial bundle).

## How to consume (recommended: copy)

The steps below assume the usual Angular CLI layout: `src/app`, `src/styles.scss`, and `tailwind.config.js` at the project root.

### 1. Copy the files

| From this repo | To the app | Notes |
|---|---|---|
| `ui/` | `src/app/shared/ui/` | Keep the specs. Delete `src/app/shared/ui/showcase/` if you do not want the demo page. |
| `theme/` | `theme/` (project root) | Contains `tailwind-preset.js`, `styles/ui.scss`, `fonts.css`, and `fonts/` (3 woff2 files plus 2 OFL licence files). |

You can put `theme/` somewhere else. If you do, change the three paths below to match.

### 2. Dependencies

The kit is tested with these exact versions:

- `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`, `@angular/platform-browser` 19.2.15;
- `rxjs` 7.8.2, `tslib` 2.8.1, `zone.js` 0.15.1;
- dev: `tailwindcss` 3.4.18, `@tailwindcss/forms` 0.5.10, `postcss` 8.5.6, `typescript` 5.7.3.

Why some packages are needed:

- `@angular/forms`: the markdown input reads an optional `NgControl`.
- `@angular/router`: the bottom navigation and the page header's back link use `RouterLink`.
- `@tailwindcss/forms`: the preset loads it. The control classes are written against its base reset, and undo its focus ring.

```sh
npm install --save-dev tailwindcss@3.4.18 @tailwindcss/forms@0.5.10 postcss@8.5.6
```

### 3. `tailwind.config.js`

```js
module.exports = {
	presets: [require('./theme/tailwind-preset.js')],
	content: ['./src/**/*.{html,ts}'],
	// ...the app's own theme.extend and plugins, if any
};
```

The `content` glob must cover `src/app/shared/ui/**`. Tailwind only generates the classes it finds in those files.

### 4. `src/styles.scss`

Put these lines at the top of the file, in this order:

```scss
@use 'tailwindcss/base';
@use 'tailwindcss/components';
@use 'tailwindcss/utilities';
@use '../theme/styles/ui';
```

`ui.scss` uses `@layer`, `@apply` and `theme()`. These only work when the file sits in the same Sass entry as Tailwind's three layers, which is why it is loaded with `@use` rather than as a separate `styles` entry.

### 5. `angular.json` (fonts)

Add `theme/fonts.css` to the `styles` array of the build target and of the `test` target:

```json
"styles": ["src/styles.scss", "theme/fonts.css"],
```

`fonts.css` refers to the woff2 files by relative URL (`./fonts/...`). The `@angular-devkit/build-angular:application` builder, and the karma builder, copy them into the output (`media/`) under hashed names. You need no `assets` entry for them.

If you would rather serve the fonts from `src/assets/fonts`:

1. Copy `theme/fonts/*` there.
2. Make sure `src/assets` is in the build `assets` array (as in a new Angular CLI app):

   ```json
   "assets": [{ "glob": "**/*", "input": "src/assets", "output": "assets" }]
   ```

3. Copy the six `@font-face` rules from `theme/fonts.css` into a `<style>` in `src/index.html`, changing `url(./fonts/` to `url(assets/fonts/`.
4. Do not add `theme/fonts.css` to `styles`.

### 6. Dark mode and the first paint

The tokens switch on the `dark` class of `<html>`. Copy the inline script from `showcase/index.html` into the `<head>` of `src/index.html`. It sets `class="dark"` and `color-scheme` before the first paint, so the page does not flash. Also add:

```html
<meta name="color-scheme" content="light dark">
```

The kit has no theme service. Your app owns the toggle: set or remove `dark` on `document.documentElement`, set `style.colorScheme`, and store the choice. The showcase's `setTheme()` in `ui/showcase/showcase.component.ts` is an example; it stores `darkMode` = `'true'` / `'false'` in localStorage, which is the key the script reads.

### 7. UI text (labels such as "Close" and "Loading…")

Some components have words of their own: close buttons, loading text, the required mark, "Step 2 of 4", the navigation label, the markdown toolbar. They read them through `UiTextService`:

- Each call has a French fallback.
- Without a provider, the components show the French text.
- To change the language, provide a text source in `bootstrapApplication` (or `ApplicationConfig`).

**From a dictionary.** Copy `showcase/ui-text-en.ts`, which lists all 17 keys:

```ts
import { provideUiTextSource, uiTextDictionary } from './app/shared/ui/core';
import { UI_TEXT_EN } from './ui-text-en';

providers: [provideUiTextSource(() => uiTextDictionary(() => UI_TEXT_EN))];
```

`uiTextDictionary` reads its function on every call. Pass a signal or a `computed()` of the current language's map, and OnPush components update when the language changes.

**From @ngx-translate/core (or any translate service).** The factory runs in an injection context. Make it depend on a signal that changes with the language:

```ts
import { inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { provideUiTextSource } from './app/shared/ui/core';

provideUiTextSource(() => {
	const translate = inject(TranslateService);
	const version = signal(0);
	const bump = () => version.update((n) => n + 1);
	translate.onLangChange.subscribe(bump);
	translate.onTranslationChange.subscribe(bump);
	translate.onDefaultLangChange.subscribe(bump);
	return {
		translate: (key, params) => {
			version(); // read, so templates and computeds re-run on a language change
			return translate.instant(key, params);
		},
	};
});
```

A result that equals the key, or that is not a string, counts as missing, and the component shows its fallback.

The keys:

- `common.back`, `common.close`, `common.countOf` (`{{value}}`, `{{max}}`), `common.loading`, `common.newTab`, `common.requiredMark`, `common.stepDone`, `common.stepOf` (`{{current}}`, `{{total}}`);
- `common.markdown.bold`, `.italic`, `.list`, `.preview`, `.quote`, `.quotes`, `.table`, `.toolbar`;
- `shell.navLabel`.

### 8. tsconfig

The kit compiles under the Angular CLI defaults with `strict`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noImplicitReturns` and `strictTemplates` (see `tsconfig.json` here). It needs no path alias: every import inside `ui/` is relative.

## How to extend

To add a component:

1. Create `ui/<name>/` with `<name>.component.ts` (or `<name>.directive.ts` for behaviour on a native element), `<name>.component.spec.ts` and an `index.ts` that exports the public symbols.
2. Add `export * from './<name>';` to `ui/index.ts`.
3. Add a section to `ui/showcase/showcase.component.ts`: a `<section id="..." aria-labelledby="h-...">` with an `h2`. The showcase spec checks one `h1`, unique ids, a name on every control, and 44 px buttons and tabs.
4. Run `npm run test:ci` and look at the page with `npm start`, in light, dark (`?theme=dark`) and RTL (`?dir=rtl`), at 390 px wide and at desktop width.

Follow the existing pattern:

- **Component setup:** `standalone: true` and `changeDetection: ChangeDetectionStrategy.OnPush`.
- **APIs:**
  - inputs with `input()` / `input.required()`, booleans with `{ transform: booleanAttribute }`;
  - two-way state with `model()`, events with `output()`, derived state with `computed()`;
  - DOM access with `viewChild()` / `contentChild()` and `inject(ElementRef)`, and DOM effects in `effect()` or `afterNextRender()`;
  - no `@Input()` / `@Output()` decorators.
- **Styling:**
  - classes in the template, or on `host: { class: '...' }`; no `styles` / `styleUrl`;
  - variant maps hold complete class strings (`Record<Variant, string>`). Tailwind cannot see `bg-${tone}`.
- **Native first:** an attribute directive on a native element beats a wrapper element. Reuse `UI_CONTROL_CLASSES` for text controls and `.ui-focus` for focus rings.
- **Colours:**
  - only `ui-*` tokens (`bg-ui-surface`, `text-ui-muted`, `ring-ui-line`, `text-ui-danger-ink`, `bg-ui-accent/90`);
  - never a raw colour: no hex, no `rgb()`, no Tailwind palette class such as `bg-red-500` or `text-gray-600`;
  - no `dark:` variants, because the tokens switch by themselves.
- **Shapes:** only `rounded-ui-sm`, `rounded-ui`, `rounded-ui-lg`, `rounded-full` or `rounded-none`. Shadows: only `shadow-ui-sm` (cards, lists) and `shadow-ui-lg` (dialogs, menus, toasts).
- **Words:** a component's own words go through `UiTextService.get('common.<key>', '<French fallback>')`. Add the key to `showcase/ui-text-en.ts`.
- **Icons:** add one file per icon in `ui/icon/set/` (a `UiIcon` constant with path `d` strings, 24 × 24, stroke 2). Export it from `ui/icon/set/index.ts`, and keep the licence notice if it comes from another set.
- **Security:** never bind user text through `innerHTML`. The toast and markdown specs check this.
- **Specs:** a spec covers the accessibility contract (roles, names, keys, focus) and the behaviour. The existing specs show the TestBed host-component pattern.

## Tokens

All tokens are CSS custom properties in `theme/styles/ui.scss`:

- light values on `:root`;
- dark values on `.dark`;
- colours stored as RGB channels (`--ui-accent: 11 93 75`), which `theme/tailwind-preset.js` maps to `rgb(var(--ui-accent) / <alpha-value>)`, so opacity modifiers work (`bg-ui-accent-soft/60`).

| Tailwind colour | CSS variable | Role | Light | Dark |
|---|---|---|---|---|
| `ui-bg` | `--ui-bg` | page ground | `#F3F4EE` pale sage | `#0F1714` |
| `ui-surface` | `--ui-surface` | cards, sheets, inputs, menus | `#FFFDF8` ivory | `#17221E` |
| `ui-fg` | `--ui-fg` | text | `#1C2B25` | `#EEEBE0` |
| `ui-muted` | `--ui-muted` | secondary text, placeholders | `#56655E` | `#A2ADA6` |
| `ui-line` | `--ui-line` | decorative hairlines and rings | `#DCDDD3` | `#2B3732` |
| `ui-line-strong` | `--ui-line-strong` | control borders (3:1) | `#7D8A82` | `#71807A` |
| `ui-accent` | `--ui-accent` | primary fill | `#0B5D4B` emerald | `#5DBB98` |
| `ui-accent-fg` | `--ui-accent-fg` | text on the accent fill | `#FFFDF8` | `#0F1714` |
| `ui-accent-ink` | `--ui-accent-ink` | accent as text, icon, link, checked fill | `#0B5D4B` | `#6FC7A6` |
| `ui-accent-soft` | `--ui-accent-soft` | hover, selected and info grounds | `#E2EEE6` | `#1C342C` |
| `ui-focus` | `--ui-focus` | focus outline | `#0B5D4B` | `#6FC7A6` |
| `ui-danger` | `--ui-danger` | danger fill | `#A8322D` | `#E8786E` |
| `ui-danger-ink` | `--ui-danger-ink` | error text and icons | `#A8322D` | `#F0897F` |
| `ui-danger-soft` | `--ui-danger-soft` | error grounds | `#F8E7E3` | `#3A201E` |
| `ui-success-ink` | `--ui-success-ink` | success text | `#3B6B22` | `#9CCB7E` |
| `ui-warning-ink` | `--ui-warning-ink` | warning text | `#875700` | `#E2B65C` |
| `ui-gold` | `--ui-gold` | brass ornament (motif, divider star) | `#B08A3E` | `#C9A45E` |
| `ui-gold-ink` | `--ui-gold-ink` | brass as text | `#7A5A1C` | `#D8B877` |
| `ui-band` | `--ui-band` | a deep emerald band (hero, footer) | `#0B4A3C` | `#13302A` |
| `ui-band-fg` | `--ui-band-fg` | text on the band | `#F6F1E3` | `#F1EBDC` |

Every text pair passes WCAG AA (4.5:1), and every border, focus and state colour passes 3:1. Disabled controls are exempt and use `opacity-50`. The page's ground colour before the styles load is hard-coded in the `<style>` of `showcase/index.html`; keep it in step with `--ui-bg` and `--ui-fg`.

Other tokens:

- **Radius:** `--ui-radius-sm` 6px (`rounded-ui-sm`), `--ui-radius` 10px (`rounded-ui`: controls and buttons), `--ui-radius-lg` 16px (`rounded-ui-lg`: cards, dialogs, menus).
- **Shadow:** `--ui-shadow-sm` (`shadow-ui-sm`) and `--ui-shadow-lg` (`shadow-ui-lg`), tinted green in light mode and black in dark mode.
- **Motif:**
  - `--ui-motif-grid` and `--ui-motif-star` (SVG masks);
  - the classes `.ui-pattern` (a decorative star grid behind a block), `.ui-divider` (two hairlines and a star) and `.ui-star`;
  - `--ui-pattern-color` and `--ui-pattern-alpha` tune `.ui-pattern`.
- **Fonts** (`fontFamily` in the preset):
  - `font-display`: El Messiri 600, for titles;
  - `font-mono`: JetBrains Mono 400, for codes and counters;
  - `font-arabic`: system Arabic fonts (Noto Naskh Arabic, Geeza Pro, Amiri, Scheherazade New, Traditional Arabic), none bundled;
  - reading text: Tailwind's default `font-sans` (system UI fonts);
  - every stack ends with the Arabic stack.
- **Type scale:**
  - Tailwind's reading sizes: `text-xs` 12px, `text-sm` 14px, `text-base` 16px, `text-lg` 18px;
  - display sizes from the preset: `text-ui-section` 21/28px (dialog and section titles), `text-ui-title` 26/32px (page `h1`), `text-ui-hero` 32/38px.

Stacking order of the fixed layers:

- app bar and bottom navigation: `z-40`;
- menu panel: `z-50`;
- toaster: `z-[60]`;
- dialogs: in the top layer, above all of these.

### Dark mode

- Tailwind's `darkMode` is `['class']`.
- The `dark` class goes on `<html>`, which switches every `--ui-*` variable.
- Set `color-scheme` with it, so native controls and scrollbars match.
- The components use no `dark:` variant.
- The pre-paint script in `showcase/index.html` reads localStorage `darkMode` (`'true'` / `'false'`). When nothing is stored, it follows `prefers-color-scheme`.

## RTL and Arabic

**A whole page in Arabic.** Set `<html lang="ar" dir="rtl">`. The components are written with logical utilities only, so they mirror:

- `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`;
- `border-s`/`border-e`, `rounded-s`/`rounded-e`, `text-start`/`text-end`;
- `gap` instead of `space-x-*`.

Physical utilities (`ml-`, `pr-`, `left-`, `text-left`) are not allowed in new code.

What the components do in RTL:

- Tabs and segmented controls map the arrow keys to visual order.
- The drawer opens from the start side (the right in RTL).
- The menu opens toward the inline end.
- The tab-row scroll fade follows the direction.

Under `:lang(ar)`, `theme/styles/ui.scss`:

- removes `uppercase` and letter-spacing, which break Arabic joining;
- draws mono text with JetBrains Mono for Latin letters and digits only, and the Arabic stack for the rest.

**Arabic passages inside a page in another language.** Put `appUiArabic` on the element: `<p appUiArabic>…</p>`. It sets:

- `lang="ar"`, so screen readers switch voice and the browser shapes the text as Arabic;
- `dir="rtl"`;
- `font-arabic text-start leading-loose` (Arabic needs a line height of at least 1.7).

**Other Arabic and RTL rules:**

- Directional icons (arrows, chevrons, back) set `mirror: true` in their `UiIcon` and flip in RTL. Numbers, media and logos never flip.
- Free-text inputs and textareas default to `dir="auto"`, because a name may be Arabic.
- Wrap a user-entered name inside a sentence in `<bdi>`.
- The display font's Arabic subset (El Messiri) is bundled and fetched only when Arabic text is drawn. Body Arabic uses system fonts.

## UI rules

These rules apply to every component, existing or new.

### Overlays are never clipped

A menu, select, popover, dialog or toast must never be clipped by a parent's border, `overflow`, `contain` or stacking context. It renders in the browser's top layer (`<dialog>` with `showModal()`, the Popover API), or as a native control whose popup the browser draws outside the page. A layer fixed to the viewport is acceptable only when it is placed once, outside any transformed or overflow-clipped container.

What the kit does today:

| Component | How it is shown | Can a parent clip it? |
|---|---|---|
| `app-ui-dialog` | Native `<dialog>` + `showModal()`, so it is in the top layer (`ui/dialog/dialog.component.ts:53`, `:158`). Inert background, Esc closes, page scroll locked by `html:has(dialog:modal)`. | No. |
| `select[appUiSelect]` | Native `<select>` (`ui/select/select.directive.ts`). The browser draws the option list. | No. |
| `app-ui-menu`, phone with 6 or more items | A bottom sheet on a native `<dialog>` + `showModal()`, in the top layer (`ui/menu/menu.component.ts:22-23`, `:118`, `:183`). | No. |
| `app-ui-menu`, every other case | **Not in the top layer yet.** The panel is `absolute z-50` inside the menu's own `relative inline-block` host (`ui/menu/menu.component.ts:99`, `:136`). It flips above the trigger, or to the inline start, when the screen edge is near. | **Yes.** An ancestor with `overflow: hidden/auto/scroll`, `contain: paint`, or a lower stacking context clips it or covers it. Until it moves to the top layer, do not put a menu inside such a container. Moving it there is the next fix to make: `popover="manual"` + `showPopover()`, positioned from the trigger's rectangle, keeping the same keyboard contract. |
| `app-ui-toaster` | A `fixed inset-0 z-[60]` layer that lets the pointer through (`ui/toast/toaster.component.ts:42`). While a modal `<dialog>` is open, a MutationObserver moves the toaster into the newest open dialog, and back on close (`:100-101`, `:119-134`). This keeps the toasts above the backdrop, clickable and announced. | Not by overflow. But a `transform`, `filter` or `contain` on an ancestor would make `fixed` relative to that ancestor. Place the toaster once, in the app shell, outside such containers. |

### Keyboard and ARIA

- **Accessible names.** Every interactive element has one. `appUiIconButton` requires `label`, which becomes `aria-label`. An icon is decorative (`aria-hidden`) unless it has a `label`, and then it gets `role="img"`.
- **Use the native element first.** Buttons are `<button>`, navigation is `<a href>` (`routerLink`), and radio groups are `fieldset` + `legend`.
- **Menu:**
  - the trigger has `aria-haspopup="menu"` and `aria-expanded`; the list is `role="menu"`;
  - arrow keys, Home and End move between items;
  - Esc closes the menu and returns focus to the trigger;
  - Tab closes it, and so does a click outside.
- **Tabs:**
  - `tablist` / `tab` / `tabpanel`, with `aria-selected` and `aria-controls`;
  - roving tabindex, so only the selected tab is in the Tab order;
  - arrow keys follow visual order (swapped in RTL), Home and End jump to the ends;
  - the active tab scrolls into view.
- **Dialog:**
  - `aria-labelledby` points to the title;
  - initial focus goes to the element marked `data-autofocus`, else the first field, else the close button;
  - a `destructive` dialog never starts on a field or on the confirm button: put `data-autofocus` on Cancel;
  - focus returns to the opener on close;
  - the close button is always visible.
- **Fields:** `app-ui-field` wires `for` / `id`, `aria-describedby` (hint and error), `aria-invalid` and `required`. The required mark is text, not only an asterisk. Set `error` only once the error should show (after a blur or a submit).
- **Toasts:**
  - two live regions that always exist: `role="status"` / `aria-live="polite"` for info and success, `role="alert"` for errors;
  - errors stay until closed; other toasts last at least 5 s (6 s by default) and pause on hover and on focus (WCAG 2.2.1);
  - text only, never HTML.
- **Banners:** `announce` gives `role="alert"`. Use it only for a banner that appears after a user action.
- **Loading:** spinners have `role="status"` and a hidden label. Skeletons set `aria-busy="true"`. A loading button sets `aria-busy` and is disabled.
- **Steps:** `aria-current="step"`.
- **Bottom navigation:** `aria-current="page"`.
- **Colour is never the only signal.** Badges and banners carry their meaning in text, and links are underlined.
- **No duplicate ids.** Generate ids with `uiId('<prefix>')` from `ui/core`.

### Focus

- Every interactive element shows a visible focus ring for keyboard focus only. Use the `.ui-focus` class (`theme/styles/ui.scss`): `focus-visible:outline-2 outline-offset-2 outline-ui-focus`, a 2 px outline in the `--ui-focus` token, offset 2 px.
- Never use `focus:outline-none` without a `focus-visible` replacement.
- Text controls get `focus:ring-0` to undo the @tailwindcss/forms ring; `.ui-focus` draws the focus instead (`UI_CONTROL_CLASSES`).

### Sizes

- **Touch targets** are at least 44 × 44 px: `min-h-11` on buttons and controls, `size-11` on icon buttons, and labels at least 44 px tall around checkboxes, radios and switches. List rows are at least 56 px tall, and the app bar and tab bar are 56 px plus the safe area. The showcase spec checks every button, icon button and tab.
- **Action text** is at least 14 px (`text-sm`).
- **Inputs, selects and textareas** use 16 px text (`text-base`), so iOS does not zoom on focus.
- **Titles** use `font-display` with the `text-ui-*` display sizes. A page has exactly one `h1`, in `app-ui-page-header`.
- **Sentence case** for labels and buttons. No `uppercase` and no `tracking-wide*` in chrome.

### Motion and layout

- Every animation is `motion-safe:` and animates only `transform` and `opacity`. Under reduced motion, scrolling is instant.
- No layout shift (CLS): toasts are laid out below the viewport and raised with a transform, skeletons are sized like the final content, and images have `width` and `height`.
- No `fixed inset-0` overlays made by hand, and no `alert()`. Use `app-ui-dialog` or a toast.

## How to run

```sh
npm ci              # install the exact versions from package-lock.json
npm start           # ng serve: the showcase at http://localhost:4200/ (try ?theme=dark and ?dir=rtl)
npm test            # ng test: Karma in Chrome, watch mode
npm run test:ci     # ng test --watch=false --browsers=ChromeHeadlessNoSandbox (CI, containers, root shells)
npm run build       # ng build (production) into dist/showcase
```

How the workspace is set up:

- `angular.json` has one project, `showcase`. The build uses `@angular-devkit/build-angular:application` with `showcase/main.ts` and `showcase/index.html`. The tests use the karma builder with `include: ["ui/**/*.spec.ts"]` and `karma.conf.js` (Angular's default set, plus the `ChromeHeadlessNoSandbox` launcher).
- The showcase app routes every path to `UiShowcaseComponent`, and provides the English UI text from `showcase/ui-text-en.ts`.

## Licences

- **The icons** in `ui/icon/set/` come from two MIT-licensed sets, with their notices kept next to them:
  - [Tabler Icons](https://tabler.io/icons) (`ui/icon/set/LICENSE-tabler-icons.txt`): 96 icons, 24 × 24 outline icons converted to path strings, and `map-pin-solid` in Tabler's filled style;
  - [Heroicons](https://heroicons.com) (`ui/icon/set/LICENSE-heroicons.txt`): `close`, `mail-opened` and `info-circle-solid` (v1), and `menu`, `settings`, `sun` and `moon` (v2 outline).
- **The bundled fonts** keep their SIL Open Font Licence 1.1. The licence files are in `theme/fonts/`: `OFL.txt` for JetBrains Mono and `OFL-el-messiri.txt` for El Messiri.

Licence: not chosen yet, ask the owner.

## Changes

- 2026-10-08: initial import from the ATD fork. Changes made during the import:
  - the components, specs, theme tokens, global rules and fonts were extracted into a standalone workspace;
  - app-specific imports were replaced by a self-contained UI text source (`UI_TEXT_SOURCE`);
  - the showcase's theme service was replaced by a local toggle;
  - all sample data was made neutral.
