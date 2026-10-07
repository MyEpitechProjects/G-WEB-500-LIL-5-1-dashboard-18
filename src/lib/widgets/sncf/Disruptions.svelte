<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { DisruptionsParams } from './index';

	let { data, params }: WidgetRenderProps<DisruptionsParams, any> = $props();

</script>

<div class="sncf-widget">
	<h4>Perturbations SNCF</h4>

	{#if data?.error}
		<p class="error">{data.error}</p>
	{:else if !data || !data.disruptions || data.disruptions.length === 0}
		<div class="all-good">
			<span class="icon">✅</span>
			<p>Aucune perturbation majeure signalée.</p>
		</div>
	{:else}
		<ul class="disruptions">
			{#each data.disruptions.slice(0, 5) as disruption}
				<li class="disruption">
					<div class="severity" style="background-color: #{disruption.severity?.color || 'aaa'};">
						{disruption.severity?.name || 'Info'}
					</div>
					<div class="message">
						{disruption.messages?.[0]?.text || 'Perturbation en cours'}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sncf-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		background: #ffffff;
		color: #333;
		border-radius: 8px;
		overflow-y: auto;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	h4 {
		margin: 0 0 15px 0;
		color: #0088CE;
		font-size: 1rem;
		border-bottom: 2px solid #0088ce22;
		padding-bottom: 5px;
	}

	.disruptions {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.disruption {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 10px;
		background: #fdfdfd;
		border: 1px solid #eee;
		border-radius: 6px;
	}

	.severity {
		display: inline-block;
		align-self: flex-start;
		color: white;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: bold;
		text-transform: uppercase;
	}

	.message {
		font-size: 0.85rem;
		line-height: 1.4;
		color: #444;
	}

	.error {
		color: #d9534f;
		font-size: 0.9rem;
		text-align: center;
		margin-top: 20px;
	}

	.all-good {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: #5cb85c;
		text-align: center;
	}

	.icon {
		font-size: 2rem;
		margin-bottom: 10px;
	}
</style>
