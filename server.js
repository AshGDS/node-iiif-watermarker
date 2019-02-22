const express = require('express');
const app = express();
const request = require('request');
const fs = require('fs');
const sharp = require('sharp');



// Taken from https://stackoverflow.com/questions/12740659/downloading-images-with-node-js
let download = function (uri, filename, callback) {

    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });

};

app.use(function (req, res, next) {

    // disable CORS

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('Hello');
    console.log('');
})

// Point your manifest image to this port
app.listen(4343, (error) => {
    error ? console.log(error) : console.log('server running');
})


app.get('/iiif/2/:file/:coords/:size/:num/:type', (req, res) => {

    let {file, coords, size, num, type} = req.params;

    let date = new Date();
    let random = date.getTime();


    download(`http://localhost:8182/iiif/2/${file}/${coords}/${size}/${num}/${type}`, `${random}-${file}`, () => {

        let options = {tile: true};

        sharp(`${random}-${file}`)
            .overlayWith('watermark.png', options)
            .toBuffer()
            .then(data => {
                console.log('Watermark success');
                res.send(data);
            })
            .catch(err => {
                console.log(err);
            })
    })

});


// Temporary workaround for sending info.json through this proxy

app.get('/iiif/2/:file/info.json', (req, res) => {

    let {file} = req.params;

    res.sendFile(`${__dirname}/${file}/info.json`);
});



