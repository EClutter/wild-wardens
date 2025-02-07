<script lang="ts">
	import db, { type Creature, type Warden } from '$lib/db';
	import { liveQuery } from 'dexie';

	let warden = $derived(
		liveQuery(async () => {
			return await db.wardens.get(1);
		})
	);
	let creatures = $derived(
		liveQuery(async () => {
			return await db.creatures.orderBy('lastFeedTime').toArray();
		})
	);
	let now = $state(Date.now());

	$effect(() => {
		const timer = setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => clearInterval(timer);
	});

	function feed(creatureId: number) {
		// update the last feed time of the creature
		if (creatureId !== undefined) {
			db.creatures.update(creatureId, {
				lastFeedTime: new Date()
			});
			console.log('Feeding creature', creatureId);
			// update the warden's credits and experience
			if ($warden) {
				if ($warden.id !== undefined) {
					db.wardens.update($warden.id, {
						credits: $warden.credits + 1,
						experience: $warden.experience + 1
					});
				} else {
					console.error('Warden ID is undefined');
				}
			} else {
				console.error('Warden is undefined');
			}
		} else {
			console.error('Creature ID is undefined');
		}
	}
</script>

<main class="flex h-screen flex-col items-center justify-center">
	<h1 class="text-4xl font-bold">Wild Wardens</h1>
	<p class="text-lg">
		wild wardens is a real-time mythical creature sanctuary management game where you step into the
		shoes of an enchanted zookeeper
	</p>
	{#if $warden}
		<div class="my-4 flex w-full max-w-md items-center justify-center rounded-lg bg-gray-100 p-4">
			<div class="flex items-center">
				<div class="ml-4 text-center">
					<h2 class="text-xl font-bold">{$warden.name}</h2>
					<p class="text-sm">Credits: {$warden.credits}</p>
					<p class="text-sm">Experience: {$warden.experience}</p>
				</div>
			</div>
		</div>
	{/if}
	{#if $creatures}
		{#each $creatures as creature}
			<div class="my-2 flex w-full items-center justify-between rounded-lg bg-gray-100 p-4">
				<div>
					<h2 class="text-xl font-bold">{creature.name}</h2>
					<p class="text-sm">
						Hunger: {Math.max(
							0,
							creature.feed - Math.floor((now - new Date(creature.lastFeedTime).getTime()) / 1000)
						)} seconds
					</p>
					<p class="text-sm">
						Last fed: {new Date(creature.lastFeedTime).toLocaleString()}
					</p>
				</div>
				<button
					class="rounded-lg bg-blue-500 px-4 py-2 text-white"
					onclick={() => creature.id !== undefined && feed(creature.id)}
				>
					Feed
				</button>
			</div>
		{/each}
	{/if}
</main>
