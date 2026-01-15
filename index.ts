import { extractNodesFromProject } from './app/nodeExtract/extractNodes';

const nodes = extractNodesFromProject(
	'/Users/rakeshg/workspace/SD-Apps/code-reasonnig/cal.com/apps/api/v2',
	'tsconfig.json'
);

console.log(nodes.length);
console.log(nodes.slice(100, 115));
