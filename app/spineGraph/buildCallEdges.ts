import { Project, Node, ts } from 'ts-morph';
import { makeNodeId } from '../utils/nodeId';
import { addEdge } from './codeGraph';
import path from 'path';
import type { CodeGraph } from './graphTypes';

export function buildCallGraph(project: Project, graph: CodeGraph) {
	for (const sf of project.getSourceFiles()) {
		const filePath = sf.getFilePath();

		sf.forEachDescendant((node) => {
			if (!Node.isCallExpression(node)) return;

			const expr = node.getExpression();
			let symbol = expr.getSymbol();

			// Try resolving alias if direct symbol resolution fails
			if (!symbol && Node.isPropertyAccessExpression(expr)) {
				symbol = expr.getNameNode().getSymbol();
			}

			// Determine caller (Function/Method)
			const caller =
				node.getFirstAncestorByKind(ts.SyntaxKind.FunctionDeclaration) ||
				node.getFirstAncestorByKind(ts.SyntaxKind.MethodDeclaration) ||
				node.getFirstAncestorByKind(ts.SyntaxKind.ArrowFunction); // Capture lambdas too if needed context

			// We need a stable ID for the caller.
			// If it's an anonymous arrow function, we might skip or attach to parent file/variable
			// For now, let's stick to named functions/methods for stable 'from' IDs
			let fromId: string | undefined;
			if (caller) {
				if (Node.isFunctionDeclaration(caller) || Node.isMethodDeclaration(caller)) {
					const name = caller.getName();
					if (name) fromId = makeNodeId(filePath, name, 'function');
				}
			}

			// If no identifiable caller, maybe it's top-level script
			if (!fromId) {
				fromId = makeNodeId(filePath, path.basename(filePath), 'file');
			}

			const location = {
				file: filePath,
				line: node.getStartLineNumber(),
				column: sf.getLineAndColumnAtPos(node.getStart()).column,
			};

			// Extract Arguments
			// Extract Arguments
			const args = node.getArguments().map((arg) => {
				const argType = arg.getType();
				let typeId: string | undefined;

				// 1. Try to resolve the type definition symbol (Interface, Class, Enum)
				const typeSymbol = argType.getSymbol() || argType.getAliasSymbol();

				if (typeSymbol) {
					const decls = typeSymbol.getDeclarations();
					if (decls.length > 0) {
						const decl = decls[0];
						const declFile = decl?.getSourceFile().getFilePath();

						if (declFile) {
							// We need to guess the kind. For linking, usually 'interface' | 'class' | 'type' | 'enum'
							let kind: any = 'type'; // Default fallback
							if (Node.isInterfaceDeclaration(decl)) kind = 'interface';
							else if (Node.isClassDeclaration(decl)) kind = 'class';
							else if (Node.isEnumDeclaration(decl)) kind = 'enum';

							typeId = makeNodeId(declFile, typeSymbol.getName(), kind);
						}
					}
				}

				return {
					text: arg.getText(),
					type: argType.getText(),
					typeId,
				};
			});

			// Case 1: RESOLVED CALL
			if (symbol) {
				const decls = symbol.getDeclarations();
				const decl = decls[0];

				if (decl) {
					const targetFile = decl.getSourceFile().getFilePath();
					const targetName = symbol.getName();
					const toId = makeNodeId(targetFile, targetName, 'function');

					addEdge(graph, fromId, toId, 'CALLS', {
						via: Node.isPropertyAccessExpression(expr) ? 'property' : 'identifier',
						certainty: 'static',
						location,
						args,
					});
					return;
				}
			}

			// Case 2: UNRESOLVED / HEURISTIC (Simple Name Match)
			// If ts-morph can't resolve it (e.g. dynamic, or complex inference), record as UNKNOWN or strict name match?
			// User schema asked for "to: UNKNOWN".
			// Let's capture the text just in case we want to post-process heuristic match later.

			// For strict adherence to schema:
			// addEdge(graph, fromId, 'UNKNOWN', 'CALLS', { ... heuristic ... });
		});
	}
}
