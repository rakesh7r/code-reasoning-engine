import type { CodeGraph } from '../spineGraph/graphTypes';
import type { DerivedLayer } from './derivedTypes';
import { addDerivedNode, addDerivedEdge } from './derivedTypes';
import { makeNodeId } from '../utils/nodeId';

/**
 * Groups nodes based on naming conventions and semantic similarity.
 * e.g. "AuthController", "AuthService", "AuthMiddleware" -> "Auth Semantic Group"
 */
export function deriveSemanticGroups(spine: CodeGraph, layer: DerivedLayer) {
	const clusters = new Map<string, string[]>();

	// Very basic heuristic: tokenize casing/delimiters and group by common root
	// Real implementation would use embeddings/LLM, but this is the "Structural" proxy.
	const commonTerms = ['Controller', 'Service', 'Provider', 'Repository', 'Manager', 'Utils', 'Handler'];

	for (const [id, node] of spine.nodes) {
		if (node.type === 'class' || node.type === 'function' || node.type === 'interface') {
			let coreName = node.name;

			// Remove common suffixes to find the 'Domain'
			for (const term of commonTerms) {
				if (coreName.endsWith(term)) {
					coreName = coreName.replace(term, '');
					break;
				}
			}

			if (coreName.length > 3) {
				// Avoid grouping "Get", "Set", "Base"
				const existing = clusters.get(coreName) || [];
				existing.push(id);
				clusters.set(coreName, existing);
			}
		}
	}

	// Create nodes for significant clusters (>1 member)
	for (const [domainName, memberIds] of clusters) {
		if (memberIds.length < 2) continue;

		const groupId = makeNodeId('semantic', domainName, 'semantic_group' as any);

		addDerivedNode(layer, {
			id: groupId,
			type: 'semantic_group',
			name: `${domainName} Domain`,
			description: `Logical grouping of code related to ${domainName}`,
			memberNodeIds: memberIds,
		});

		// Link semantic group to modules that contain these members
		// (optional: could create edges here if useful)
	}
}
