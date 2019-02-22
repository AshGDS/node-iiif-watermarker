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

let cache = apicache.middleware;

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

app.get(`/${IMAGE_API_PREFIX}/:identifier/:region/:size/:rotation/:quality`, (req, res) => {

    let {identifier, region, size, rotation, quality} = req.params;

    download(`${IMAGE_API_SERVER}:${IMAGE_API_PORT}/${IMAGE_API_PREFIX}/${identifier}/${region}/${size}/${rotation}/${quality}`, (rawImage) => {

        let options = {tile: true};

        sharp(rawImage)
            .overlayWith('tna-watermark.png', options)
            .toBuffer()
            .then(watermarkedImage => {
                res.send(watermarkedImage);
            })
            .catch(err => {
                console.log(err, ' attempting to show unwatermarked image for', identifier);
                res.send(rawImage);
            })
    })

});

app.get(`/${IMAGE_API_PREFIX}/:identifier/info.json`, (req, res) => {

    let {identifier} = req.params;
    sendIIIFjson(res, identifier);
});

app.get(`/${IMAGE_API_PREFIX}/:identifier`, (req, res) => {

    let {identifier} = req.params;
    sendIIIFjson(res, identifier);
});

let download = function (uri, callback) {

    request.get(uri, function (err, res, body) {
        callback(body);
    });
};

let sendIIIFjson = (res, identifier) => {

    download(`${IMAGE_API_SERVER}:${IMAGE_API_PORT}/${IMAGE_API_PREFIX}/${identifier}/info.json`, (json) => {
        let encoded_json = JSON.parse(json);

        // Changes info.json to point to this servers mock IIIF Image server port
        encoded_json['@id'] = encoded_json['@id'].replace(`:${IMAGE_API_PORT}/`,`:${WATERMARKER_PORT}/`)

        res.send(encoded_json);
    })
}


