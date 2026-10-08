import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, output } from '@angular/core';
import { UiButtonComponent } from '../button/button.component';
import { UiTextService } from '../core/ui-text';
import { UiIconButtonComponent } from '../icon-button/icon-button.component';
import { UiIconComponent } from '../icon/icon.component';
import { ICON_ALERT_CIRCLE, ICON_CHECK_CIRCLE, ICON_INFO_CIRCLE, ICON_WARNING, ICON_X } from '../icon/icons';

export type UiToastTone = 'info' | 'success' | 'warning' | 'error';

/** The shortest time a toast that closes by itself stays on screen (WCAG 2.2.1). */
export const UI_TOAST_MIN_MS = 5000;
export const UI_TOAST_DEFAULT_MS = 6000;

const TONES = {
	info: { ink: 'text-ui-accent-ink', icon: ICON_INFO_CIRCLE },
	success: { ink: 'text-ui-success-ink', icon: ICON_CHECK_CIRCLE },
	warning: { ink: 'text-ui-warning-ink', icon: ICON_WARNING },
	error: { ink: 'text-ui-danger-ink', icon: ICON_ALERT_CIRCLE },
} as const;

/**
 * One notification, text only, on a floating surface: the tone shows in the icon's and the title's
 * colour, not in a coloured slab. Errors stay until closed; the others close after `duration` (at least 5 s), paused
 * while the pointer is over it or focus is inside. "Fermer" is 44 px.
 */
@Component({
	selector: 'app-ui-toast',
	standalone: true,
	imports: [UiButtonComponent, UiIconButtonComponent, UiIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classes()',
		'(mouseenter)': 'pause()',
		'(mouseleave)': 'resume()',
		'(focusin)': 'pause()',
		'(focusout)': 'onFocusOut($event)',
	},
	template: `
		<span class="mt-2.5 flex" [class]="tone().ink"><app-ui-icon [icon]="tone().icon" [size]="22" /></span>
		<div class="min-w-0 flex-1 py-2">
			@if (title()) {
				<p class="font-semibold" [class]="tone().ink">{{ title() }}</p>
			}
			<p class="text-sm">{{ message() }}</p>
			@if (actionLabel()) {
				<button appUiButton type="button" variant="secondary" size="sm" class="mt-2" (click)="action.emit()">
					{{ actionLabel() }}
				</button>
			}
		</div>
		<button appUiIconButton type="button" [label]="closeLabel() ?? text.get('common.close', 'Fermer')" [icon]="closeIcon" [iconSize]="20" (click)="closed.emit()"></button>
	`,
})
export class UiToastComponent implements OnInit, OnDestroy {
	public readonly kind = input<UiToastTone>('info');
	public readonly title = input<string>('');
	public readonly message = input.required<string>();
	/** Milliseconds before a non-error toast closes; raised to 5 s at least. */
	public readonly duration = input<number>(UI_TOAST_DEFAULT_MS);
	/** A short action next to the text (e.g. "Annuler" to undo). */
	public readonly actionLabel = input<string>('');
	/** The close button's name; common.close (« Fermer ») when not given. */
	public readonly closeLabel = input<string>();
	public readonly closed = output<void>();
	public readonly action = output<void>();

	protected readonly closeIcon = ICON_X;
	protected readonly text = inject(UiTextService);
	protected readonly tone = computed(() => TONES[this.kind()]);
	protected readonly classes = computed(
		() =>
			'pointer-events-auto flex w-full items-start gap-3 rounded-ui-lg bg-ui-surface ps-4 text-ui-fg shadow-ui-lg ' +
			'ring-1 ring-ui-line',
	);

	private timer: ReturnType<typeof setTimeout> | null = null;
	private remaining = 0;
	private startedAt = 0;
	private paused = false;

	ngOnInit(): void {
		if (this.kind() === 'error') return;
		this.remaining = Math.max(UI_TOAST_MIN_MS, this.duration());
		this.start();
	}

	ngOnDestroy(): void {
		this.stop();
	}

	protected pause(): void {
		if (this.paused || this.kind() === 'error') return;
		this.paused = true;
		if (this.timer) {
			this.remaining -= Date.now() - this.startedAt;
			this.stop();
		}
	}

	protected resume(): void {
		if (!this.paused) return;
		this.paused = false;
		this.start();
	}

	protected onFocusOut(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		const host = event.currentTarget as HTMLElement;
		if (!next || !host.contains(next)) this.resume();
	}

	private start(): void {
		this.startedAt = Date.now();
		this.timer = setTimeout(() => {
			this.timer = null;
			this.closed.emit();
		}, Math.max(0, this.remaining));
	}

	private stop(): void {
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
	}
}
