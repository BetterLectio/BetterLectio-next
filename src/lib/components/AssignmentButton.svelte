<script lang="ts">
	import { goto } from '$app/navigation';
	import type { RawSimpleAssignment } from '$lib/types/assignments';
	import { DateTime } from 'luxon';
	import Archive from 'svelte-radix/Archive.svelte';
	import ChatBubble from 'svelte-radix/ChatBubble.svelte';
	import EnvelopeOpen from 'svelte-radix/EnvelopeOpen.svelte';
	import ExclamationTriangle from 'svelte-radix/ExclamationTriangle.svelte';
	import Rocket from 'svelte-radix/Rocket.svelte';
	import { cn } from '$lib/utils/other.js';

	export let opgave: RawSimpleAssignment;
	export let componentRoutes: boolean = true;
	let className: string | undefined = undefined;
	export { className as class };

	function elevtidNum(elevtid: string) {
		return Number(elevtid.replace(',', '.'));
	}
</script>

<button
	on:click={async () => {
		if (componentRoutes) await goto(`/opgave?id=${opgave.exerciseid}`);
	}}
	class={cn(
		'flex items-center w-full justify-between p-2 border-[1px] gap-2 rounded-md shadow-md cursor-pointer border-border',
		className
	)}
	{...$$restProps}
>
	<div class="flex items-start space-x-2">
		<div class="flex items-start justify-start py-1">
			{#if opgave.status === 'Afleveret'}
				<Rocket class="w-4 h-4 text-green-800 dark:text-green-400" />
			{:else if opgave.status === 'Afsluttet'}
				<Archive class="w-4 h-4 text-blue-800 dark:text-blue-400" />
			{:else if opgave.status === 'Venter'}
				<EnvelopeOpen class="w-4 h-4" />
			{:else}
				<ExclamationTriangle class="w-4 h-4 text-red-800 dark:text-red-400" />
			{/if}
		</div>
		<div class="flex flex-col items-start justify-center">
			<p class="text-sm font-semibold text-left">{opgave.opgavetitel}</p>
			<p class="text-xs text-gray-500">{opgave.hold}</p>
		</div>
	</div>
	<div class="flex items-center space-x-2">
		{#if opgave.karakter || opgave.elevnote}
			<ChatBubble class="w-4 h-4" />
		{/if}
		<div class="flex flex-col items-end justify-center">
			<p class="text-xs text-gray-500 text-nowrap">
				{DateTime.fromFormat(opgave.frist, 'd/M-yyyy HH:mm').toRelative()}
			</p>
			<p class="text-xs text-gray-500 text-nowrap">
				{opgave['elev-tid']} elev time{elevtidNum(opgave['elev-tid']) === 1 ? '' : 'r'}
			</p>
		</div>
	</div>
</button>
