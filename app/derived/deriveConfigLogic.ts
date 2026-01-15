import type { CodeGraph } from '../spineGraph/graphTypes';
import type { DerivedLayer } from './derivedTypes';
import { addDerivedNode, addDerivedEdge } from './derivedTypes';
import { makeNodeId } from '../utils/nodeId';

/**
 * Identifies code paths guarded by environment variables or feature flags.
 */
export function deriveConfigLogic(spine: CodeGraph, layer: DerivedLayer) {
	// 1. Identify all ENV nodes
	const envNodes = Array.from(spine.nodes.values()).filter((n) => n.type === 'env');

	for (const envNode of envNodes) {
		const configId = makeNodeId('config', envNode.name, 'feature_flag_group' as any);

		// Find who reads this config
		// In spine: File -> READS_CONFIG -> EnvNode
		const readers: string[] = [];

		for (const edge of spine.edges) {
			if (edge.type === 'READS_CONFIG' && edge.to === envNode.id) {
				readers.push(edge.from);
			}
		}

		if (readers.length === 0) continue;

		// 2. Create a Feature Flag Group Node
		// This node represents "The Logic controlled by ENV_VAR_X"
		addDerivedNode(layer, {
			id: configId,
			type: 'feature_flag_group',
			name: `Feature: ${envNode.name}`,
			description: `Code behavior guarded by ${envNode.name}`,
			memberNodeIds: readers, // Files that read this config
		});

		// 3. Mark the relationship
		// If a Module contains a reader file, that Module is "GUARDED_BY" this flag
		// This is partially redundant with memberNodeIds but useful for traversal
		for (const readerId of readers) {
			const parentModules = layer.spineToDerived.get(readerId) || [];
			for (const modId of parentModules) {
				const mod = layer.nodes.get(modId);
				// avoid self-loops or linking to other non-structural groups
				if (mod && mod.type === 'module') {
					// Check if edge already exists to avoid dupes?
					// For simplicity, we just push. Graph consumers filter unique.
					addDerivedEdge(layer, {
						from: modId,
						to: configId,
						type: 'GUARDED_BY',
					});
				}
			}
		}
	}
}
