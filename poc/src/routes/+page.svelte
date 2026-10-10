<script lang="ts">
	let { data } = $props();

	interface Weather {
		city: string;
		country: string;
		unit: 'c' | 'f';
		temperature: number;
		humidity: number;
		wind: number;
	}

	let draft = $state({ ...data.config });
	let applied = $state({ ...data.config });

	let weather = $state<Weather | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);
	let lastUpdate = $state<Date | null>(null);
	let saveError = $state<string | null>(null);

	async function load(city: string, unit: string, signal?: AbortSignal): Promise<void> {
		loading = true;
		try {
			const query = new URLSearchParams({ city, unit });
			const response = await fetch(`/api/weather?${query}`, { signal });
			if (!response.ok) {
				const body = await response.json().catch(() => null);
				throw new Error(body?.message ?? `Request failed (${response.status})`);
			}
			weather = await response.json();
			error = null;
			lastUpdate = new Date();
		} catch (e) {
			if (signal?.aborted) return;
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const { city, unit, refresh } = applied;
		const controller = new AbortController();
		void load(city, unit, controller.signal);
		const handle = setInterval(() => void load(city, unit), refresh * 1000);
		return () => {
			clearInterval(handle);
			controller.abort();
		};
	});

	async function save(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		saveError = null;
		const response = await fetch('/api/config', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(draft)
		});
		if (!response.ok) {
			const body = await response.json().catch(() => null);
			saveError = body?.message ?? 'Could not save the configuration.';
			return;
		}
		applied = await response.json();
	}
</script>

<svelte:head><title>Dashboard PoC</title></svelte:head>

<main>
	<h1>Dashboard PoC</h1>
	<p class="intro">
		One configurable widget. Data comes from the Open-Meteo API through a SvelteKit server route, the
		configuration is stored in SQLite.
	</p>

	<div class="layout">
		<article class="widget" aria-live="polite">
			<h2>Temperature</h2>
			{#if error}
				<p class="error" role="alert">{error}</p>
			{:else if !weather}
				<p class="muted">Loading…</p>
			{:else}
				<p class="place">{weather.city}{weather.country ? `, ${weather.country}` : ''}</p>
				<p class="temp">{Math.round(weather.temperature)}°{weather.unit.toUpperCase()}</p>
				<p class="muted">Humidity {weather.humidity}% · Wind {weather.wind} km/h</p>
			{/if}
			{#if lastUpdate}
				<p class="muted small">
					Updated at {lastUpdate.toLocaleTimeString('en-GB')}{loading ? ' · refreshing…' : ''}
				</p>
			{/if}
		</article>

		<form onsubmit={save}>
			<h2>Configuration</h2>
			<label>
				City
				<input type="text" bind:value={draft.city} required maxlength="80" />
			</label>
			<label>
				Unit
				<select bind:value={draft.unit}>
					<option value="c">Celsius (°C)</option>
					<option value="f">Fahrenheit (°F)</option>
				</select>
			</label>
			<label>
				Refresh rate (seconds)
				<input type="number" bind:value={draft.refresh} min="5" max="86400" step="1" required />
			</label>
			{#if saveError}<p class="error" role="alert">{saveError}</p>{/if}
			<button type="submit">Apply</button>
		</form>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #10141a;
		color: #e4e9f0;
		font-family: system-ui, sans-serif;
	}

	main {
		max-width: 44rem;
		margin: 0 auto;
		padding: 1.25rem;
	}

	h1 {
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	h2 {
		font-size: 0.9rem;
		margin: 0 0 0.75rem;
	}

	.intro,
	.muted {
		color: #8a93a3;
		font-size: 0.85rem;
	}

	.small {
		font-size: 0.72rem;
	}

	.layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.widget,
	form {
		background: #171d26;
		border: 1px solid #262f3c;
		border-radius: 6px;
		padding: 1rem;
	}

	.place {
		margin: 0;
		color: #8a93a3;
	}

	.temp {
		margin: 0.25rem 0;
		font-size: 2.5rem;
		font-weight: 600;
	}

	form {
		display: grid;
		gap: 0.75rem;
		align-content: start;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.8rem;
	}

	input,
	select {
		background: #10141a;
		border: 1px solid #262f3c;
		border-radius: 4px;
		color: inherit;
		padding: 0.4rem 0.5rem;
		font: inherit;
		min-width: 0;
	}

	button {
		justify-self: start;
		background: #4fc3f7;
		border: 0;
		border-radius: 5px;
		color: #06121f;
		font: inherit;
		font-weight: 600;
		padding: 0.4rem 0.9rem;
		cursor: pointer;
	}

	.error {
		color: #f2777a;
		font-size: 0.85rem;
		margin: 0;
	}
</style>
