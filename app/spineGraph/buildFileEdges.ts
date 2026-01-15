import { Project } from 'ts-morph';
import path from 'path';
import { makeNodeId } from '../utils/nodeId';
import { addNode, addEdge } from './codeGraph';
import type { CodeGraph } from './graphTypes';

function getFileId(filePath: string) {
	return makeNodeId(filePath, path.basename(filePath), 'file');
}

export function buildFileGraph(project: Project, graph: CodeGraph) {
	for (const sf of project.getSourceFiles()) {
		const filePath = sf.getFilePath();
		if (filePath.includes('node_modules')) continue;

		const fid = getFileId(filePath);

		addNode(graph, {
			id: fid,
			type: 'file',
			name: path.basename(filePath),
			filePath,
		});

		// IMPORTS
		sf.getImportDeclarations().forEach((imp) => {
			const resolved = imp.getModuleSpecifierSourceFile();
			if (!resolved) return;

			const targetPath = resolved.getFilePath();
			const tid = getFileId(targetPath);

			addNode(graph, {
				id: tid,
				type: 'file',
				name: path.basename(targetPath),
				filePath: targetPath,
			});

			addEdge(graph, fid, tid, 'IMPORTS');
		});

		// EXPORTS (re-exports)
		sf.getExportDeclarations().forEach((exp) => {
			const resolved = exp.getModuleSpecifierSourceFile();
			if (!resolved) return;

			const tid = getFileId(resolved.getFilePath());
			addEdge(graph, fid, tid, 'EXPORTS');
		});
	}
}
