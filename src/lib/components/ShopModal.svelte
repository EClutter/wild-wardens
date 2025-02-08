<script>
	let { showShopModal = $bindable(), header, children } = $props();

	let dialog = $state(); // HTMLDialogElement
    
	$effect(() => {
		if (showShopModal) dialog.showModal();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (showShopModal = false)}
	onclick={(e) => {
		if (e.target === dialog) dialog.close();
	}}
	class="modal-container max-w-lg rounded-md border-none p-0"
>
	<div class="p-4">
		{@render header?.()}
		<hr class="my-2" />
		{@render children?.()}
		<hr class="my-2" />
		<!-- svelte-ignore a11y_autofocus -->
		<button autofocus onclick={() => dialog.close()} class="mt-2 block">close modal</button>
	</div>
</dialog>

<style>
</style>
