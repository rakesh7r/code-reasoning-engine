import { Project } from 'ts-morph';
import { makeNodeId } from '../utils/nodeId';
import { addEdge } from './codeGraph';
import type { CodeGraph } from './graphTypes';

export function buildClassRelations(project: Project, graph: CodeGraph) {
	for (const sf of project.getSourceFiles()) {
		const filePath = sf.getFilePath();

		sf.getClasses().forEach((cls) => {
			const name = cls.getName();
			if (!name) return;

			const cid = makeNodeId(filePath, name, 'class');

			const base = cls.getExtends();
			if (base) {
				const sym = base.getExpression().getSymbol();
				const decl = sym?.getDeclarations()[0];
				if (decl) {
					const tid = makeNodeId(decl.getSourceFile().getFilePath(), sym!.getName(), 'class');
					addEdge(graph, cid, tid, 'EXTENDS');
				}
			}

			cls.getImplements().forEach((impl) => {
				const sym = impl.getExpression().getSymbol();
				const decl = sym?.getDeclarations()[0];
				if (decl) {
					const tid = makeNodeId(decl.getSourceFile().getFilePath(), sym!.getName(), 'interface');
					addEdge(graph, cid, tid, 'IMPLEMENTS');
				}
			});
		});
	}
}
