import type { CodeGraph, GraphNode, GraphEdge, EdgeType } from './graphTypes';

export function createGraph(): CodeGraph {
	return {
		nodes: new Map(),
		edges: [],
	};
}

export function addNode(graph: CodeGraph, node: GraphNode) {
	if (!graph.nodes.has(node.id)) {
		graph.nodes.set(node.id, node);
	}
}

export function addEdge(graph: CodeGraph, from: string, to: string, type: EdgeType, metadata?: any) {
	graph.edges.push({ from, to, type, metadata });
}
