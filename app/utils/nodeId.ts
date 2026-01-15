import crypto from 'crypto';

export function makeNodeId(filePath: string, name: string, kind: string) {
	const raw = `${filePath}:${kind}:${name}`;
	return crypto.createHash('sha1').update(raw).digest('hex');
}
