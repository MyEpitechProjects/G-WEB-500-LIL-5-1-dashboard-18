<script lang="ts">
	import '../app.css';
	import { registerAllWidgets } from '$lib/widgets';

	registerAllWidgets();

	let { children } = $props();
</script>

{@render children()}
