<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { NewTabLink, Spinner } from '$lib/components';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import { authStore } from '$lib/stores';
	import type { RawAssignment } from '$lib/types/assignments';
	import { get } from '$lib/utils/http';
	import { onMount } from 'svelte';
	import SvelteMarkdown from 'svelte-markdown';

	const exerciseid = $page.url.searchParams.get('id');
	if (!exerciseid) goto('/opgaver');

	let assignment: RawAssignment;
	let ready = false;

	onMount(async () => {
		const res = await get(`/opgave?exerciseid=${exerciseid}`);
		if (!res) goto('/opgaver');

		console.log(res);
		assignment = res;
		ready = true;
	});

	function parseLink(link: string) {
		if (link === '') return { link: '', text: '' };
		return { link: link.split('](')[1].split(')')[0], text: link.split('](')[0].split('[')[1] };
	}
</script>

<div class="page-container">
	{#if ready}
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<Badge class="text-xl" variant="outline">{assignment.oplysninger.hold}</Badge>
				<h1 class="text-2xl md:text-3xl">
					{assignment.oplysninger.opgavetitel}
				</h1>
			</div>
			<div>
				{#if assignment.afleveres_af.afventer === 'Elev'}
					<Badge>afventer: {assignment.afleveres_af.afventer}</Badge>
				{/if}
				{#if assignment.afleveres_af.afsluttet === true}
					<Badge variant="secondary">afsluttet</Badge>
				{/if}
				{#if assignment.afleveres_af.status_fravær.includes('Fravær: 100%')}
					<Badge variant="destructive">{assignment.afleveres_af.status_fravær}</Badge>
				{/if}
				<Badge variant="outline">skala: {assignment.oplysninger.karakterskala}</Badge>
				<Badge variant="outline">frist: {assignment.oplysninger.afleveringsfrist}</Badge>
				<Badge variant="outline">elevtid: {assignment.oplysninger.elevtid}</Badge>
			</div>
			<div class="space-y-4">
				{#if assignment.oplysninger.opgavenote}
					<div>
						<SvelteMarkdown
							source={assignment.oplysninger.opgavenote.replaceAll('\n', '\n\n')}
							renderers={{ link: NewTabLink }}
						/>
					</div>
				{:else}
					<p>Opgaven har ikke nogen beskrivelse.</p>
				{/if}
				{#if assignment.oplysninger.opgavebeskrivelse}
					<div>
						<SvelteMarkdown
							source={assignment.oplysninger.opgavebeskrivelse.replaceAll('\n', '\n\n')}
							renderers={{ link: NewTabLink }}
						/>
					</div>
				{/if}
			</div>
			<Separator />
			<div>
				<!-- inlæg og afleverings knap -->
				{#if assignment.opgave_indlæg.length !== 0}
					<!-- content here -->
					<h3 class="text-lg">Opgave indlæg</h3>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Bruger</Table.Head>
								<Table.Head>Dokument</Table.Head>
								<Table.Head>Inlæg</Table.Head>
								<Table.Head>Tidspunkt</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each assignment.opgave_indlæg as indlæg}
								<Table.Row>
									<Table.Cell>{indlæg.bruger.navn}</Table.Cell>
									{#if indlæg.dokument}
										{@const { link, text } = parseLink(indlæg.dokument)}
										<Table.Cell>
											<Button href={link} target="_blank" variant="ghost">{text}</Button>
										</Table.Cell>
									{:else}
										<Table.Cell></Table.Cell>
									{/if}
									{#if indlæg.indlæg}
										<Table.Cell>{indlæg.indlæg}</Table.Cell>
									{:else}
										<Table.Cell></Table.Cell>
									{/if}
									<Table.Cell>{indlæg.tidspunkt}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
				{#if assignment.afleveres_af.afventer === 'Elev'}
					<Button
						href={`https://www.lectio.dk/lectio/${
							$authStore.school
						}/ElevAflevering.aspx?elevid=${assignment.afleveres_af.elev.bruger_id.slice(
							1
						)}&exerciseid=${exerciseid}`}
						target="_blank"
						variant="outline"
						class="m-2"
						>Aflever
					</Button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex space-x-2">
			<h1>Indlæser opgave...</h1>
			<Spinner />
		</div>
	{/if}
</div>
