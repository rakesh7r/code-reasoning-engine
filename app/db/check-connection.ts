import { connectToGraphDb, closeDriver } from './connection';

async function check() {
	try {
		console.log('Attempting to connect with URI:', process.env.NEO4J_URI);
		await connectToGraphDb();
		console.log('Connection successful!');
	} catch (err) {
		console.error('Connection failed:', err);
	} finally {
		await closeDriver();
	}
}

check();
