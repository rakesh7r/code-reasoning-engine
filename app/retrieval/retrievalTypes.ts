export interface RetrievalFile {
	path: string;
	content?: string; // Content is populated only when finalizing the unit
}

export interface RetrievalUnit {
	id: string;

	/** Set of node IDs extracted from the graph */
	nodeIds: Set<string>;

	/** Human-readable reason for why this unit exists */
	boundaryReason: string;

	files: RetrievalFile[];

	metadata: {
		/** Config flags that guard these nodes */
		configGuards?: string[];

		/** Nodes that are entry points or public API surfaces */
		entrypoints?: string[];

		/** Whether this unit represents a public interface */
		publicSurface?: boolean;
	};
}

export interface RetrievalContext {
	units: Map<string, RetrievalUnit>;
}
