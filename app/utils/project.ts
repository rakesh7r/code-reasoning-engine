import { Project } from 'ts-morph';
import path from 'path';

export function createProject(repoRoot: string, tsConfigPath = 'tsconfig.json'): Project {
	return new Project({
		tsConfigFilePath: path.join(repoRoot, tsConfigPath),
		skipAddingFilesFromTsConfig: false,
	});
}
