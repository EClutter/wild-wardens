<script lang="ts">
	import db, { type Creature } from '$lib/db';
	import { liveQuery, type Observable } from 'dexie';

	let creatures: Observable<Creature[]> = liveQuery(() =>
		db.creatures.orderBy('lastFeedTime').toArray()
	);
</script>

<main class="flex h-screen flex-col items-center justify-center">
	<h1 class="text-4xl font-bold">Wild Wardens</h1>
	<p class="text-lg">
		wild wardens is a real-time mythical creature sanctuary management game where you step into the
		shoes of an enchanted zookeeper
	</p>
	{#if creatures}
		{#each $creatures as creature}
			<div class="my-2 flex w-full items-center justify-between rounded-lg bg-gray-100 p-4">
				<div
					class="items -center
                flex"
				>
					<div class="ml-4">
						<h2 class="text-xl font-bold">{creature.name}</h2>
						<p class="text-sm">{new Date(creature.lastFeedTime).toLocaleString()}</p>
					</div>
				</div>
				<button class="rounded-lg bg-blue-500 px-4 py-2 text-white">Feed</button>
			</div>
		{/each}
	{/if}
</main>
