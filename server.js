const http = require('http');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const EventEmitter = require('events');
const logEvents = require('./logEvents');

//define log event
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
myEmitter.on('log', (msg, fileName) => logEvents(msg, fileName));

const PORT = process.env.PORT || 3500;

//define server response
async function serverFile(filePath, contentType, response) {
    try {
        const data = await fsPromises.readFile(filePath, !contentType.includes('image') ? 'utf8' : '');
        response.writeHead(filePath.includes('404.html') ? 404 : 200, { 'Content-Type': contentType });
        response.end(data);
    } catch (err) {
        console.log(err);
        myEmitter.emit('log', `${err.name}: ${err.message}`, 'errLog.txt');
        response.statusCode = 500;
        response.end();
    }
}

//create server
const server = http.createServer((req, res) => {
    console.log(req.url, req.method);
    myEmitter.emit('log', `${req.url} ${req.method}`, 'reqLog.txt');

    const extension = path.extname(req.url);

    let contentType;

    switch(extension) {
        case '.css': 
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.txt':
            contentType = 'text/plain';
            break;
        default:
            contentType = 'text/html';
    }

    let filePath = 
        contentType === 'text/html' && req.url === '/'
            ? path.join(__dirname, 'views', 'index.html')
            : contentType === 'text/html' && req.url.slice(-1) === '/'
                ? path.join(__dirname, 'views', req.url, 'index.html')
                : contentType === 'text/html'
                    ? path.join(__dirname, 'views', req.url)
                    : path.join(__dirname, req.url);
    
    if (!extension && req.url.slice(-1) !== '/') filePath += '.html';
    
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
        serverFile(filePath, contentType, res);
    } else {
        switch(path.parse(filePath).base) {
            case 'old.html':
                res.writeHead(301, {'Location': '/new.html'});
                res.end();
                break;
            case 'www.html':
                res.writeHead(301, {'Location': '/'});
                res.end();
                break;
            default:
                serverFile(path.join(__dirname, 'views', '404.html'), 'text/html', res);
        }
    }

});

//start listening
server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
