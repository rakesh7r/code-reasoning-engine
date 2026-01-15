import { Project, Node, ts } from 'ts-morph';
import { makeNodeId } from '../utils/nodeId';
import { addEdge } from './codeGraph';
import type { CodeGraph } from './graphTypes';

export function buildCallGraph(project: Project, graph: CodeGraph) {
	for (const sf of project.getSourceFiles()) {
		const filePath = sf.getFilePath();

		sf.forEachDescendant((node) => {
			if (!Node.isCallExpression(node)) return;

			const symbol = node.getExpression().getSymbol();
			if (!symbol) return;

			const decl = symbol.getDeclarations()[0];
			if (!decl) return;

			const caller = node.getFirstAncestorByKind(ts.SyntaxKind.FunctionDeclaration);
			if (!caller || !caller.getName()) return;

			const from = makeNodeId(filePath, caller.getName()!, 'function');
			const to = makeNodeId(decl.getSourceFile().getFilePath(), symbol.getName(), 'function');

			addEdge(graph, from, to, 'CALLS');
		});
	}
}
