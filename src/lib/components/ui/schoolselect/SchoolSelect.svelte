<script lang="ts">
	import { flyAndScale, round } from '$lib/utils';
	import { createDialog, melt } from '@melt-ui/svelte';
	import { filter } from 'fuzzy';
	import { ChevronsUpDown, Loader2, LocateIcon, X } from 'lucide-svelte';
	import { FancyInput } from '../fancyinput';
	import { Button } from '../button';
	import type { ClosestSchool } from '../../../../../../BetterLectio-OAuth-helper/src/lib/types/location';
	import { toast } from 'svelte-sonner';
	import { LECTIO_OAUTH_API } from '$lib/lectio';

	const {
		elements: { close, content, overlay, portalled, title, trigger },
		states: { open }
	} = createDialog();

	export let schools: { [k: string]: number } = {};
	export let value = 0;
	$: valueKey = Object.keys(schools).find((key) => schools[key] === value);

	let searchTerm = '';
	$: filteredSchools = filter(searchTerm, Object.keys(schools), {
		post: '</strong>',
		pre: '<strong>'
	});

	let locating = false;
	let closestSchool: string | null = null;
	const locate = async () => {
		locating = true;
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const resp = await fetch(`${LECTIO_OAUTH_API}/locate?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
				if (!resp.ok) {
					toast.error("Kunne ikke finde nærmeste skole.")
					locating = false;
					return;
				}

				const data = (await resp.json()) as ClosestSchool;
				value = data.id;
				if (data.distance > 1000) closestSchool = `${round(data.distance / 1000, 2)}km`;
				else closestSchool = `${round(data.distance)}m`;
				locating = false;
			},
			(error) => {
				toast.error(error.message);
				locating = false;
			}
		);
	};
</script>

<button
	class="flex h-12 min-w-[220px] items-center justify-between rounded-md border border-slate-200 bg-neutral-50 text-slate-900 dark:border-slate-800 dark:bg-neutral-950 dark:text-slate-100 px-3
    py-2 text-magnum-700 transition-opacity hover:opacity-90"
	use:melt={$trigger}
>
	{#if value > 0}{valueKey}{:else}Vælg din skole{/if}
	<ChevronsUpDown class="square-5" />
</button>

<div use:melt={$portalled}>
	{#if $open}
		<div class="fixed inset-0 z-50 bg-background/50" use:melt={$overlay} />
		<div
			class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-background
            p-6 shadow-lg"
			transition:flyAndScale={{
        duration: 150,
        start: 0.96,
        y: 8,
      }}
			use:melt={$content}
		>
			<h2 class="m-0 text-xl font-medium" use:melt={$title}>{valueKey ?? "Vælg Skole"}</h2>
			<Button on:click={locate} disabled={locating || closestSchool != null} class="my-4"
			>
				{#if locating}
					<Loader2 class="w-6 h-6 animate-spin mr-2" />
				{:else}
					<LocateIcon class="mr-2" />
				{/if}{closestSchool ? `${valueKey} er ${closestSchool} væk` : "Find nærmeste skole"}</Button
			>
			<FancyInput bind:value={searchTerm} class="mb-5" placeholder="Søg efter skole..." />
			<div class="overflow-y-auto max-h-[40vw] lg:max-h-[25vw] space-y-2">
				{#each filteredSchools as school}
					<button
						class="w-full rounded-md border border-slate-200 bg-neutral-50 text-slate-900 dark:border-slate-800 dark:bg-neutral-950 dark:text-slate-100 px-3
                py-2 text-magnum-700 transition-opacity hover:opacity-90"
						on:click={() => {
              value = schools[school.original];
              // open.set(false);
            }}
						use:melt={$close}
					>
						{@html school.string}
					</button>
				{/each}
			</div>
			<button
				aria-label="close"
				class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-foreground
                hover:bg-light-hover/60 dark:hover:bg-dark-hover/60"
				use:melt={$close}
			>
				<X class="square-4" />
			</button>
		</div>
	{/if}
</div>
