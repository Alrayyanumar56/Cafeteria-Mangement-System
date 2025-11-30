const db = require('./db');

async function testConnection() {
    try {
        const [results] = await db.query('SELECT 1');
        console.log('DB connected!', results);
    } catch (err) {
        console.log('Connection failed', err);
    }
}

testConnection();
