<script lang="ts">
	import ShopModal from '$lib/components/ShopModal.svelte';
	import db from '$lib/db';
	import { liveQuery } from 'dexie';
	import questions from '$lib/questions.json';
	import { fade, slide } from 'svelte/transition';

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

	let activeCreatureId = $state<number | null>(null);
	let timeLeft = $state(10);
	let questionAnswered = $state(false);
	let currentQuestion = $state<{
		question: string;
		choices: string[];
		answer: string;
	} | null>(null);

	$effect(() => {
		if (activeCreatureId !== null && timeLeft > 0 && !questionAnswered) {
			const timer = setInterval(() => {
				timeLeft--;
			}, 1000);

			return () => clearInterval(timer);
		} else if (timeLeft === 0) {
			activeCreatureId = null;
			timeLeft = 10;
		}
	});

	function startGame(creatureId: number) {
		activeCreatureId = creatureId;
		timeLeft = 10;
		questionAnswered = false;
		currentQuestion = questions[Math.floor(Math.random() * questions.length)];
	}

	function answerQuestion(creatureId: number, answer: string) {
		if (currentQuestion && answer === currentQuestion.answer && activeCreatureId === creatureId) {
			feed(creatureId);
			questionAnswered = true;
			activeCreatureId = null;
			timeLeft = 10;
			currentQuestion = null;
		} else {
			alert('wrong answer, try again!');
			timeLeft = 10;
		}
	}
</script>

<main
	class="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-8"
>
	<h1 class="mb-4 text-5xl font-extrabold text-gray-800 shadow-md">Wild Wardens</h1>
	<p class="mb-8 text-center text-lg text-gray-700">
		step into the enchanted shoes of a zookeeper managing a mythical creature sanctuary in
		real-time!
	</p>

	{#if $warden}
		<div
			class="mb-8 flex w-full max-w-md items-center justify-between rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:scale-105"
		>
			<div class="flex items-center space-x-4">
				<img
					src="https://i.pravatar.cc/150?img=3"
					alt="Warden Avatar"
					class="h-12 w-12 rounded-full object-cover shadow-md"
				/>
				<div>
					<h2 class="text-2xl font-semibold text-gray-800">{$warden.name}</h2>
					<p class="text-sm text-gray-600">
						Credits: <span class="font-bold">{$warden.credits}</span>
					</p>
					<p class="text-sm text-gray-600">
						Experience: <span class="font-bold">{$warden.experience}</span>
					</p>
				</div>
			</div>
			<button
				class="focus:ring-opacity-75 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
				onclick={() => (showShopModal = true)}
			>
				Visit Shop
			</button>
		</div>
	{/if}

	{#if activeCreatureId !== null && currentQuestion}
		<div
			class="relative mb-8 w-full max-w-md rounded-2xl bg-gradient-to-r from-yellow-200 to-orange-200 p-6 shadow-xl transition-all duration-300"
			transition:slide
		>
			<div class="absolute top-2 right-2">
				<span
					class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
				>
					Time: {timeLeft}s
				</span>
			</div>
			<h2 class="mb-4 text-3xl font-bold text-gray-800">Brain Food Time!</h2>
			<p class="mb-6 text-lg text-gray-700">{currentQuestion.question}</p>
			<div class="flex flex-wrap justify-center space-x-4">
				{#each currentQuestion.choices as choice}
					<button
						class="focus:ring-opacity-75 rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:outline-none"
						onclick={() => answerQuestion(activeCreatureId ?? 0, choice)}>{choice}</button
					>
				{/each}
			</div>
		</div>
	{/if}

	{#if $creatures}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
			{#each $creatures as creature}
				<div
					class="flex flex-col items-center justify-between rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:scale-105"
				>
					<img
						src={`https://i.pravatar.cc/150?img=${creature.id}`}
						alt={`${creature.name} Avatar`}
						class="mb-4 h-24 w-24 rounded-full object-cover shadow-md"
					/>
					<h2 class="text-2xl font-semibold text-gray-800">{creature.name}</h2>
					<p class="text-sm text-gray-600">
						Hunger:
						<span class="font-bold">
							{Math.max(
								0,
								creature.feed - Math.floor((now - new Date(creature.lastFeedTime).getTime()) / 1000)
							)}s
						</span>
					</p>
					<p class="text-sm text-gray-600">
						Last fed: <span class="font-mono"
							>{new Date(creature.lastFeedTime).toLocaleString()}</span
						>
					</p>
					<button
						class="focus:ring-opacity-75 mt-4 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
						onclick={() => startGame(creature.id ?? 0)}
					>
						Feed
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<ShopModal bind:showShopModal>
		{#snippet header()}
			<h2 class="text-3xl font-bold text-gray-800">Creature Shop</h2>
		{/snippet}
		{#each $creatureShop as creature}
			<div
				class="my-4 flex w-full items-center justify-between rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:scale-105"
			>
				<div>
					<h2 class="text-xl font-bold text-gray-800">{creature.name}</h2>
					<p class="text-sm text-gray-600">
						Price: <span class="font-bold">{creature.price}</span> credits
					</p>
				</div>
				<button
					class="focus:ring-opacity-75 rounded-full bg-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-purple-600 focus:ring-2 focus:ring-purple-400 focus:outline-none"
					onclick={() => creature.id !== undefined && buyCreature(creature.id, creature.price)}
				>
					Buy
				</button>
			</div>
		{/each}
	</ShopModal>
</main>

<style>
	/* center the shopmodal */
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
	.question-button {
		@apply focus:ring-opacity-75 rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:outline-none;
	}
</style>
