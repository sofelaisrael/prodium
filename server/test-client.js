const http = require('http');

const data = Buffer.alloc(1024, 'x');
const req = http.request({
  hostname: 'localhost',
  port: 3999,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'content-type': 'image/jpeg',
    'content-length': data.length,
    'x-file-ext': 'jpg',
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
    process.exit(0);
  });
});
req.write(data);
req.end();
