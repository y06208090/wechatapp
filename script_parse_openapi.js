const fs = require('fs');

try {
    const content = fs.readFileSync('openapi.json', 'utf8');
    const openapi = JSON.parse(content);

    const tags = openapi.tags || [];
    console.log('--- Tags ---');
    tags.forEach(t => console.log(`${t.name}: ${t.description}`));

    const paths = openapi.paths || {};
    console.log('\n--- Endpoints ---');
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            console.log(`[${method.toUpperCase()}] ${path} - ${details.summary || ''} (Tags: ${details.tags?.join(', ')})`);
        }
    }
} catch (e) {
    console.error(e);
}
