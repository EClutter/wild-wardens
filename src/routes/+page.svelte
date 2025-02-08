<script lang="ts">
	import ShopModal from '$lib/components/ShopModal.svelte';
	import db from '$lib/db';
	import { liveQuery } from 'dexie';

	let showShopModal = $state(false);

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
	let creatureShop = $derived(
		liveQuery(async () => {
			return await db.creatureShop.orderBy('price').toArray();
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
						credits: $warden.credits + 10,
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

	function buyCreature(creatureId: number, price: number) {
		console.log('Buying creature', creatureId);
		// check if the warden has enough credits
		if ($warden && $warden.id && $warden.credits >= price) {
			// update the warden's credits and experience + 10
			db.wardens.update($warden.id, {
				credits: $warden.credits - price,
				experience: $warden.experience + 10
			});
			// add the creature to the warden's sanctuary by looking up the creature in the creature shop and then adding it to the creatures table
			db.creatureShop.get(creatureId).then((creature) => {
				if (creature) {
					//Add the creature to the sanctuary
					console.log('Adding creature to sanctuary', creature);
					db.creatures.add({
						name: creature.name,
						feed: creature.feed,
						description: creature.description,
						type: creature.type,
						lastFeedTime: new Date()
					});
					console.log('Creature added to sanctuary', creature);
				} else {
					console.error('Creature not found in shop');
				}
			});
		} else {
			console.error('Not enough credits');
		}
	}
</script>

<main class="m-8 flex h-screen flex-col items-center p-8">
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
					<button
						class="rounded-lg bg-blue-500 px-4 py-2 text-white"
						onclick={() => (showShopModal = true)}
					>
						Shop
					</button>
				</div>
			</div>
		</div>
	{/if}
	{#if $creatures}
		<div class="grid grid-cols-2">
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
		</div>
	{/if}

	<ShopModal bind:showShopModal>
		{#snippet header()}
			<h2>Creature Shop</h2>
		{/snippet}
		{#each $creatureShop as creature}
			<div class="my-2 flex w-full items-center justify-between rounded-lg bg-gray-100 p-4">
				<div>
					<h2 class="text-xl font-bold">{creature.name}</h2>
					<p class="text-sm">Price: {creature.price} credits</p>
				</div>
				<button
					class="rounded-lg bg-blue-500 px-4 py-2 text-white"
					onclick={() => creature.id !== undefined && buyCreature(creature.id, creature.price)}
				>
					Buy
				</button>
			</div>
		{/each}
	</ShopModal>
</main>

<style>
	/* Center the ShopModal */
	:global(.modal-container) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}
	:global(.modal-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}
</style>
