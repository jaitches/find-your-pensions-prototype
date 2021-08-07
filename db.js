const { MongoClient } = require('mongodb');

async function connect(){
    const uri = "mongodb+srv://" + process.env.MONGODB_URI + "?retryWrites=true&w=majority"
}

async function findPensions(){
    

}

function close(){
    mongodb.close();
}

module.exports = {
    connect,
    get,
    close
};