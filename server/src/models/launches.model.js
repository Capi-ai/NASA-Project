const axios = require('axios');
//const { populate } = require('./launches.mongo');

const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULLT_FLIGHT_NUMBER=100;
const launches = new Map();

// const launch = {
//     flightNumber: 100, //flight_number
//     mission: 'Kepler Exploration X',// name
//     rocket: 'Explorer IS1', //rocket.name
//     launchDate: new Date('December 27, 2030'),// date_local
//     target: 'Kepler-442 b',// not applicable
//     customers: ['ZTM' , 'NASA'], // payload.customers for each payload
//     upcoming: true, // upcoming
//     success: true, // sucess
// };

// saveLaunch(launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL,{
        query: {},
        options: {
            pagination: false,
            populate: [{
                path: 'rocket',
                select: {
                    name: 1,
                },
            },{
                path: 'payloads',
                select: {
                    'customers': 1,
                }
            }]
        }
    });

    if (response.status !== 200) {
        console.log('Problem downloading launch data.');
        throw new Error('Launch data download fail.')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            sucess: launchDoc['sucess'],
            customers,
        }
        console.log(`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch);

    }
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });

    if (firstLaunch){
        console.log('Launch data already loaded.');
    } else {
        await populateLaunches();
    }
    
};

// let latestFlightNumber = 100;

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter)
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getAllLaunches(skip, limit) {
    return await launchesDatabase
        .find({},{'_id': 0,'__v': 0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit);
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase
        .findOne()
        .sort('-flightNumber');
        // the negative sign due to descending sort

    if (!latestLaunch) {
        return DEFAULLT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
    await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true,
    })
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error('No matching planet was found');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch,{
        success: true,
        upcoming: true,
        customers: ['Zero to Mastery','NASA'],
        flightNumber: newFlightNumber,
    });

    await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId,
    },{
        upcoming: false,
        success: false,
    });
    console.log(aborted);
    return aborted.modifiedCount === 1;
}

module.exports = {
    loadLaunchData,
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById,
}