// Simple test script to verify Turso connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('URL exists:', !!url);
console.log('Token exists:', !!authToken);

if (!url || !authToken) {
    console.error('Missing credentials');
    process.exit(1);
}

const db = createClient({ url, authToken });

async function test() {
    try {
        console.log('Creating table...');
        await db.execute({
            sql: 'CREATE TABLE IF NOT EXISTS test (id TEXT, name TEXT)',
            args: []
        });
        console.log('Table created');

        console.log('Inserting with positional params...');
        await db.execute({
            sql: 'INSERT INTO test (id, name) VALUES (?, ?)',
            args: ['test123', 'Test Name']
        });
        console.log('Insert successful with positional');

        console.log('Inserting with named params...');
        await db.execute({
            sql: 'INSERT INTO test (id, name) VALUES (:id, :name)',
            args: { id: 'test456', name: 'Another Test' }
        });
        console.log('Insert successful with named');

        console.log('Querying...');
        const result = await db.execute('SELECT * FROM test');
        console.log('Results:', result.rows);

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
