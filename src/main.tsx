import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Add hydrated class to prevent FOUC
document.documentElement.classList.add('hydrated');

// Ensure favicon uses our logo in both dev and prod (safe guard)
(() => {
	try {
		const logoUrl = '/logo.png';
		const setIcon = (rel: string, href: string) => {
			let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
			if (!link) {
				link = document.createElement('link');
				link.rel = rel;
				document.head.appendChild(link);
			}
			link.href = href;
		};
		setIcon('icon', logoUrl);
		setIcon('apple-touch-icon', logoUrl);
	} catch (e) {
		// swallow to avoid breaking startup
		// eslint-disable-next-line no-console
		console.warn('favicon setup failed', e);
	}
})();

// Basic global error handlers so the app doesn't show a white screen
// Forward errors to a global event the ErrorBoundary can pick up
window.addEventListener('error', (ev) => {
	try {
		const err = ev.error || new Error(String(ev.message || 'Unknown error'));
		window.dispatchEvent(new CustomEvent('app-runtime-error', { detail: { error: err } }));
	} catch {}
});
window.addEventListener('unhandledrejection', (ev) => {
	try {
		const err = ev.reason instanceof Error ? ev.reason : new Error(String(ev.reason || 'Unhandled rejection'));
		window.dispatchEvent(new CustomEvent('app-runtime-error', { detail: { error: err } }));
	} catch {}
});

createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
