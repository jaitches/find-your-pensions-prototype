const { MongoClient } = require('mongodb');

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        let groupedData = await getGroupdata(client)
        console.log('groupedData ' + JSON.stringify(groupedData))

    } finally {
        await client.close();
    }
}

main().catch(console.error);

async function getGroupdata(client) {
    const results = await client.db("pensions").collection("pensionDetails")
        .aggregate([
           { }
        ])
    return results

}
