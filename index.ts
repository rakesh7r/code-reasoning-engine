import { createProject } from './app/utils/project';
import { buildDependencyGraph } from './app/spineGraph/buildGraph';

const project = createProject('/Users/rakeshg/workspace/SD-Apps/code-reasonnig/cal.com/apps/api/v2', 'tsconfig.json');

const graph = buildDependencyGraph(project);

console.log(`Graph Nodes: ${graph.nodes.size}`);
console.log(`Graph Edges: ${graph.edges.length}`);
