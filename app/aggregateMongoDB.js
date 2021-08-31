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

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ObjectID = require('mongodb').ObjectID,

var db = new Db('pensions', new Server('localhost', 27017));
  // Establish connection to db
  db.open(function(err, db) {
    // Some docs for insertion
    var docs = [{
        title : "this is my title", author : "bob", posted : new Date() ,
        pageViews : 5, tags : [ "fun" , "good" , "fun" ], other : { foo : 5 },
        comments : [
          { author :"joe", text : "this is cool" }, { author :"sam", text : "this is bad" }
        ]}];

    // Create a collection
    var collection = db.collection('shouldCorrectlyExecuteSimpleAggregationPipelineUsingArguments');
    // Insert the docs
    collection.insert(docs, {w: 1}, function(err, result) {
      // Execute aggregate, notice the pipeline is expressed as function call parameters
      // instead of an Array.
      collection.aggregate(
          { $project : {
            author : 1,
            tags : 1
          }},
          { $unwind : "$tags" },
          { $group : {
            _id : {tags : "$tags"},
            authors : { $addToSet : "$author" }
          }}
        , function(err, result) {
          assert.equal(null, err);
          assert.equal('good', result[0]._id.tags);
          assert.deepEqual(['bob'], result[0].authors);
          assert.equal('fun', result[1]._id.tags);
          assert.deepEqual(['bob'], result[1].authors);

          db.close();
      });
    });
  });