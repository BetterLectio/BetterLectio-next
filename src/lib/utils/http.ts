import { get as storeGet } from 'svelte/store';
import { authStore, connectionStore, loadingStore } from '../stores';
import { LECTIO_API } from '$lib/lectio';

export function reloadData(reload = true) {
	localStorage.setItem('nonce', Date.now().toString(36));
	if (reload) window.location.reload();
}

async function simpleGet(endpoint: string, body: any = null): Promise<any | false> {
	try {
		loadingStore.set(true);
		/* setTimeout(() => { //maybe not needed
		loadingStore.set(false);
	}, 5000); */
		let nonce = localStorage.getItem('nonce');
		if (nonce === null) {
			reloadData(false);
			nonce = localStorage.getItem('nonce');
		}

		// Fetch the data from the API
		let url = LECTIO_API + endpoint;
		if (url.indexOf('?') > -1) url += `&nonce=${nonce}`;
		else url += `?nonce=${nonce}`;

		const headers: HeadersInit = { 'lectio-cookie': storeGet(authStore).cookie || '' };
		const response =
			body === null
				? await fetch(url, { headers })
				: await fetch(url, {
						method: 'POST',
						headers: { ...headers, 'Content-Type': 'application/json' },
						body
					});
		loadingStore.set(false);

		const data = await response.json();

		// Tjek om responsen er OK
		if (response.ok) {
			const performanceEntries = performance.getEntriesByType('resource');
			const entry = performanceEntries.find((entry) => entry.name === response.url);

			// @ts-ignore
			if (entry && entry.transferSize > 0) {
				const lectioCookie = response.headers.get('set-lectio-cookie');
				if (lectioCookie) authStore.update((store) => ({ ...store, cookie: lectioCookie }));
			}
			return data;
		}

		return false;
	} catch (error) {
		loadingStore.set(false);
		return false;
	}
}

export async function get(endpoint: string, body: any = null): Promise<any | false> {
	let resp = await simpleGet(endpoint, body);
	if (resp !== false) {
		connectionStore.set(true);
		return resp;
	} else {
		console.log(await checkCookie());
		if (await checkCookie()) {
			return false; // internet is connected but api request fail for some reason
		} else {
			let tries = 0;
			const maxTries = 100; // Set the maximum number of tries set high on purpose
			while (tries < maxTries) {
				// retry until internet is connected
				console.log('[http] retrying request');
				if (await checkCookie()) {
					connectionStore.set(true);
					return await simpleGet(endpoint, body);
				} else {
					connectionStore.set(false);
					tries++;
					await new Promise((r) => setTimeout(r, 1000)); // wait for 1 second
				}
			}
			return false; // internet is not connected and maxTries is reached, so let page deal with it
		}
	}
}

async function checkCookie() {
	try {
		let res = await fetch(`${LECTIO_API}/check-cookie`, {
			headers: {
				'lectio-cookie': storeGet(authStore).cookie || ''
			}
		});
		let data = await res.json();
		return data.valid;
	} catch (error) {
		return false;
	}
}

export async function post(endpoint: string, body: Object) {
	const response = await get(endpoint, body);
	return response;
}
