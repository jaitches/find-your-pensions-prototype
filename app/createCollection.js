const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uri = 'mongodb+srv://' + process.env.MONGODB_URI + '?retryWrites=true&w=majority'
const dataBaseName = process.env.PENSIONS_DB

const client = new MongoClient(uri)
try {
    // Connect to the MongoDB cluster
    await client.connect()

	db.createCollection("pensionDetails", {
	   validator: {
	      $jsonSchema: {
	         bsonType: "object",
	         required: [ "name", "year", "major", "address" ],
	         properties: {