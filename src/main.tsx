import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import logoUrl from './assets/logo.png?url'

// Ensure favicon uses our logo in both dev and prod
(() => {
	try {
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
	} catch {}
})();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
