import { TestBed } from '@angular/core/testing';

import { UiToastComponent } from './toast.component';

// The toast message renders as text, never as HTML: a user's display name may be in it.
describe('UiToastComponent text', () => {
	const NAME = '<img src="data:," onerror="window.__toastXss=1"><b>x</b>';

	beforeEach(() => {
		delete (window as any).__toastXss;
	});

	afterEach(() => {
		delete (window as any).__toastXss;
	});

	it('shows the title and the message as text', async () => {
		const fixture = TestBed.createComponent(UiToastComponent);
		fixture.componentRef.setInput('kind', 'success');
		fixture.componentRef.setInput('title', `Connexion réussie ${NAME}`);
		fixture.componentRef.setInput('message', `Bienvenue, ${NAME} !`);
		fixture.detectChanges();
		await new Promise((resolve) => setTimeout(resolve, 100));

		const body = fixture.nativeElement as HTMLElement;
		expect(body.querySelector('img')).withContext('the message made an <img> element').toBeNull();
		expect(body.querySelector('b')).withContext('the message made a <b> element').toBeNull();
		expect(body.textContent).toContain(`Bienvenue, ${NAME} !`);
		expect(body.textContent).toContain(`Connexion réussie ${NAME}`);
		expect((window as any).__toastXss).withContext('the onerror handler ran').toBeUndefined();
		fixture.destroy();
	});
});
