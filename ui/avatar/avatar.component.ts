import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * A round photo or initials in emerald on a pale emerald disc. `decorative` when the name is written next to it (`alt=""`);
 * otherwise the image is named after the person. Falls back to the initials when the image fails.
 */
@Component({
	selector: 'app-ui-avatar',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class:
			'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-accent-soft font-semibold ' +
			'text-ui-accent-ink',
		'[style.width.px]': 'size()',
		'[style.height.px]': 'size()',
		'[style.font-size.px]': 'size() * 0.4',
	},
	template: `
		@if (showImage()) {
			<img
				[src]="src()"
				[alt]="decorative() ? '' : name()"
				[width]="size()"
				[height]="size()"
				loading="lazy"
				decoding="async"
				class="size-full object-cover"
				(error)="failedSrc.set(src())"
			/>
		} @else {
			<span aria-hidden="true">{{ initials() }}</span>
			@if (!decorative()) {
				<span class="sr-only">{{ name() }}</span>
			}
		}
	`,
})
export class UiAvatarComponent {
	public readonly name = input.required<string>();
	public readonly src = input<string | null | undefined>(null);
	/** Width and height in px. */
	public readonly size = input<number>(40);
	public readonly decorative = input(false, { transform: booleanAttribute });

	protected readonly failedSrc = signal<string | null | undefined>(null);
	protected readonly showImage = computed(() => !!this.src() && this.src() !== this.failedSrc());
	protected readonly initials = computed(() => {
		const words = this.name().trim().split(/\s+/).filter(Boolean);
		const first = (word: string | undefined) => (word ? Array.from(word)[0] : '');
		const letters = words.length > 1 ? first(words[0]) + first(words[words.length - 1]) : first(words[0]);
		return letters.toLocaleUpperCase('fr');
	});
}
