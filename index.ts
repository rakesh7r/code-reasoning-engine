import { createProject } from './app/utils/project';
import { buildDependencyGraph } from './app/spineGraph/buildGraph';
import { demo } from './demo';

const project = createProject('/Users/rakeshg/workspace/SD-Apps/code-reasonnig/cal.com/apps/api/v2', 'tsconfig.json');

const { spine, derived } = buildDependencyGraph(project);

console.log(`Spine Nodes: ${spine.nodes.size}`);
console.log(`Spine Edges: ${spine.edges.length}`);
console.log(`Derived Nodes: ${derived.nodes.size}`);
console.log(`Derived Edges: ${derived.edges.length}`);

// demo(project, spine, derived);
