import { Driver, auth } from 'neo4j-driver';
import neo4j from 'neo4j-driver';

let driver: Driver;

async function connectToGraphDb() {
	try {
		driver = neo4j.driver(process.env.NEO4J_URI, auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

		await driver.verifyConnectivity();
		console.log('Connected to Neo4j');
	} catch (error) {
		console.error('Failed to connect to Neo4j:', error);
		throw error;
	}
}

async function closeDriver() {
	if (driver) {
		await driver.close();
		console.log('Neo4j driver closed');
	}
}

export { connectToGraphDb, closeDriver };
