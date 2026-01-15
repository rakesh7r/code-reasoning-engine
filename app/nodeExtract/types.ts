export type CodeNodeType = 'function' | 'class' | 'interface' | 'type' | 'enum';

export interface CodeNode {
	id: string; // stable, deterministic
	name: string;
	kind: CodeNodeType;
	filePath: string;

	startLine: number;
	endLine: number;

	exported: boolean;

	jsDoc?: string;
}
