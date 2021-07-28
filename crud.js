const { MongoClient } = require('mongodb');

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const uri = "mongodb+srv://" + process.env.MONGODB_URI + "?retryWrites=true&w=majority";
    console.log("uri " + uri)
    
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
        await createPension(client, {          
            pensionName: "Home Retail Co. - 0128765",
            administratorName: "Aviva",
            ERICalculationDate: "11 Sep 2020",
            ERIPayableDate: "22 Dec 2038",
            ERIAnnualAmount: 235.42,
            ERIPot: 20346.32
        });
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Add functions that make DB calls here
async function createPension(client, newListing){
    const result = await client.db("pensions").collection("pensionDetails").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}


