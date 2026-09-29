<script lang="ts">
	import { dashboard } from '$lib/stores/dashboard.svelte';
	import type { WidgetInstance } from '$lib/core/types';
	import WidgetHost from './WidgetHost.svelte';

	let { onconfigure }: { onconfigure: (instance: WidgetInstance) => void } = $props();

	let draggedId = $state<string | null>(null);

	/**
	 * Seule l'instance dont on a pressé l'entête est réellement `draggable`.
	 * L'attribut draggable doit être porté par l'élément déplacé (la cellule),
	 * on l'active donc à la volée quand le pointeur descend sur la poignée,
	 * et on le désactive dès que le geste est terminé.
	 */
	let handleId = $state<string | null>(null);

	function onPointerDown(event: PointerEvent, id: string): void {
		const target = event.target as HTMLElement | null;
		// les boutons d'action vivent aussi dans l'entête : ils ne déclenchent pas de drag
		if (!target || target.closest('button')) return;
		if (!target.closest('[data-drag-handle]')) return;
		handleId = id;
	}

	function endGesture(): void {
		handleId = null;
		draggedId = null;
	}

	function onDrop(event: DragEvent, targetIndex: number): void {
		event.preventDefault();
		if (draggedId) dashboard.move(draggedId, targetIndex);
		endGesture();
	}

	/** Déplacement au clavier, pour rester utilisable sans souris. */
	function onKeydown(event: KeyboardEvent, index: number, id: string): void {
		if (!event.altKey) return;
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			dashboard.move(id, index + 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			dashboard.move(id, index - 1);
		}
	}
</script>

<svelte:window onpointerup={() => (handleId = null)} />

<div class="grid">
	{#each dashboard.instances as instance, index (instance.id)}
		<div
			class="cell"
			class:dragging={draggedId === instance.id}
			style:--w={instance.size?.w ?? 1}
			style:--h={instance.size?.h ?? 1}
			draggable={handleId === instance.id}
			role="listitem"
			tabindex="0"
			onpointerdown={(e) => onPointerDown(e, instance.id)}
			ondragstart={() => (draggedId = instance.id)}
			ondragend={endGesture}
			ondragover={(e) => e.preventDefault()}
			ondrop={(e) => onDrop(e, index)}
			onkeydown={(e) => onKeydown(e, index, instance.id)}
		>
			<WidgetHost
				{instance}
				onconfigure={() => onconfigure(instance)}
				onremove={() => dashboard.remove(instance.id)}
			/>
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		grid-auto-rows: 15rem;
		gap: 0.75rem;
	}

	.cell {
		grid-column: span min(var(--w), 3);
		grid-row: span var(--h);
		min-height: 0;
	}

	.cell:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: 6px;
	}

	.dragging {
		opacity: 0.4;
	}

	@media (max-width: 40rem) {
		.grid {
			grid-template-columns: 1fr;
		}

		.cell {
			grid-column: span 1;
		}
	}
</style>