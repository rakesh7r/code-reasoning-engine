import { RetrievalBuilder } from './app/retrieval/retrievalBuilder';
import { SpreadElement } from 'ts-morph';
import type { CodeGraph } from './app/spineGraph/graphTypes';
import type { Project } from 'ts-morph';
import type { DerivedLayer } from './app/derived/derivedTypes';

export function demo(project: Project, spine: CodeGraph, derived: DerivedLayer) {
	// Demo: Create a retrieval unit for a "calendar" analysis
	const builder = new RetrievalBuilder(project, spine, derived, 'Analysis of calendar Entry');

	// Pick a starting node (Find a meaningful file, e.g. an auth handler or service)
	const startNodes = Array.from(spine.nodes.values())
		.filter((n) => {
			if (n.type !== 'file') return false;

			const isIndex = n.name === 'index.ts';
			const isRelevantDir = n.filePath?.toLowerCase().includes('/calendar/');

			if (isIndex && isRelevantDir) return true;

			const isNamedMatch = n.name.toLowerCase().includes('calendar') && /^[^.]+\.ts$/i.test(n.name);

			return isNamedMatch;
		})
		.slice(0, 3);

	if (startNodes.length > 0) {
		console.log('Starting Trace from multiple files:');
		startNodes.forEach((n) => console.log(` - ${n.filePath}`));
		startNodes.forEach((n) => builder.includeNode(n.id));
	} else {
		console.log('No matching start node found, picking random non-d.ts file');
		const fallback = Array.from(spine.nodes.values())
			.filter((n) => n.type === 'file' && !n.name.endsWith('.d.ts'))
			.slice(0, 1);
		fallback.forEach((n) => builder.includeNode(n.id));
	}

	// Walk dependencies
	builder.expandByEdges(['IMPORTS', 'CALLS'], 10);

	const unit = builder.finalize();

	console.log('--- Retrieval Unit ---');
	console.log(`ID: ${unit.id}`);
	console.log(`Reason: ${unit.boundaryReason}`);
	console.log(`Included Nodes: ${unit.nodeIds.size}`);
	console.log(`Files Materialized: ${unit.files.length}`);
	console.log(`unit nodeIds:`, unit.nodeIds);
	console.log(`unit files:`, unit.files);

	if (unit.files.length > 0) {
		console.log(`Sample File: ${unit.files[0]?.path}`);
	}
}
