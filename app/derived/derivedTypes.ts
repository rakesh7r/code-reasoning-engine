import type { CodeGraph, GraphNode } from '../spineGraph/graphTypes';

export type DerivedNodeType = 'module' | 'feature_flag_group' | 'semantic_group';

export interface DerivedNode {
	id: string;
	type: DerivedNodeType;
	name: string;
	description?: string;
	/** IDs of the raw spine nodes contained in this higher-order node */
	memberNodeIds: string[];
}

export interface DerivedEdge {
	from: string; // DerivedNode ID
	to: string; // DerivedNode ID
	type: 'DEPENDS_ON' | 'GUARDED_BY' | 'RELATED_TO';
	weight?: number; // How many underlying connections exist
}

export interface DerivedLayer {
	nodes: Map<string, DerivedNode>;
	edges: DerivedEdge[];
	/**
	 * Map from raw spine node ID to the derived nodes that contain it.
	 * One raw node can belong to multiple derived groups.
	 */
	spineToDerived: Map<string, string[]>;
}

export function createDerivedLayer(): DerivedLayer {
	return {
		nodes: new Map(),
		edges: [],
		spineToDerived: new Map(),
	};
}

export function addDerivedNode(layer: DerivedLayer, node: DerivedNode) {
	if (!layer.nodes.has(node.id)) {
		layer.nodes.set(node.id, node);

		// Index reverse lookup
		for (const memberId of node.memberNodeIds) {
			const existing = layer.spineToDerived.get(memberId) || [];
			existing.push(node.id);
			layer.spineToDerived.set(memberId, existing);
		}
	}
}

export function addDerivedEdge(layer: DerivedLayer, edge: DerivedEdge) {
	layer.edges.push(edge);
}
