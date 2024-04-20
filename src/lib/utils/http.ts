import { get as storeGet } from "svelte/store";
import { authStore } from "../stores";
import { LECTIO_API } from "$lib/lectio";

export function reloadData(reload = true) {
	localStorage.setItem('nonce', Date.now().toString(36));
	if (reload) window.location.reload();
}

export async function get(endpoint: String, body: any = null) {
	let nonce = localStorage.getItem('nonce');
	if (nonce === null) {
		reloadData(false);
		nonce = localStorage.getItem('nonce');
	}

	// Fetch the data from the API
	let url = LECTIO_API + endpoint;
	if (url.indexOf('?') > -1) url += `&nonce=${nonce}`;
	else url += `?nonce=${nonce}`;

	const start = performance.now();
	const headers: HeadersInit = { 'lectio-cookie': storeGet(authStore).cookie || '' };
	const response =
		body === null
			? await fetch(url, { headers })
			: await fetch(url, {
				method: 'POST',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body
			});
	const stop = performance.now();

	const textResponse = await response.text();

	// Tjek om responsen er OK
	if (response.ok) {
		if (stop - start > 100) {
			// Dette gøres for at tjekke om responset er cached.
			// Vi skal finde en bedre måde at gøre det på.
			// Et eksempel kunne være https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize
			// da transferSize er lig med 0 hvis den er cached men det er ikke understøttet på safari
			const lectioCookie = response.headers.get('set-lectio-cookie');
			if (lectioCookie) authStore.update((store) => ({ ...store, cookie: lectioCookie }));
		}
		return JSON.parse(textResponse.replaceAll('\n', '  '));
	}

	return null;
}

export async function post(endpoint: String, body: Object) {
	const response = await get(endpoint, body);
	return response;
}
