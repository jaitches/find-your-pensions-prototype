const { MongoClient } = require('mongodb');

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
    
    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
     * pass option { useUnifiedTopology: true } to the MongoClient constructor.
     * const client =  new MongoClient(uri, {useUnifiedTopology: true})
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        await getPensions(client);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Add functions that make DB calls here
async function getPensions(client) {
// See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOne for the findOne() docs
//        try {
    const results = await client.db("pensions").collection("lpensionDetails")
    .find()
    .toArray()
/* 
    if ((await cursor.count()) === 0) {
        console.log("No documents found")
    }
   }
    catch (error){
        console.log('error finding ' + error)
    }

*/
//            .sort({ last_review: -1 })
//            .limit(maximumNumberOfResults);

    // Store the results in an array
    console.log('results ' + JSON.stringify(results))
//    req.app.locals.pensionDetails = results


}

async function createPension(client, newListing){
    const result = await client.db("pensions").collection("pensionDetails").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}


