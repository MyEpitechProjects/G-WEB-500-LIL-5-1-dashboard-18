<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

<a class="skip" href="#main">Aller au contenu</a>

<header class="topbar">
	<a class="brand" href="/">Dashboard</a>
	<nav aria-label="Navigation principale">
		<a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>Mon dashboard</a>
		<a href="/services" aria-current={page.url.pathname === '/services' ? 'page' : undefined}>Services</a>
	</nav>
	<div class="user">
		<span>{data.user.username}</span>
		<form method="POST" action="/logout"><button type="submit">Se déconnecter</button></form>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<style>
	.skip {
		position: absolute;
		left: -999px;
	}

	.skip:focus {
		left: 0.5rem;
		top: 0.5rem;
		z-index: 20;
		background: var(--accent);
		color: #06121f;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		padding: 0.7rem 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		font-weight: 600;
		font-size: 1rem;
		color: var(--text);
		text-decoration: none;
	}

	nav {
		display: flex;
		gap: 0.25rem;
		margin-right: auto;
	}

	nav a {
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.85rem;
		padding: 0.3rem 0.6rem;
		border-radius: 5px;
	}

	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--text);
		background: var(--surface-hover);
	}

	.user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.user button {
		font: inherit;
		font-size: 0.78rem;
		padding: 0.25rem 0.6rem;
		border-radius: 5px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.user button:hover {
		background: var(--surface-hover);
	}

	main {
		padding: 1.25rem;
	}
</style>
