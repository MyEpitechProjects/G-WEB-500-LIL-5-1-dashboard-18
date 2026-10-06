<script lang="ts">
	let { children } = $props();
</script>

<main class="auth">
	<div class="card">
		<h1 class="brand">Dashboard</h1>
		{@render children()}
	</div>
</main>

<style>
	.auth {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.card {
		width: min(26rem, 100%);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.brand {
		margin: 0 0 1rem;
		font-size: 1.1rem;
	}

	/* styles des formulaires partagés par login / register / confirm */
	.card :global(h2) {
		margin: 0 0 1rem;
		font-size: 0.95rem;
	}

	.card :global(form) {
		display: grid;
		gap: 0.85rem;
	}

	.card :global(label) {
		display: grid;
		gap: 0.25rem;
		font-size: 0.82rem;
	}

	.card :global(input) {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.5rem 0.6rem;
		font: inherit;
		font-size: 0.9rem;
	}

	.card :global(button[type='submit']) {
		font: inherit;
		font-weight: 600;
		padding: 0.5rem 0.8rem;
		border-radius: 5px;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: #06121f;
		cursor: pointer;
	}

	.card :global(.field-error),
	.card :global(.form-error) {
		color: var(--danger);
		font-size: 0.78rem;
		margin: 0;
	}

	.card :global(.notice) {
		font-size: 0.85rem;
		margin: 0 0 1rem;
		line-height: 1.45;
	}

	.card :global(.alt) {
		margin: 1rem 0 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.card :global(a) {
		color: var(--accent);
	}
</style>
