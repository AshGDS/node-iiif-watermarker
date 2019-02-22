const express = require('express');
const app = express();
const request = require('request').defaults({encoding: null});
const sharp = require('sharp');
const apicache = require('apicache');

// This will set the URL of your IIIF server to http://localhost:8182/iiif/2/
const IMAGE_API_SERVER = 'http://localhost';
const IMAGE_API_PORT = 8182;
const IMAGE_API_PREFIX = 'iiif/2';

const WATERMARKER_PORT = 4343; // Port for this server

let cache = apicache.middleware

let download = function (uri, callback) {

    request.get(uri, function (err, res, body) {
        callback(body);
    });
};

app.use(cache('60 minutes'));
app.use(function (req, res, next) {

    // Disable CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {

    res.send('Welcome to the IIIF Watermark server');
})

app.listen(WATERMARKER_PORT, (error) => {

    error ? console.log(error) : console.log('Watermark server running...');
})

app.get(`/${IMAGE_API_PREFIX}/:file/:coords/:size/:num/:type`, (req, res) => {

    let {file, coords, size, num, type} = req.params;

    download(`${IMAGE_API_SERVER}:${IMAGE_API_PORT}/${IMAGE_API_PREFIX}/${file}/${coords}/${size}/${num}/${type}`, (rawImage) => {

        let options = {tile: true};

        sharp(rawImage)
            .overlayWith('watermark.png', options)
            .toBuffer()
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                console.log(err);
            })
    })

});

app.get(`/${IMAGE_API_PREFIX}/:file/info.json`, (req, res) => {

    let {file} = req.params;
    send_IIIF_json(res, file);
});

app.get(`/${IMAGE_API_PREFIX}/:file`, (req, res) => {

    let {file} = req.params;
    send_IIIF_json(res, file);
});

let send_IIIF_json = (res, file) => {

    download(`${IMAGE_API_SERVER}:${IMAGE_API_PORT}/${IMAGE_API_PREFIX}/${file}/info.json`, (json) => {
        let encoded_json = JSON.parse(json);

        // Changes info.json to point to this servers mock IIIF Image server port
        encoded_json['@id'] = encoded_json['@id'].replace(`:${IMAGE_API_PORT}/`,`:${WATERMARKER_PORT}/`)

        res.send(encoded_json);
    })
}


