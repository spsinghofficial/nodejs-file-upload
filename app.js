// app.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pipeline } = require('stream');
const app = express();

const uploadDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Show the upload form
app.get('/', (req, res) => {
    res.render('index');
});

// Handle file upload
app.post('/upload', (req, res) => {
    const boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '');
    let fileName = '';
    let contentBuffer = Buffer.from([]);
    
    req.on('data', chunk => {
        contentBuffer = Buffer.concat([contentBuffer, chunk]);
    });

    req.on('end', () => {
        const parts = contentBuffer.toString().split(boundary);
        
        parts.forEach(part => {
            if (part.includes('filename=')) {
                const fileContentStart = part.indexOf('\r\n\r\n') + 4;
                const fileContentEnd = part.lastIndexOf('\r\n');
                const fileContent = part.slice(fileContentStart, fileContentEnd);
                const matches = part.match(/filename="(.+)"/);
                
                if (matches) {
                    fileName = matches[1];
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFile(filePath, fileContent, err => {
                        if (err) {
                            return res.status(500).send('File upload failed.');
                        }
                    });
                }
            }
        });
        
        res.redirect('/upload');
    });
});

// Render upload success page
app.get('/upload', (req, res) => {
    res.render('upload', { message: 'File uploaded successfully!' });
});

// Start server
const port = 3000;
http.createServer(app).listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
