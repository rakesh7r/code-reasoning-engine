import { Project } from 'ts-morph';
import { createGraph, addNode } from './codeGraph';
import { extractNodes } from '../nodeExtract/extractNodes';
import { buildFileGraph } from './buildFileEdges';
import { buildClassRelations } from './buildClassEdges';
import { buildCallGraph } from './buildCallEdges';
import { buildEnvReads } from './buildConfigEdges';
import { createDerivedLayer } from '../derived/derivedTypes';
import { deriveModules } from '../derived/deriveModules';
import { deriveConfigLogic } from '../derived/deriveConfigLogic';
import { deriveSemanticGroups } from '../derived/deriveSemanticGroups';
import type { NodeType } from './graphTypes';

export function buildDependencyGraph(project: Project) {
	const graph = createGraph();

	// 1. Spine: Populate nodes from AST extraction
	const astNodes = extractNodes(project);
	for (const node of astNodes) {
		addNode(graph, {
			id: node.id,
			type: node.kind as NodeType,
			name: node.name,
			filePath: node.filePath,
		});
	}

	// 2. Spine: Build edges
	buildFileGraph(project, graph);
	buildClassRelations(project, graph);
	buildCallGraph(project, graph);
	buildEnvReads(project, graph);

	// 3. Derived Layer: Higher-order reasoning
	const derived = createDerivedLayer();
	deriveModules(graph, derived);
	deriveConfigLogic(graph, derived);
	deriveSemanticGroups(graph, derived);

	return { spine: graph, derived };
}
