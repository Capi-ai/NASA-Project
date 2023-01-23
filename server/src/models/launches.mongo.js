const mongoose = require('mongoose');

//mongoose.set('strictQuery', false);

const launchesSchema = new mongoose.Schema({
    flightNumber: {
        type: Number,
        required: true,
    },
    launchDate: {
        type: Date,
        required: true,
    },
    mission: {
        type: String,
        require: true,
    },
    rocket: {
        type: String,
        required: true,
    },
    target: {
        type: String,
    },
    customers: [ String ],
    upcoming: {
        type: Boolean,
        require: true,
    },
    success: {
        type: Boolean,
        require: true,
        default: true,
    },
});

// Connect lanuchesSchema w/ the
// "launches" collection
module.exports = mongoose.model('Launch', launchesSchema);