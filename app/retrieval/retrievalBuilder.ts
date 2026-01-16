import { Project } from 'ts-morph';
import type { CodeGraph, GraphNode } from '../spineGraph/graphTypes';
import type { DerivedLayer, DerivedNode } from '../derived/derivedTypes';
import type { RetrievalUnit } from './retrievalTypes';
import { makeNodeId } from '../utils/nodeId';

/**
 * Creates a Retrieval Unit from a specific focus point in the graph.
 * This is the mechanism to "Materialize" a subgraph into consumed context.
 */
export class RetrievalBuilder {
	private unit: RetrievalUnit;
	private project: Project;
	private spine: CodeGraph;
	private derived: DerivedLayer;

	constructor(project: Project, spine: CodeGraph, derived: DerivedLayer, seedReason: string) {
		this.project = project;
		this.spine = spine;
		this.derived = derived;

		this.unit = {
			id: makeNodeId('unit', seedReason, 'retrieval' as any),
			nodeIds: new Set(),
			boundaryReason: seedReason,
			files: [],
			metadata: {
				configGuards: [],
				entrypoints: [],
			},
		};
	}

	/**
	 * Add a specific node to the unit.
	 * Automatically grabs the file content if it's a file-based node.
	 */
	public includeNode(nodeId: string) {
		if (this.unit.nodeIds.has(nodeId)) return;

		const node = this.spine.nodes.get(nodeId);
		if (!node) return;

		this.unit.nodeIds.add(nodeId);

		// If it's a derived node (module/semantic group), expand it
		const derivedNode = this.derived.nodes.get(nodeId);
		if (derivedNode) {
			derivedNode.memberNodeIds.forEach((memberId) => this.includeNode(memberId));
			return;
		}

		// Track Metadata
		if (node.type === 'function' || node.type === 'class') {
			// Check if exported
			// (Use metadata from extractNodes if available, otherwise check graph context)
		}
	}

	/**
	 * Expand the unit by following specific edge types from current nodes.
	 * e.g. "Include all functions called by these functions"
	 */
	public expandByEdges(edgeTypes: string[], depth = 1) {
		if (depth <= 0) return;

		const newNodes = new Set<string>();

		// Check outgoing edges from current nodes
		for (const edge of this.spine.edges) {
			if (this.unit.nodeIds.has(edge.from) && edgeTypes.includes(edge.type)) {
				if (!this.unit.nodeIds.has(edge.to)) {
					newNodes.add(edge.to);
				}
			}
		}

		newNodes.forEach((id) => this.includeNode(id));

		if (depth > 1) {
			this.expandByEdges(edgeTypes, depth - 1);
		}
	}

	/**
	 * Finalize the unit by resolving file contents for all included nodes.
	 * This ensures the LLM sees the actual code.
	 */
	public finalize(): RetrievalUnit {
		const filePaths = new Set<string>();

		// Collect file paths from all included nodes
		for (const nodeId of this.unit.nodeIds) {
			const node = this.spine.nodes.get(nodeId);
			if (node && node.filePath && node.filePath !== 'ENV') {
				filePaths.add(node.filePath);
			}
		}

		// Read file contents (Optimized: read entire file once per file)
		for (const path of filePaths) {
			try {
				const sourceFile = this.project.getSourceFile(path);
				if (sourceFile) {
					this.unit.files.push({
						path: path,
						content: sourceFile.getFullText(), // For now, simple full text
					});
				}
			} catch (err) {
				console.error(`Failed to read file for retrieval: ${path}`, err);
			}
		}

		return this.unit;
	}
}
