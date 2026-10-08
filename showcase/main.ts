import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideUiTextSource, uiTextDictionary } from '../ui/core';
import { UiShowcaseComponent } from '../ui/showcase/showcase.component';
import { UI_TEXT_EN } from './ui-text-en';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	template: '<router-outlet />',
})
class AppComponent {}

// Every path shows the showcase: the bottom navigation's links stay on it, with their active state.
bootstrapApplication(AppComponent, {
	providers: [
		provideRouter([{ path: '**', component: UiShowcaseComponent }]),
		provideUiTextSource(() => uiTextDictionary(() => UI_TEXT_EN)),
	],
}).catch((error: unknown) => console.error(error));
