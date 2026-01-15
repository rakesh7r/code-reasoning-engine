import type { CodeGraph } from '../spineGraph/graphTypes';
import type { DerivedLayer } from './derivedTypes';
import { addDerivedNode, addDerivedEdge } from './derivedTypes';
import path from 'path';
import { makeNodeId } from '../utils/nodeId';

/**
 * Collapses files in the same directory into a 'Module' node.
 * Useful for zooming out to see architecture.
 */
export function deriveModules(spine: CodeGraph, layer: DerivedLayer) {
	const dirGroups = new Map<string, string[]>();

	// 1. Group files by directory
	for (const [id, node] of spine.nodes) {
		if (node.type === 'file' && node.filePath) {
			const dir = path.dirname(node.filePath);
			if (dir.includes('node_modules')) continue;

			const existing = dirGroups.get(dir) || [];
			existing.push(id);
			dirGroups.set(dir, existing);
		}
	}

	// 2. Create Module Derived Nodes
	for (const [dir, fileIds] of dirGroups) {
		const moduleName = path.basename(dir);
		const moduleId = makeNodeId(dir, moduleName, 'module' as any); // cast for now if needed or update util

		addDerivedNode(layer, {
			id: moduleId,
			type: 'module',
			name: moduleName,
			description: `Module containing ${fileIds.length} files in ${dir}`,
			memberNodeIds: fileIds,
		});
	}

	// 3. Infer dependencies between modules based on file imports
	// If File A (in Mod A) imports File B (in Mod B), then Mod A -> Mod B
	const moduleDeps = new Map<string, Set<string>>();

	for (const edge of spine.edges) {
		if (edge.type === 'IMPORTS' || edge.type === 'CALLS') {
			// Find which modules contain the source and target
			const sourceModules = layer.spineToDerived.get(edge.from) || [];
			const targetModules = layer.spineToDerived.get(edge.to) || [];

			for (const sMod of sourceModules) {
				for (const tMod of targetModules) {
					if (sMod === tMod) continue; // Ignore internal module calls

					// Retrieve nodes to check types (only link module-to-module)
					const sNode = layer.nodes.get(sMod);
					const tNode = layer.nodes.get(tMod);

					if (sNode?.type === 'module' && tNode?.type === 'module') {
						const key = `${sMod}|${tMod}`;
						if (!moduleDeps.has(key)) {
							moduleDeps.set(key, new Set());
						}
						// Track underlying edge types could be useful for weighting
						moduleDeps.get(key)!.add(edge.type);
					}
				}
			}
		}
	}

	// 4. Create edges
	for (const [key, edgeTypes] of moduleDeps) {
		const [from, to] = key.split('|');
		if (from && to) {
			addDerivedEdge(layer, {
				from,
				to,
				type: 'DEPENDS_ON',
				weight: edgeTypes.size,
			});
		}
	}
}
