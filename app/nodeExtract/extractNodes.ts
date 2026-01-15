import { Project } from 'ts-morph';
import path from 'path';
import crypto from 'crypto';
import { Node, Symbol as MorphSymbol } from 'ts-morph';

import type { CodeNode, CodeNodeType } from './types';

/**
 * Deterministic ID so graph nodes don't reshuffle every run
 */
function makeNodeId(filePath: string, name: string, kind: CodeNodeType) {
	const raw = `${filePath}:${kind}:${name}`;
	return crypto.createHash('sha1').update(raw).digest('hex');
}

function getJsDoc(node: Node): string | undefined {
	if (Node.isJSDocable(node)) {
		const docs = node.getJsDocs();
		if (docs.length === 0) return undefined;

		return docs
			.map((d) => d.getComment())
			.filter((text): text is string => !!text)
			.join('\n');
	}
	return undefined;
}

function isNodeExported(node: Node): boolean {
	if (Node.isExportable(node)) {
		return node.isExported();
	}
	return false;
}

export function extractNodesFromProject(repoRoot: string, tsConfigPath = 'tsconfig.json'): CodeNode[] {
	const project = new Project({
		tsConfigFilePath: path.join(repoRoot, tsConfigPath),
		skipAddingFilesFromTsConfig: false,
	});

	const nodes: CodeNode[] = [];

	for (const sourceFile of project.getSourceFiles()) {
		const filePath = sourceFile.getFilePath();

		// Ignore d.ts, generated, or node_modules noise
		if (filePath.includes('node_modules') || filePath.endsWith('.d.ts')) {
			continue;
		}

		// Functions
		sourceFile.getFunctions().forEach((fn) => {
			const name = fn.getName();
			if (!name) return;

			nodes.push({
				id: makeNodeId(filePath, name, 'function'),
				name,
				kind: 'function',
				filePath,
				startLine: fn.getStartLineNumber(),
				endLine: fn.getEndLineNumber(),
				exported: isNodeExported(fn),
				jsDoc: getJsDoc(fn),
			});
		});

		// Classes
		sourceFile.getClasses().forEach((cls) => {
			const name = cls.getName();
			if (!name) return;

			nodes.push({
				id: makeNodeId(filePath, name, 'class'),
				name,
				kind: 'class',
				filePath,
				startLine: cls.getStartLineNumber(),
				endLine: cls.getEndLineNumber(),
				exported: isNodeExported(cls),
				jsDoc: getJsDoc(cls),
			});
		});

		// Interfaces
		sourceFile.getInterfaces().forEach((intf) => {
			const name = intf.getName();

			nodes.push({
				id: makeNodeId(filePath, name, 'interface'),
				name,
				kind: 'interface',
				filePath,
				startLine: intf.getStartLineNumber(),
				endLine: intf.getEndLineNumber(),
				exported: isNodeExported(intf),
				jsDoc: getJsDoc(intf),
			});
		});

		// Types
		sourceFile.getTypeAliases().forEach((typeAlias) => {
			const name = typeAlias.getName();

			nodes.push({
				id: makeNodeId(filePath, name, 'type'),
				name,
				kind: 'type',
				filePath,
				startLine: typeAlias.getStartLineNumber(),
				endLine: typeAlias.getEndLineNumber(),
				exported: isNodeExported(typeAlias),
				jsDoc: getJsDoc(typeAlias),
			});
		});

		// Enums
		sourceFile.getEnums().forEach((enm) => {
			const name = enm.getName();

			nodes.push({
				id: makeNodeId(filePath, name, 'enum'),
				name,
				kind: 'enum',
				filePath,
				startLine: enm.getStartLineNumber(),
				endLine: enm.getEndLineNumber(),
				exported: isNodeExported(enm),
				jsDoc: getJsDoc(enm),
			});
		});
	}

	return nodes;
}
