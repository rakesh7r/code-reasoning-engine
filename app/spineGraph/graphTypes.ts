export type NodeType = 'file' | 'function' | 'class' | 'interface' | 'type' | 'enum' | 'method' | 'config' | 'env';

export type EdgeType =
	| 'IMPORTS'
	| 'EXPORTS'
	| 'CALLS'
	| 'INSTANTIATES'
	| 'READS_CONFIG'
	| 'GUARDED_BY'
	| 'IMPLEMENTS'
	| 'EXTENDS';

export interface GraphNode {
	id: string;
	type: NodeType;
	name: string;
	filePath?: string;
}

export interface CallGraphMetadata {
	via?: 'identifier' | 'property' | 'framework' | 'hof';
	certainty?: 'static' | 'heuristic';
	location?: {
		file: string;
		line: number;
		column: number;
	};
	args?: {
		text: string;
		type: string;
		typeId?: string;
	}[];
}

export interface GraphEdge {
	from: string;
	to: string;
	type: EdgeType;
	metadata?: CallGraphMetadata;
}

export interface CodeGraph {
	nodes: Map<string, GraphNode>;
	edges: GraphEdge[];
}
