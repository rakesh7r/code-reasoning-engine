import { Project, Node } from 'ts-morph';
import path from 'path';
import { makeNodeId } from '../utils/nodeId';
import { addNode, addEdge } from './codeGraph';
import type { CodeGraph } from './graphTypes';

function getEnvId(name: string) {
	return makeNodeId('ENV', name, 'env');
}

function getFileId(filePath: string) {
	return makeNodeId(filePath, path.basename(filePath), 'file');
}

export function buildEnvReads(project: Project, graph: CodeGraph) {
	for (const sf of project.getSourceFiles()) {
		sf.forEachDescendant((node) => {
			if (!Node.isPropertyAccessExpression(node)) return;

			if (node.getExpression().getText() === 'process.env') {
				const key = node.getName();
				const envId = getEnvId(key);

				// Ensure env node exists
				addNode(graph, {
					id: envId,
					type: 'env',
					name: key,
					filePath: 'ENV',
				});

				const fid = getFileId(sf.getFilePath());

				// We assume file node exists because buildFileGraph runs first
				addEdge(graph, fid, envId, 'READS_CONFIG');
			}
		});
	}
}
