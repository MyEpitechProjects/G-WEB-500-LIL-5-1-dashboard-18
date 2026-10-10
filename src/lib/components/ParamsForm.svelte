<script lang="ts">
	import type { ParamSpec, WidgetParams } from '$lib/core/types';

	let {
		specs,
		values = $bindable(),
		refreshRate = $bindable(),
		minRefresh = 5
	}: {
		specs: ParamSpec[];
		values: WidgetParams;
		refreshRate: number;
		minRefresh?: number;
	} = $props();

	let openedMultiselect = $state<string | null>(null);

	function onInput(spec: ParamSpec, event: Event): void {
		const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;

		if (spec.type === 'boolean') {
			values[spec.name] = (target as HTMLInputElement).checked;
		} else if (spec.type === 'integer') {
			values[spec.name] = Math.trunc(Number(target.value)) || 0;
		} else if (spec.type === 'number') {
			values[spec.name] = Number(target.value) || 0;
		} else {
			values[spec.name] = target.value;
		}
	}

	function getSelectedValues(spec: ParamSpec): string[] {
		const value = values[spec.name];

		return Array.isArray(value) ? value : [];
	}

	function addValue(spec: ParamSpec, value: string): void {
		const current = getSelectedValues(spec);

		if (current.includes(value)) {
			return;
		}

		values[spec.name] = [...current, value];
		openedMultiselect = null;
	}

	function removeValue(spec: ParamSpec, value: string): void {
		const current = getSelectedValues(spec);

		values[spec.name] = current.filter((item) => item !== value);
	}

	function getOptionLabel(spec: ParamSpec, value: string): string {
		return spec.options?.find((option) => option.value === value)?.label ?? value;
	}
</script>

<div class="fields">
	{#each specs as spec (spec.name)}
		<label class="field">
			<span class="label">{spec.label}{spec.required ? ' *' : ''}</span>

			{#if spec.type === 'select'}
				<select value={values[spec.name]} onchange={(e) => onInput(spec, e)}>
					{#each spec.options ?? [] as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>

			{:else if spec.type === 'multiselect'}
				<div class="multiselect">
					<div class="tags">
						{#each getSelectedValues(spec) as value (value)}
							<span class="tag">
								{getOptionLabel(spec, value)}

								<button
									type="button"
									class="remove"
									onclick={() => removeValue(spec, value)}
									aria-label={`Supprimer ${getOptionLabel(spec, value)}`}
								>
									×
								</button>
							</span>
						{/each}

						<button
							type="button"
							class="add"
							onclick={() =>
								(openedMultiselect =
									openedMultiselect === spec.name ? null : spec.name)}
						>
							+
						</button>
					</div>

					{#if openedMultiselect === spec.name}
						<div class="options">
							{#each spec.options ?? [] as option (option.value)}
								{@const selected = getSelectedValues(spec).includes(option.value)}

								{#if !selected}
									<button
										type="button"
										class="option"
										onclick={() => addValue(spec, option.value)}
									>
										{option.label}
									</button>
								{/if}
							{/each}

							{#if (spec.options ?? []).every((option) =>
								getSelectedValues(spec).includes(option.value)
							)}
								<span class="empty">Toutes les options sont sélectionnées.</span>
							{/if}
						</div>
					{/if}
				</div>

			{:else if spec.type === 'boolean'}
				<input
					type="checkbox"
					checked={Boolean(values[spec.name])}
					onchange={(e) => onInput(spec, e)}
				/>

			{:else if spec.type === 'integer' || spec.type === 'number'}
				<input
					type="number"
					value={values[spec.name]}
					min={spec.min}
					max={spec.max}
					step={spec.step ?? (spec.type === 'integer' ? 1 : 'any')}
					placeholder={spec.placeholder}
					oninput={(e) => onInput(spec, e)}
				/>

			{:else}
				<input
					type={spec.type === 'url' ? 'url' : 'text'}
					value={values[spec.name]}
					placeholder={spec.placeholder}
					oninput={(e) => onInput(spec, e)}
				/>
			{/if}

			{#if spec.help}
				<span class="help">{spec.help}</span>
			{/if}
		</label>
	{/each}

	<label class="field">
		<span class="label">Rafraîchissement (secondes)</span>
		<input type="number" min={minRefresh} step="1" bind:value={refreshRate} />
		<span class="help">Minimum {minRefresh} s pour ce widget.</span>
	</label>
</div>

<style>
	.fields {
		display: grid;
		min-width: 0;
		gap: 0.75rem;
	}

	.field {
		display: grid;
		gap: 0.25rem;
		min-width: 0;
	}

	.label {
		font-size: 0.8rem;
		color: var(--text);
	}

	.help {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	input[type='text'],
	input[type='url'],
	input[type='number'],
	select {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		padding: 0.35rem 0.5rem;
		font: inherit;
		font-size: 0.85rem;
		width: 100%;
		min-width: 0;
	}

	input[type='checkbox'] {
		justify-self: start;
		width: 1rem;
		height: 1rem;
	}

	.multiselect {
		position: relative;
	}

	.tags {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.35rem;
		min-height: 2rem;
		padding: 0.3rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.45rem;
		background: var(--border);
		border-radius: 3px;
		font-size: 0.78rem;
		color: var(--text);
	}

	.remove {
		border: 0;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
	}

	.remove:hover {
		color: var(--text);
	}

	.add {
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
	}

	.add:hover {
		color: var(--text);
	}

	.options {
		position: absolute;
		z-index: 10;
		left: 0;
		right: 0;
		top: calc(100% + 0.25rem);
		display: grid;
		padding: 0.25rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		box-shadow: 0 4px 12px rgb(0 0 0 / 20%);
		max-height: 14rem;
		overflow-y: auto;
	}

	.option {
		border: 0;
		background: transparent;
		color: var(--text);
		text-align: left;
		padding: 0.4rem 0.5rem;
		border-radius: 3px;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
	}

	.option:hover {
		background: var(--border);
	}

	.empty {
		padding: 0.4rem 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	@media (max-width: 40rem) {
		input[type='text'],
		input[type='url'],
		input[type='number'],
		select {
			font-size: 1rem;
			padding: 0.5rem 0.6rem;
		}

		.option {
			padding: 0.6rem 0.5rem;
			font-size: 0.9rem;
		}
	}
</style>