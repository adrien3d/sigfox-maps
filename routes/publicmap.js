
const express = require('express');
const router = express.Router();
const config = require('../config');
const http = config.https ? require('https') : require('http');
const fs = require('fs');
const _ = require('lodash');

const tokenPublicRetrieval = {
    hostname: config.sigfoxApiSite,
    path: config.publicMapPath,
    auth: config.sigfoxApiUser + ":" + config.sigfoxApiPassword,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
};

const tokenMonarchRetrieval = {
    hostname: config.sigfoxApiSite,
    path: config.monarchMapPath,
    auth: config.sigfoxApiUser + ":" + config.sigfoxApiPassword,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
};

const filtered = ["AND", "ARE", "ARG", "AUS", "AUT", "BEL", "BRA", "CAN", "CHE", "CHL", "COL", "CRI", "CZE", "DEU", "DNK", "ECU", "ESP", "EST", "FIN", "FRA", "GBR", "GTM", "HKG", "HND", "HRV", "HUN", "IRL", "IRN", "ITA", "JPN", "KEN", "KOR", "LIE", "LUX", "MEX", "MLT", "MUS", "MYS", "NCL", "NLD", "NOR", "NZL", "OMN", "PAN", "PER", "PRI", "PRT", "PYF", "ROU", "SGP", "SLV", "SVK", "SWE", "THA", "TUN", "TWN", "URY", "USA", "ZAF"];
//const filtered = [];
const geoJsonParsed = JSON.parse(fs.readFileSync('assets/WorldCountries.geojson'));
const countriesToDisplay = _.filter(geoJsonParsed.features, feature => _.find(filtered, e => e === feature.properties.ISO_A3) !== undefined);

// from https://snazzymaps.com/style/151/ultra-light-with-labels
const googleStyle = JSON.parse(fs.readFileSync('assets/google-light-style.json'));

router.get('/', function(req, res, next) {
    // Get the public map
    http.get(tokenPublicRetrieval, (sigfoxResponse) => {
        let buff = "";
        sigfoxResponse.on('data', d => buff += d);
        sigfoxResponse.on('end', () => {
            if (sigfoxResponse.statusCode !== 200) {
                res.render('error', {
                    message: 'Impossible to load Public layer',
                    error: {
                        status: sigfoxResponse.statusCode,
                        stack: sigfoxResponse.statusMessage,
                    }
                });
            } else {
                const publicMapUrl = JSON.parse(buff).tmsTemplateUrl ;
                // Get the monarch map
                http.get(tokenMonarchRetrieval, (sigfoxResponse) => {
                    let buff = "";
                    sigfoxResponse.on('data', d => buff += d);
                    sigfoxResponse.on('end', () => {
                        if (sigfoxResponse.statusCode !== 200) {
                        } else {
                            const monarchMapUrl = JSON.parse(buff).tmsTemplateUrl ;
                            res.render('publicmap', {
                                title: 'Sigfox public map',
                                sigfoxMapUrl: publicMapUrl,
                                sigfoxMonarchMapUrl: monarchMapUrl,
                                countries: JSON.stringify(countriesToDisplay),
                                backgroundMap: config.backgroundMap,
                                backgroundMapType: config.backgroundMapType,
                                googleStyle: JSON.stringify(googleStyle),
                                googleToken: config.googleToken,
                                hereAppId: config.hereAppId,
                                hereAppCode: config.hereAppCode,
                                bingKey: config.bingKey

                            });
                        }
                    });
                });
            }
        })
    });
});

router.get('/countries', (req, res) => {
    res.send(countriesToDisplay);
});

module.exports = router;
