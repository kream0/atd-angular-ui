import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiAppBarComponent } from '../app-bar';
import { UiArabicDirective } from '../arabic';
import { UiAvatarComponent } from '../avatar';
import { UiBadgeComponent } from '../badge';
import { UiBannerComponent } from '../banner';
import { UiBottomNavigationComponent, UiBottomNavItem } from '../bottom-navigation';
import { UiButtonComponent } from '../button';
import { UiCardComponent, UiCardFooterDirective, UiCardHeaderDirective, UiStretchedLinkDirective } from '../card';
import { UiCheckboxDirective } from '../checkbox';
import { UiDialogComponent, UiDialogFooterDirective, UiDialogMode } from '../dialog';
import { UiEmptyStateComponent } from '../empty-state';
import { UiControlDirective, UiFieldComponent } from '../field';
import * as icons from '../icon/set';
import { UiIcon, UiIconComponent } from '../icon';
import { UiIconButtonComponent } from '../icon-button';
import { UiInputDirective } from '../input';
import { UiLinkComponent } from '../link';
import {
	UiListDirective,
	UiListItemComponent,
	UiListLeadingDirective,
	UiListMetaDirective,
	UiListTitleDirective,
	UiListTrailingDirective,
} from '../list';
import { UiMarkdownComponent, UiMarkdownInputComponent } from '../markdown';
import { UiMenuComponent, UiMenuItemDirective } from '../menu';
import { UiPageHeaderComponent } from '../page-header';
import { UiProgressComponent } from '../progress';
import { UiFieldsetComponent, UiRadioDirective } from '../radio';
import { UiSelectDirective } from '../select';
import { UiSkeletonComponent } from '../skeleton';
import { UiSpinnerComponent } from '../spinner';
import { UiStepsComponent } from '../steps';
import { UiSwitchDirective } from '../switch';
import { UiSegmentedComponent, UiTabsComponent } from '../tabs';
import { UiTextareaDirective } from '../textarea';
import { UiToasterComponent, UiToastItem, UiToastTone } from '../toast';

/**
 * Every UI primitive on one page, for review and screenshots. The repository's host app (../../showcase) routes every
 * path to it; an app that copies `ui/` may route it in development builds only, or delete this folder.
 * `?theme=dark` and `?dir=rtl` set the theme and the direction on load. Sample data only.
 */
