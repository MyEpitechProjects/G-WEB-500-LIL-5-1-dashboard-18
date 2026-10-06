import type { Component } from 'svelte';


export type ParamType = 'string' | 'integer' | 'number' | 'boolean' | 'select' | 'url' | 'multiselect';

export interface ParamSpec {
	name: string;
	label: string;
	type: ParamType;
	default: string | number | boolean | string[];
	required?: boolean;
	placeholder?: string;
	help?: string;
	min?: number;
	max?: number;
	step?: number;
	options?: { value: string; label: string }[];
}

export type WidgetParams = Record<string, string | number | boolean | string[]>;

export interface LoadContext<P extends WidgetParams = WidgetParams> {
	params: P;
	fetch: typeof globalThis.fetch;
	signal: AbortSignal;
	instanceId: string;
}

export interface WidgetDefinition<P extends WidgetParams = WidgetParams, D = unknown> {
	service: string;
	name: string;
	title: string;
	description: string;
	params: ParamSpec[];
	defaultRefresh: number;
	minRefresh?: number;
	size?: { w: number; h: number };
	load(ctx: LoadContext<P>): Promise<D>;
	component: Component<WidgetRenderProps<P, D>>;
}

export interface WidgetRenderProps<P extends WidgetParams = WidgetParams, D = unknown> {
	data: D;
	params: P;
	refresh: () => void;
}

export interface WidgetInstance {
	id: string;
	service: string;
	widget: string;
	params: WidgetParams;
	refreshRate: number;
	position: number;
	size?: { w: number; h: number };
}

export type WidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AboutResponse {
	client: { host: string };
	server: {
		current_time: number;
		services: {
			name: string;
			widgets: {
				name: string;
				description: string;
				params: { name: string; type: 'integer' | 'string' }[];
			}[];
		}[];
	};
}
