import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UiTextService } from '../core/ui-text';
import { UiScrollCueDirective } from '../tabs/scroll-cue.directive';
import { MdAlign, parseInline, parseMarkdown } from './markdown';

const ALIGN_CLASS = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;

/**
 * A text typed in the app's markdown (./markdown.ts), drawn with bindings only: what a text holds never becomes HTML.
 * `inline` (titles, labels, one-line fields): the inline marks only, inside the caller's own element, set apart in
 * their own direction (`dir="auto"` on this element), so a French title in an Arabic page keeps its punctuation at
 * its end, and the reverse, while the caller's element keeps its alignment. Else the blocks too: each paragraph,
 * quote and list takes its own direction (`dir="auto"`; a quote from its first letter, as `dir="auto"` skips its
 * paragraphs), so an Arabic paragraph in a French page reads right to left, and the reverse.
 * `document` (a report): headings, tables, rules and ==highlight== too. A heading is level 3 to 6, as a document
 * sits under its page's title and a subheading; a table scrolls inside its own frame, never the page, from its own
 * start side. From sm up, a table takes its frame's width and a column narrows down to 6rem (else up to 16rem, the
 * phone's look), and the edge with more to scroll fades (UiScrollCueDirective; the theme's styles keep phones without it).
 */
@Component({
	selector: 'app-ui-markdown',
	standalone: true,
	imports: [NgTemplateOutlet, UiScrollCueDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class.flex]': '!inline()',
		'[class.flex-col]': '!inline()',
		'[class.gap-2]': '!inline()',
		'[class.min-w-0]': '!inline()',
		'[attr.dir]': "inline() ? 'auto' : null",
	},
	template: `
		<ng-template #inlines let-nodes>
			@for (node of nodes; track $index) {
				@switch (node.kind) {
					@case ('strong') {
						<strong class="font-semibold"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: node.children }" /></strong>
					}
					@case ('em') {
						<em class="italic"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: node.children }" /></em>
					}
					@case ('mark') {
						<mark class="rounded-sm bg-ui-accent-soft px-0.5 text-ui-fg"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: node.children }" /></mark>
					}
					@case ('link') {
						<a [href]="node.href" target="_blank" rel="noopener noreferrer" class="break-words underline underline-offset-2 hover:text-ui-accent-ink"
							><ng-container *ngTemplateOutlet="inlines; context: { $implicit: node.children }"
						/></a>
					}
					@default {
						<ng-container>{{ node.text }}</ng-container>
					}
				}
			}
		</ng-template>
		<ng-template #blockList let-blocks>
			@for (block of blocks; track $index) {
				@switch (block.kind) {
					@case ('quote') {
						<blockquote [attr.dir]="block.dir ?? 'auto'" class="flex flex-col gap-2 border-s-2 border-ui-line-strong ps-3">
							<ng-container *ngTemplateOutlet="blockList; context: { $implicit: block.blocks }" />
						</blockquote>
					}
					@case ('list') {
						@if (block.ordered) {
							<ol dir="auto" class="list-decimal ps-5" [attr.start]="block.start === 1 ? null : block.start">
								@for (item of block.items; track $index) {
									<li class="whitespace-pre-line"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: item }" /></li>
								}
							</ol>
						} @else {
							<ul dir="auto" class="list-disc ps-5">
								@for (item of block.items; track $index) {
									<li class="whitespace-pre-line"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: item }" /></li>
								}
							</ul>
						}
					}
					@case ('heading') {
						<p
							role="heading"
							dir="auto"
							[attr.aria-level]="block.level + 2 > 6 ? 6 : block.level + 2"
							class="font-semibold text-ui-fg"
							[class.text-lg]="block.level === 1"
							[class.mt-2]="block.level <= 2"
							[class.text-sm]="block.level >= 4"
						>
							<ng-container *ngTemplateOutlet="inlines; context: { $implicit: block.content }" />
						</p>
					}
					@case ('rule') {
						<hr class="my-1 border-ui-line" />
					}
					@case ('table') {
						<!-- The frame's ring and focus ring sit outside the part that fades, so they stay whole. -->
						<div class="relative max-w-full rounded-ui ring-1 ring-ui-line">
							<div
								data-markdown-table
								role="region"
								tabindex="0"
								[attr.aria-label]="ui.get('common.markdown.table', 'Tableau')"
								[attr.dir]="block.dir ?? 'auto'"
								class="ui-scroll-cue-wide peer overflow-x-auto rounded-ui focus-visible:outline-none"
								[appUiScrollCue]="block"
								[uiScrollCueItems]="block.rows"
							>
								<table class="w-max min-w-full border-collapse text-sm sm:w-full">
									<thead class="bg-ui-bg">
										<tr>
											@for (cell of block.head; track $index) {
												<th scope="col" class="px-3 py-2 align-bottom font-semibold" [class]="alignClass(block.align[$index])">
													<div class="max-w-[16rem] sm:min-w-[6rem]"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: cell }" /></div>
												</th>
											}
										</tr>
									</thead>
									<tbody>
										@for (row of block.rows; track $index) {
											<tr class="border-t border-ui-line">
												@for (cell of row; track $index) {
													<td class="px-3 py-2 align-top" [class]="alignClass(block.align[$index])">
														<div class="max-w-[16rem] sm:min-w-[6rem]"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: cell }" /></div>
													</td>
												}
											</tr>
										}
									</tbody>
								</table>
							</div>
							<div aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-ui peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ui-focus"></div>
						</div>
					}
					@default {
						<p dir="auto" class="whitespace-pre-line"><ng-container *ngTemplateOutlet="inlines; context: { $implicit: block.content }" /></p>
					}
				}
			}
		</ng-template>
		@if (inline()) {
			<ng-container *ngTemplateOutlet="inlines; context: { $implicit: inlineNodes() }" />
		} @else {
			<ng-container *ngTemplateOutlet="blockList; context: { $implicit: blocks() }" />
		}
	`,
})
export class UiMarkdownComponent {
	public readonly text = input<string | null | undefined>('');
	public readonly inline = input(false, { transform: booleanAttribute });
	public readonly document = input(false, { transform: booleanAttribute });

	protected readonly ui = inject(UiTextService);
	protected readonly inlineNodes = computed(() => (this.inline() ? parseInline(this.text() ?? '') : []));
	protected readonly blocks = computed(() => (this.inline() ? [] : parseMarkdown(this.text(), { document: this.document() })));

	/** A column's `:` alignment; none keeps the cell's start. */
	protected alignClass(align: MdAlign): string {
		return align ? ALIGN_CLASS[align] : 'text-start';
	}
}