@Component({
	selector: 'app-ui-showcase',
	standalone: true,
	imports: [
		UiAppBarComponent,
		UiArabicDirective,
		UiAvatarComponent,
		UiBadgeComponent,
		UiBannerComponent,
		UiBottomNavigationComponent,
		UiButtonComponent,
		UiCardComponent,
		UiCardFooterDirective,
		UiCardHeaderDirective,
		UiCheckboxDirective,
		UiControlDirective,
		UiDialogComponent,
		UiDialogFooterDirective,
		UiEmptyStateComponent,
		UiFieldComponent,
		UiFieldsetComponent,
		UiIconButtonComponent,
		UiIconComponent,
		UiInputDirective,
		UiLinkComponent,
		UiListDirective,
		UiListItemComponent,
		UiListLeadingDirective,
		UiListMetaDirective,
		UiListTitleDirective,
		UiListTrailingDirective,
		UiMarkdownComponent,
		UiMarkdownInputComponent,
		UiMenuComponent,
		UiMenuItemDirective,
		UiPageHeaderComponent,
		UiProgressComponent,
		UiRadioDirective,
		UiSegmentedComponent,
		UiSelectDirective,
		UiSkeletonComponent,
		UiSpinnerComponent,
		UiStepsComponent,
		UiStretchedLinkDirective,
		UiSwitchDirective,
		UiTabsComponent,
		UiTextareaDirective,
		UiToasterComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block min-h-dvh bg-ui-bg text-ui-fg' },
	template: `
		<div [attr.dir]="dir()" class="mx-auto max-w-3xl pb-28 lg:pb-8">
			<app-ui-app-bar title="UI primitives">
				<button appUiAppBarLeading appUiIconButton type="button" label="Open the menu" [icon]="i.ICON_MENU" (click)="openDialog('drawer')"></button>
				<ng-container appUiAppBarActions>
					<button appUiIconButton type="button" label="Settings" [icon]="i.ICON_SETTINGS"></button>
					<app-ui-menu label="More actions">
						<button appUiMenuItem type="button">Edit</button>
						<button appUiMenuItem type="button">Duplicate</button>
						<button appUiMenuItem type="button" tone="danger">Delete</button>
					</app-ui-menu>
				</ng-container>
			</app-ui-app-bar>

			<main class="flex flex-col gap-10 px-4 py-6">
				<app-ui-page-header title="UI primitives" subtitle="Every building block of the interface, with sample data." back="/">
					<button appUiPageActions appUiButton type="button" variant="secondary" size="sm" (click)="toggleTheme()">
						{{ dark() ? 'Light theme' : 'Dark theme' }}
					</button>
					<button appUiPageActions appUiButton type="button" variant="secondary" size="sm" (click)="toggleDir()">
						{{ dir() === 'rtl' ? 'Left to right' : 'Right to left' }}
					</button>
				</app-ui-page-header>

				<section id="buttons" aria-labelledby="h-buttons" class="flex flex-col gap-4">
					<h2 id="h-buttons" class="text-lg font-semibold">Buttons and links</h2>
					<div class="flex flex-wrap gap-2">
						<button appUiButton type="button">Save</button>
						<button appUiButton type="button" variant="secondary">Cancel</button>
						<button appUiButton type="button" variant="ghost">Later</button>
						<button appUiButton type="button" variant="danger">Delete</button>
						<button appUiButton type="button" size="sm">Small</button>
						<button appUiButton type="button" [loading]="true">Sending</button>
						<button appUiButton type="button" disabled>Disabled</button>
						<a appUiButton variant="secondary" href="#buttons">Button link</a>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button appUiIconButton type="button" label="Edit" [icon]="i.ICON_EDIT"></button>
						<button appUiIconButton type="button" variant="secondary" label="Add" [icon]="i.ICON_PLUS"></button>
						<button appUiIconButton type="button" variant="primary" label="Confirm" [icon]="i.ICON_CHECK"></button>
						<button
							appUiIconButton
							type="button"
							label="Favourite"
							[icon]="i.ICON_HEART"
							[pressed]="starred()"
							(click)="starred.set(!starred())"
						></button>
						<button appUiIconButton type="button" label="Back" [icon]="i.ICON_ARROW_LEFT"></button>
					</div>
					<p class="text-sm">
						An <a appUiLink href="#forms">internal link</a> and an
						<a appUiLink external href="https://example.test/">external link</a>.
					</p>
				</section>

				<section id="forms" aria-labelledby="h-forms" class="flex flex-col gap-5">
					<h2 id="h-forms" class="text-lg font-semibold">Forms</h2>
					<app-ui-field label="Project name" hint="Visible to everyone on the team." required>
						<input appUiInput appUiControl type="text" autocomplete="off" value="Sample project" />
					</app-ui-field>
					<app-ui-field label="Email address" error="Enter a valid email address.">
						<input appUiInput appUiControl type="email" autocomplete="off" value="name@" />
					</app-ui-field>
					<app-ui-field label="Note">
						<textarea appUiTextarea appUiControl [rows]="3"></textarea>
					</app-ui-field>
					<app-ui-field label="Day">
						<select appUiSelect appUiControl>
							<option>Monday</option>
							<option>Tuesday</option>
							<option selected>Thursday</option>
						</select>
					</app-ui-field>
					<fieldset appUiFieldset legend="Reminders" hint="Choose at least one channel.">
						<label class="flex min-h-11 items-center gap-3">
							<input appUiCheckbox type="checkbox" checked />
							<span>Notification</span>
						</label>
						<label class="flex min-h-11 items-center gap-3">
							<input appUiCheckbox type="checkbox" />
							<span>Email</span>
						</label>
						<label class="flex min-h-11 items-center gap-3">
							<input appUiCheckbox type="checkbox" disabled />
							<span>SMS (unavailable)</span>
						</label>
					</fieldset>
					<fieldset appUiFieldset legend="Frequency" required error="Choose a frequency.">
						<label class="flex min-h-11 items-center gap-3">
							<input appUiRadio type="radio" name="frequency" value="week" />
							<span>Every week</span>
						</label>
						<label class="flex min-h-11 items-center gap-3">
							<input appUiRadio type="radio" name="frequency" value="month" />
							<span>Every month</span>
						</label>
					</fieldset>
					<label class="flex min-h-11 items-center justify-between gap-3">
						<span>Compact mode</span>
						<input appUiSwitch type="checkbox" checked />
					</label>
					<label class="flex min-h-11 items-center justify-between gap-3">
						<span>Hide finished tasks</span>
						<input appUiSwitch type="checkbox" />
					</label>
				</section>

				<section id="content" aria-labelledby="h-content" class="flex flex-col gap-4">
					<h2 id="h-content" class="text-lg font-semibold">Cards, lists, badges</h2>
					<app-ui-card>
						<div appUiCardHeader>
							<h3 class="font-semibold">
								<a appUiStretchedLink href="#content">Sample project</a>
							</h3>
							<app-ui-badge tone="success">Up to date</app-ui-badge>
						</div>
						<p class="text-sm text-ui-muted">The whole card is clickable; the badge carries its meaning in text.</p>
						<div appUiCardFooter>
							<button appUiButton type="button" variant="ghost" size="sm" class="relative z-10">Details</button>
						</div>
					</app-ui-card>
					<ul appUiList class="rounded-ui-lg bg-ui-surface shadow-ui-sm ring-1 ring-ui-line">
						@for (row of people; track row.name) {
							<li appUiListItem>
								<app-ui-avatar appUiListLeading [name]="row.name" [src]="row.src" decorative />
								<a appUiListTitle appUiStretchedLink href="#content">{{ row.name }}</a>
								<span appUiListMeta>{{ row.role }}</span>
								<app-ui-badge appUiListTrailing [tone]="row.tone">{{ row.status }}</app-ui-badge>
							</li>
						}
					</ul>
					<div class="flex flex-wrap gap-2">
						<app-ui-badge>Neutral</app-ui-badge>
						<app-ui-badge tone="accent">New</app-ui-badge>
						<app-ui-badge tone="success">Approved</app-ui-badge>
						<app-ui-badge tone="warning">Late</app-ui-badge>
						<app-ui-badge tone="danger">Blocked</app-ui-badge>
						<app-ui-badge tone="accent" [dot]="false">No dot</app-ui-badge>
					</div>
					<div class="flex items-center gap-3">
						<app-ui-avatar name="Sample User" [size]="32" />
						<app-ui-avatar name="Team" />
						<app-ui-avatar name="Sample Photo" src="assets/sample-photo.svg" [size]="56" />
					</div>
				</section>

				<section id="navigation" aria-labelledby="h-navigation" class="flex flex-col gap-4">
					<h2 id="h-navigation" class="text-lg font-semibold">Tabs and steps</h2>
					<app-ui-tabs label="Project view" [tabs]="tabs" [(selected)]="tab">
						<p class="text-sm">Content of the “{{ tabLabel() }}” tab.</p>
					</app-ui-tabs>
					<app-ui-segmented label="Period" [options]="periods" [(value)]="period" />
					<app-ui-steps [steps]="steps" [current]="2" />
					<app-ui-progress label="Plan completed" [value]="62" />
					<app-ui-progress label="Tasks done" [value]="3" [max]="8" [countLabel]="true" />
				</section>

				<section id="feedback" aria-labelledby="h-feedback" class="flex flex-col gap-4">
					<h2 id="h-feedback" class="text-lg font-semibold">Messages and loading</h2>
					<app-ui-banner title="Information">The meeting starts at 8 pm.</app-ui-banner>
					<app-ui-banner tone="success" title="Saved">The changes are live.</app-ui-banner>
					<app-ui-banner tone="warning">Two tasks have no due date.</app-ui-banner>
					@if (showBanner()) {
						<app-ui-banner tone="danger" title="Failed" dismissible (dismissed)="showBanner.set(false)">
							The connection was lost.
						</app-ui-banner>
					}
					<div class="flex flex-wrap gap-2">
						<button appUiButton type="button" variant="secondary" size="sm" (click)="toast('success')">Success toast</button>
						<button appUiButton type="button" variant="secondary" size="sm" (click)="toast('info')">Info toast</button>
						<button appUiButton type="button" variant="secondary" size="sm" (click)="toast('error')">Error toast</button>
					</div>
					<app-ui-card>
						<app-ui-empty-state
							title="No tasks yet"
							text="The project's tasks will show here."
							[icon]="i.ICON_LIST_CHECK"
							[headingLevel]="3"
						>
							<button appUiButton type="button" size="sm">Add a task</button>
						</app-ui-empty-state>
					</app-ui-card>
					<app-ui-skeleton kind="list" [rows]="2" />
					<app-ui-skeleton [rows]="3" />
					<div class="flex items-center gap-3 text-ui-accent-ink">
						<app-ui-spinner />
						<span class="text-sm text-ui-fg">Loading indicator</span>
					</div>
				</section>

				<section id="overlays" aria-labelledby="h-overlays" class="flex flex-col gap-4">
					<h2 id="h-overlays" class="text-lg font-semibold">Dialogs and menus</h2>
					<div class="flex flex-wrap items-center gap-2">
						<button appUiButton type="button" variant="secondary" (click)="openDialog('dialog')">Dialog</button>
						<button appUiButton type="button" variant="danger" (click)="confirmOpen.set(true)">Delete…</button>
						<button appUiButton type="button" variant="secondary" (click)="openDialog('sheet')">Sheet</button>
						<app-ui-menu label="Row actions">
							@for (action of longMenu; track action) {
								<button appUiMenuItem type="button">{{ action }}</button>
							}
						</app-ui-menu>
					</div>
				</section>

				<section id="text" aria-labelledby="h-text" class="flex flex-col gap-4">
					<h2 id="h-text" class="text-lg font-semibold">Markdown and Arabic text</h2>
					<app-ui-markdown [text]="markdownSample" />
					<app-ui-markdown [text]="documentSample" document />
					<app-ui-field label="Description" hint="Select a word, then use the toolbar.">
						<app-ui-markdown-input>
							<textarea appUiTextarea appUiControl [rows]="3">A **bold** word and an *italic* one.</textarea>
						</app-ui-markdown-input>
					</app-ui-field>
					<p appUiArabic class="text-lg">مرحبا بكم في الموقع</p>
				</section>

				<section id="icons" aria-labelledby="h-icons" class="flex flex-col gap-4">
					<h2 id="h-icons" class="text-lg font-semibold">Icons ({{ iconList.length }})</h2>
					<ul class="grid grid-cols-3 gap-2 sm:grid-cols-5" role="list">
						@for (icon of iconList; track icon.name) {
							<li class="flex flex-col items-center gap-1 rounded-ui p-2 ring-1 ring-ui-line">
								<app-ui-icon [icon]="icon" />
								<span class="max-w-full truncate text-xs text-ui-muted">{{ icon.name }}</span>
							</li>
						}
					</ul>
				</section>
			</main>

			<app-ui-dialog [(open)]="dialogOpen" [mode]="dialogMode()" [title]="dialogTitle()">
				@if (dialogMode() === 'drawer') {
					<nav aria-label="Menu" class="-mx-4">
						<ul appUiList>
							@for (item of nav; track item.path) {
								<li appUiListItem>
									<app-ui-icon appUiListLeading [icon]="item.icon" />
									<a appUiListTitle appUiStretchedLink href="#buttons" (click)="dialogOpen.set(false)">{{ item.label }}</a>
								</li>
							}
						</ul>
					</nav>
				} @else {
					<app-ui-field label="Title" required>
						<input appUiInput appUiControl type="text" autocomplete="off" />
					</app-ui-field>
				}
				@if (dialogMode() !== 'drawer') {
					<div appUiDialogFooter>
						<button appUiButton type="button" variant="secondary" (click)="dialogOpen.set(false)">Cancel</button>
						<button appUiButton type="button" (click)="dialogOpen.set(false)">Save</button>
					</div>
				}
			</app-ui-dialog>

			<app-ui-dialog [(open)]="confirmOpen" title="Delete the project?" destructive>
				<p class="text-sm">This cannot be undone.</p>
				<div appUiDialogFooter>
					<button appUiButton type="button" variant="secondary" data-autofocus (click)="confirmOpen.set(false)">
						Cancel
					</button>
					<button appUiButton type="button" variant="danger" (click)="confirmOpen.set(false)">Delete</button>
				</div>
			</app-ui-dialog>

			<app-ui-toaster [toasts]="toasts()" (dismissed)="dismiss($event)" (action)="dismiss($event)" />
			<app-bottom-navigation [items]="nav" />
		</div>
	`,
})
export class UiShowcaseComponent implements OnInit {
	protected readonly i = icons;
	protected readonly iconList: readonly UiIcon[] = Object.values(icons);
	protected readonly dir = signal<'ltr' | 'rtl'>('ltr');
	protected readonly starred = signal(false);
	protected readonly showBanner = signal(true);
	protected readonly dialogOpen = signal(false);
	protected readonly confirmOpen = signal(false);
	protected readonly dialogMode = signal<UiDialogMode>('dialog');
	protected readonly dialogTitle = signal('New task');
	protected readonly toasts = signal<readonly UiToastItem[]>([]);
	protected readonly tab = signal('tasks');
	protected readonly period = signal('week');

	protected readonly tabs = [
		{ id: 'tasks', label: 'Tasks' },
		{ id: 'notes', label: 'Notes' },
		{ id: 'files', label: 'Files' },
		{ id: 'plan', label: 'Plan' },
	];
	protected readonly periods = [
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' },
		{ value: 'year', label: 'Year' },
	];
	protected readonly steps = ['Details', 'Team', 'Plan', 'Summary'];
	protected readonly longMenu = ['Open', 'Edit', 'Duplicate', 'Move', 'Archive', 'Share', 'Delete'];
	protected readonly people: readonly { name: string; role: string; status: string; tone: 'success' | 'warning'; src: string | null }[] = [
		{ name: 'Sample Item', role: 'Project lead', status: 'Active', tone: 'success', src: null },
		{ name: 'Second Item', role: 'Contributor', status: 'Away', tone: 'warning', src: null },
		{ name: 'Third Item', role: 'Reviewer', status: 'Active', tone: 'success', src: 'assets/sample-photo.svg' },
	];
	protected readonly nav: readonly UiBottomNavItem[] = [
		{ label: 'Home', path: '/', icon: icons.ICON_HOME, exact: true },
		{ label: 'Agenda', path: '/agenda', icon: icons.ICON_CALENDAR },
		{ label: 'Projects', path: '/projects', icon: icons.ICON_USERS },
		{ label: 'Tasks', path: '/tasks', icon: icons.ICON_LIST_CHECK },
		{ label: 'More', path: '/more', icon: icons.ICON_MENU },
	];
	protected readonly markdownSample = 'Some **bold** text, an *italic* word and [a link](https://example.test/).\n\n> A quotation.\n\n- One item\n- Another item';
	protected readonly documentSample = '# Report\n\nA point ==worth noting==.\n\n| Item | Team | Amount |\n| :-- | :-: | --: |\n| Rent | Office | 120 |';

	private readonly document = inject(DOCUMENT);
	private readonly route = inject(ActivatedRoute);
	private toastCount = 0;

	protected readonly dark = signal(this.document.documentElement.classList.contains('dark'));

	ngOnInit(): void {
		const params = this.route.snapshot.queryParamMap;
		if (params.get('theme') === 'dark' || params.get('theme') === 'light') this.setTheme(params.get('theme') === 'dark');
		if (params.get('dir') === 'rtl') this.dir.set('rtl');
	}

	protected tabLabel(): string {
		return this.tabs.find((tab) => tab.id === this.tab())?.label ?? '';
	}

	protected toggleTheme(): void {
		this.setTheme(!this.dark());
	}

	protected toggleDir(): void {
		this.dir.set(this.dir() === 'rtl' ? 'ltr' : 'rtl');
	}

	protected openDialog(mode: UiDialogMode): void {
		this.dialogMode.set(mode);
		this.dialogTitle.set(mode === 'drawer' ? 'Menu' : mode === 'sheet' ? 'Filter' : 'New task');
		this.dialogOpen.set(true);
	}

	protected toast(kind: UiToastTone): void {
		const id = `toast-${++this.toastCount}`;
		const text: Record<UiToastTone, Omit<UiToastItem, 'id' | 'kind'>> = {
			success: { message: 'Task saved.', actionLabel: 'Undo' },
			info: { message: 'The list was updated.' },
			warning: { message: 'Slow connection.' },
			error: { title: 'Failed', message: 'Saving failed. Try again.' },
		};
		this.toasts.update((list) => [...list, { id, kind, ...text[kind] }]);
	}

	protected dismiss(id: string): void {
		this.toasts.update((list) => list.filter((toast) => toast.id !== id));
	}

	/** The `dark` class on <html> switches the tokens; the choice is kept as the index.html theme script reads it. */
	private setTheme(dark: boolean): void {
		const root = this.document.documentElement;
		root.classList.toggle('dark', dark);
		root.style.colorScheme = dark ? 'dark' : 'light';
		this.dark.set(dark);
		try {
			localStorage.setItem('darkMode', String(dark));
		} catch {
			// Storage blocked (private window): the theme still applies to this page.
		}
	}
}
