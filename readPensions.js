const { MongoClient } = require('mongodb');


async function main() {
   const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
    
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        await getPensions(client);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

async function getPensions(client) {
    const results = await client.db("pensions").collection("pensionDetails")
    .find({})
    .toArray()

    // Store the results in an array
    console.log('results ' + JSON.stringify(results))
//    req.app.locals.pensionDetails = results


}

async function createPension(client, newListing){
    const result = await client.db("pensions").collection("pensionDetails").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}


