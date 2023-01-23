const { Model } = require("mongoose");

const DEFAULT_PAGE_NUMBER=1;
const DEFAULT_PAGE_LIMIT=0; // Return all of the documents are return

function getPagination(query){
    const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER;
    const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMIT;
    const skip = (page-1)*limit;

    return {
        skip,
        limit,
    };
}

module.exports = {
    getPagination,
}