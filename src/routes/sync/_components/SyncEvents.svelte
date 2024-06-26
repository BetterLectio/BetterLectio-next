<script lang="ts">
	import { Spinner } from '$lib/components';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Select, ValueSelect } from '$lib/components/ui/select';
	import { LECTIO_OAUTH_API } from '$lib/lectio';
	import { authStore } from '$lib/stores';
	import ListPlus from 'lucide-svelte/icons/list-plus';
	import Trash from 'lucide-svelte/icons/trash';
	import Zap from 'lucide-svelte/icons/zap';
	import { toast } from 'svelte-sonner';
	import { calendar, calendars, fetchCalendars, pageState } from '.';
	import { DateTime } from 'luxon';

	let syncStatus: null | string | { success: number; failed: number } = null;

	let week = DateTime.now().weekNumber;
	let year = DateTime.now().year;
	let blacklist = '';
	let eventReminders: {
		method: 'Notifikation' | 'Email';
		quantity: string;
		unit: 'Minutter' | 'Timer' | 'Dage';
	}[] = [{ method: 'Notifikation', quantity: '5', unit: 'Minutter' }];
	const syncEvents = async () => {
		$pageState = 'loading';
		const statusToast = toast.loading('Synkroniserer...', { duration: 10000 });

		const reminders = eventReminders.map((reminder) => {
			const minutes = Math.min(
				reminder.unit === 'Minutter'
					? +reminder.quantity
					: reminder.unit === 'Timer'
						? +reminder.quantity * 60
						: +reminder.quantity * 24 * 60,
				20160
			);
			return {
				minutes,
				method: reminder.method.replace('Notifikation', 'popup').replace('Email', 'email')
			};
		});

		const res = await fetch(`${LECTIO_OAUTH_API}/events/sync`, {
			method: 'POST',
			headers: {
				lectio: $authStore.cookie || '',
				google: $authStore.googleToken || ''
			},
			body: JSON.stringify({
				calendarId: $calendar.value,
				week,
				year,
				blacklist,
				eventReminders: reminders
			})
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
		toast.success(`Synkronisering af Google Kalender-moduler er færdig.`, { id: statusToast });
		$pageState = 'ready';
	};
</script>

<Alert.Root level="2" class="pt-4">
	<Zap />
	<div class="flex items-center justify-between w-full">
		<div>
			<Alert.Title>Synkronisering af skema</Alert.Title>
			<Alert.Description
				>Automatisk synkroniser dit Lectio skema til din Google Kalender</Alert.Description
			>
		</div>
		<Dialog.Root>
			<Dialog.Trigger>
				<Button
					on:click={async () => {
						await fetchCalendars();
						syncStatus = null;
					}}
					disabled={$pageState === 'loading'}>Synkroniser nu</Button
				>
			</Dialog.Trigger>
			<Dialog.Content>
				{#if $calendars.length === 0}
					<Spinner />
				{:else if !syncStatus}
					<Dialog.Header>
						<Dialog.Title>Synkroniseringsindstillinger</Dialog.Title>
						<Dialog.Description>
							Her kan du konfigurere detaljer for hvordan du vil synkronisere dine moduler.
						</Dialog.Description>
					</Dialog.Header>
					<div class="flex flex-col space-y-4">
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Kalender</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Vælg hvilken Google Kalender du vil have dine moduler synkroniseret til.
							</p>
							<Select bind:value={$calendar} items={$calendars} />
						</div>
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Uge</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Vælg hvilken uge du vil have synkroniseret.
							</p>
							<div class="flex gap-2">
								<Input bind:value={week} class="w-20" placeholder="Uge" />
								<Input bind:value={year} class="w-20" placeholder="År" />
							</div>
						</div>
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Blacklist</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								AVANCERET: Hvis du vil fravælge moduler hvis deres navn indeholder specifikke ord.
							</p>
							<Dialog.Root>
								<Dialog.Trigger>
									<Button variant="outline">Konfigurer blacklist</Button>
								</Dialog.Trigger>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>Blacklist</Dialog.Title>
										<Dialog.Description>
											Indsæt et regex der matcher navnet på moduler du vil fravælge.
											<br />
											Eksemplet indsætter ikke moduler med "cafe", "café", "klub", "club", "fri", "konkurrence",
											"mesterskab", "infomøde", "kemi ol", "kemi-ol" i navnet, udover hvis det har "obligatorisk"
											i navnet.
										</Dialog.Description>
									</Dialog.Header>
									<div class="flex flex-col space-y-2">
										<Button
											on:click={() =>
												(blacklist =
													'(?!.*\\bobligatorisk\\b)(?=.*?(cafe|café|klub|club|fri|konkurrence|mesterskab|infomøde|kemi ol|kemi-ol)).*')}
											>Indsæt eksempel</Button
										>
										<Input bind:value={blacklist} />
									</div>
								</Dialog.Content>
							</Dialog.Root>
						</div>
						<div class="p-2 border rounded-md">
							<h2 class="font-semibold leading-4 unstyled">Påmindelser</h2>
							<p class="pb-2 text-sm text-muted-foreground">
								Indstil hvornår og hvordan du vil blive påmindet af Google Kalender for hvert modul.
							</p>
							<div class="space-y-2">
								{#each eventReminders as reminder}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<ValueSelect
												class="w-2/5"
												bind:value={reminder.method}
												items={['Notifikation', 'Email']}
											/>
											<div class="flex items-center">
												<Input
													bind:value={reminder['quantity']}
													class="rounded-r-none"
													max={reminder.unit === 'Minutter'
														? 20160
														: reminder.unit === 'Timer'
															? 336
															: 14}
													type="number"
													placeholder="Antal"
												/>
												<ValueSelect
													class="w-5/6"
													inputClass="rounded-l-none"
													bind:value={reminder.unit}
													items={['Minutter', 'Timer', 'Dage']}
												/>
											</div>
										</div>
										<Button
											class="ml-2 shrink-0"
											on:click={() => {
												eventReminders = eventReminders.filter((r) => r !== reminder);
											}}
											variant="destructive"
											size="icon"
										>
											<Trash />
										</Button>
									</div>
								{/each}
								<div class="flex items-center justify-center pt-2 mt-2 border-t">
									<Button
										on:click={() => {
											eventReminders = [
												...eventReminders,
												{ method: 'Notifikation', quantity: '5', unit: 'Minutter' }
											];
										}}
										size="icon"
									>
										<ListPlus />
									</Button>
								</div>
							</div>
						</div>
					</div>
					<Dialog.Footer>
						<Button on:click={syncEvents} disabled={$pageState === 'loading'}>Synkroniser nu</Button
						>
					</Dialog.Footer>
				{:else if typeof syncStatus === 'string'}
					<p class="text-destructive-foreground">{syncStatus}</p>
				{:else}
					<h2 class="font-semibold leading-4 unstyled">Synkronisering færdig</h2>
					<p>
						<span class="text-green-500">{syncStatus.success}</span> moduler synkroniseret.
						<br />
						<span class="text-red-500">{syncStatus.failed}</span> moduler kunne ikke synkroniseres.
					</p>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	</div>
</Alert.Root>
