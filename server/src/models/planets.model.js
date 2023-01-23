const fs = require("fs");
const path = require('path');
const { parse } = require('csv-parse');

const planets = require('./planets.mongo');

function isHabitablePlanet(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
        && planet['koi_insol'] > 0.36 
        && planet['koi_insol'] < 1.11
        && planet['koi_prad'] < 1.6;
}

/* 
const promise = new Promise( (resolve, reject) => {
    resolve(42) // what is passed as result
});
promise.then( (result) => {
    // Code here
});
const result = await promise;

*/ 
function loadPlanetsData() {
    // create... src
     return new Promise( (resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '..','..','data','kepler_data.csv'))
        // parse - sink
        .pipe(parse({
            comment: '#',
            columns: true, // return hash table
        }))
        .on('data', async (data) => {
            if (isHabitablePlanet(data)) {
                savePlanet(data);
            }
        })
        .on('error', (err) => {
            console.log(err);
            reject(err);
        })
        .on('end', async() => {
            const countPlanetsFound = (await getAllPlanets()).length
            console.log(`${countPlanetsFound} habitable planets found!`);
            resolve();
        });
    });

}

async function getAllPlanets() {
    return await planets.find({},{
        '_id': 0,
        '__v':0,
    }); // second argument exclude specified values.
}

async function savePlanet( planet ){
    try {
        // insert + update = upsert
        await planets.updateOne({
            keplerName: planet.kepler_name,
        }, {
            keplerName: planet.kepler_name,
        }, {upsert: true,
        });
    } catch(err) {
        console.log(`Could not save planet ${err}`);
    }
}

module.exports = {
    loadPlanetsData,
    getAllPlanets,
};