import { Project } from 'ts-morph';
import { createGraph, addNode } from './codeGraph';
import { extractNodes } from '../nodeExtract/extractNodes';
import { buildFileGraph } from './buildFileEdges';
import { buildClassRelations } from './buildClassEdges';
import { buildCallGraph } from './buildCallEdges';
import { buildEnvReads } from './buildConfigEdges';
import type { NodeType } from './graphTypes';

export function buildDependencyGraph(project: Project) {
	const graph = createGraph();

	// 1. Populate nodes from AST extraction
	const astNodes = extractNodes(project);
	for (const node of astNodes) {
		addNode(graph, {
			id: node.id,
			type: node.kind as NodeType, // Assumes strict overlap of types
			name: node.name,
			filePath: node.filePath,
		});
	}

	// 2. Build edges and additional nodes (files, envs)
	buildFileGraph(project, graph);
	buildClassRelations(project, graph);
	buildCallGraph(project, graph);
	buildEnvReads(project, graph);

	return graph;
}
