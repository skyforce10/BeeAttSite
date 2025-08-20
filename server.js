const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve React build
app.use(express.static(path.join(__dirname, 'build')));

// Redirect all unknown routes to index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// SSL setup
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.crt'),
};

https.createServer(options, app).listen(5100, () => {
  console.log('Running on https://192.168.168.19:5100');
});
