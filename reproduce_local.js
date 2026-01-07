const http = require('http');

function postData() {
    const data = JSON.stringify({
        type: 'link',
        title: 'Local Debug Test',
        destination_url: 'https://example.com',
        folder: 'General'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/qr',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Body:', body);
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(data);
    req.end();
}

setTimeout(postData, 1000);
