<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head><title>Connexion · Dashboard</title></svelte:head>

<h2>Connexion</h2>

{#if data.confirmed}
	<p class="notice" role="status">Adresse confirmée. Vous pouvez vous connecter.</p>
{/if}

{#if data.created}
	<p class="notice" role="status">Compte créé. Vous pouvez vous connecter.</p>
{/if}

{#if data.registered}
	<p class="notice" role="status">
		Un lien de confirmation a été envoyé à <strong>{data.email}</strong>. Il est valable 24 h : vous
		pourrez vous connecter une fois votre adresse confirmée.
	</p>
{/if}

<form method="POST" use:enhance>
	{#if form?.error}<p class="form-error" role="alert">{form.error}</p>{/if}

	<label>
		Adresse email
		<input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
	</label>

	<label>
		Mot de passe
		<input type="password" name="password" autocomplete="current-password" required />
	</label>

	<button type="submit">Se connecter</button>
</form>

<p class="alt">Pas encore de compte ? <a href="/register">S’inscrire</a></p>