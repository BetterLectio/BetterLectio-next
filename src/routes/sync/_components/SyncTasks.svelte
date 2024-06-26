<script lang="ts">
	import { Spinner } from '$lib/components';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Select from '$lib/components/ui/select/Select.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { LECTIO_OAUTH_API } from '$lib/lectio';
	import { authStore } from '$lib/stores';
	import Zap from 'lucide-svelte/icons/zap';
	import { DateTime } from 'luxon';
	import { toast } from 'svelte-sonner';
	import { fetchTasklists, pageState, tasklist, tasklists } from '.';

	let syncStatus: null | string | { new: number; updated: number } = null;

	const maxAgePresets = [
		{ dt: null, label: '∞' },
		{ dt: DateTime.now().minus({ months: 1 }), label: '1 måned' },
		{ dt: DateTime.now().minus({ months: 3 }), label: '3 måneder' },
		{ dt: DateTime.now().minus({ months: 6 }), label: '6 måneder' },
		{ dt: DateTime.now().minus({ months: 12 }), label: '12 måneder' }
	];
	let maxAge: DateTime | null = null;
	let addFinishedTasks = false;

	const syncTasks = async () => {
		$pageState = 'loading';
		const statusToast = toast.loading('Synkroniserer...', { duration: 10000 });

		let options: Record<string, string | boolean> = {
			tasklist: $tasklist.value,
			addFinishedTasks
		};
		if (maxAge) {
			options.maxAge = maxAge.toISO()!;
		}

		const res = await fetch(`${LECTIO_OAUTH_API}/tasks/sync`, {
			method: 'POST',
			headers: {
				lectio: $authStore.cookie || '',
				google: $authStore.googleToken || ''
			},
			body: JSON.stringify(options)
		});
		if (!res.ok) {
			switch (res.status) {
				case 401:
					$pageState = 'logged-out';
					syncStatus = 'Din google kode er ugyldig. Venligst log ind igen.';
					break;
				default:
					$pageState = 'ready';
					syncStatus =
						'Der skete en fejl under synkroniseringen. Prøv igen senere eller tjek din internetforbindelse.';
					break;
			}
			toast.dismiss(statusToast);
			return;
		}
		syncStatus = await res.json();
		toast.success(`Synkronisering af opgaver er færdig.`, { id: statusToast });
		$pageState = 'ready';
	};
</script>

<Alert.Root level="2" class="pt-4">
	<Zap />
	<div class="flex items-center justify-between w-full">
		<div>
			<Alert.Title>Synkronisering af opgaver</Alert.Title>
			<Alert.Description>Automatisk synkroniser dine opgaver til Google Tasks</Alert.Description>
		</div>
		<Dialog.Root>
			<Dialog.Trigger>
				<Button
					on:click={() => {
						fetchTasklists();
						syncStatus = null;
					}}
					disabled={$pageState === 'loading'}>Synkroniser nu</Button
				>
			</Dialog.Trigger>
			<Dialog.Content>
				{#if $tasklists.length === 0}
					<Spinner />
				{:else if !syncStatus}
					<Dialog.Header>
						<Dialog.Title>Synkroniseringsindstillinger</Dialog.Title>
						<Dialog.Description>
							Her kan du konfigurere detaljer for Google Tasks-synkroniseringen.
						</Dialog.Description>
					</Dialog.Header>
					<div class="flex flex-col space-y-4">
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Google Tasks-liste</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Hvilken Google Tasks-liste skal opgaver blive synkroniseret til?
							</p>
							{#key $tasklists}
								<Select bind:value={$tasklist} items={$tasklists} />
							{/key}
						</div>
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Afleverede opgaver</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Skal afleverede opgaver blive synkroniseret til Google Tasks?
							</p>
							<Switch bind:checked={addFinishedTasks} />
						</div>
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Opgavealder</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Hvor gammel må en opgave være for at den bliver synkroniseret til Google Tasks?
							</p>
							<div class="flex space-x-1">
								{#each maxAgePresets as preset}
									<Badge
										on:click={() => {
											maxAge = preset.dt;
										}}
										variant={maxAge === preset.dt ? 'default' : 'outline'}
									>
										{preset.label}
									</Badge>
								{/each}
							</div>
						</div>
						<Button on:click={syncTasks} disabled={$pageState === 'loading'}>Synkroniser nu</Button>
					</div>
				{:else if typeof syncStatus === 'string'}
					<p class="text-destructive-foreground">{syncStatus}</p>
				{:else}
					<h2 class="font-semibold leading-4 unstyled">Synkronisering færdig</h2>
					<p>
						<span class="text-green-500">{syncStatus.new}</span> opgaver tilføjet.
						<br />
						<span class="text-blue-500">{syncStatus.updated}</span> opgaver opdateret.
					</p>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	</div>
</Alert.Root>
