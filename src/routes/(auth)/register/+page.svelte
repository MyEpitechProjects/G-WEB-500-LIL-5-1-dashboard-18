<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head><title>Inscription · Dashboard</title></svelte:head>


	<h2>Créer un compte</h2>
	<form method="POST" use:enhance>
		{#if form?.errors?.form}<p class="form-error" role="alert">{form.errors.form}</p>{/if}

		<label>
			Adresse email
			<input
				type="email"
				name="email"
				autocomplete="email"
				required
				value={form?.values?.email ?? ''}
				aria-invalid={form?.errors?.email ? 'true' : undefined}
				aria-describedby={form?.errors?.email ? 'email-error' : undefined}
			/>
			{#if form?.errors?.email}<span id="email-error" class="field-error">{form.errors.email}</span>{/if}
		</label>

		<label>
			Nom d’utilisateur
			<input
				type="text"
				name="username"
				autocomplete="username"
				required
				minlength="2"
				maxlength="32"
				value={form?.values?.username ?? ''}
				aria-invalid={form?.errors?.username ? 'true' : undefined}
				aria-describedby={form?.errors?.username ? 'username-error' : undefined}
			/>
			{#if form?.errors?.username}<span id="username-error" class="field-error">{form.errors.username}</span>{/if}
		</label>

		<label>
			Mot de passe (8 caractères minimum)
			<input
				type="password"
				name="password"
				autocomplete="new-password"
				required
				minlength="8"
				maxlength="128"
				aria-invalid={form?.errors?.password ? 'true' : undefined}
				aria-describedby={form?.errors?.password ? 'password-error' : undefined}
			/>
			{#if form?.errors?.password}<span id="password-error" class="field-error">{form.errors.password}</span>{/if}
		</label>

		<button type="submit">S’inscrire</button>
	</form>
	<p class="alt">Déjà un compte ? <a href="/login">Se connecter</a></p>
