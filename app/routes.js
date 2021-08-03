const express = require('express')
const router = express.Router()
const fs = require('fs')

const pensionList = require('./pensionList.json')
// Add your routes here - above the module.exports line
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";

router.post('/index-figures', function (req, res) {
// store the type of display to use
    let displayOption = req.session.data['display-figures']
    req.app.locals.displayFigures = req.session.data['display-figures']
    if ( displayOption == "enter-figures") {
        res.redirect('/manage-pensions')
    }
    else {
        res.render('index')
    }
})

router.get('/display-pensions', function (req, res) {
// connect to MongoDB to add the doc (record) to the collection (table)
    async function listPensions() {
    // create an instance of the client
        const client = new MongoClient(uri)
            try {
                // Connect to the MongoDB cluster
                await client.connect()

                await getPensions(client)
            }
            catch (error) {
                console.error(error)
            }
            finally {
                // Close the connection to the MongoDB cluster
 //               await client.close()
            }
    }
    async function getPensions(client) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#findOne for the findOne() docs
//        try {
        const results = await client.db("pensions").collection("pensionDetails")
        .find({})
        .toArray(function(err, pensionArray) {
            if (err) throw err;
            console.log(pensionArray)
            req.app.locals.pensionDetails = pensionArray
        })
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

    }
    listPensions().catch(console.error);

    res.render('display-pensions')
})

router.get('/manage-pensions', function (req, res) {
	let pensionArray = []
	console.log('pensionList.pensions.length ' + pensionList.pensions.length)
	for (let i=0; i < pensionList.pensions.length; i++) {
        pension = pensionList.pensions[i]
        pensionArray.push(pension) 
	}
	req.app.locals.pensionDetails = pensionArray

  res.render('manage-pensions')
})

router.post('/add-pension', function (req, res) {
// get the inputted pension data 
    let addPensionOwner = req.session.data['pension-owner']
    let addPensionName = req.session.data['pension-name']
    let addAdministratorName = req.session.data['pension-provider']
    let addERICalculationDate = req.session.data['date-calculated']
    let addERIPayableDate = req.session.data['date-payable']
    let addERIAnnualAmount = req.session.data['annual-eri']
    let addERIPot = req.session.data['pension-value']
// create a doc to add to the DB

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addPension() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {
                pensionName : addPensionName,
                administratorName : addAdministratorName,
                ERICalculationDate : addERICalculationDate,
                ERIPayableDate : addERICalculationDate,
                ERIAnnualAmount : Number(addERIAnnualAmount),
                ERIPot: Number(addERIPot)

            });
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();
        }
    }

    addPension().catch(console.error);

    // Add functions that make DB calls here
    async function createPension(client, newListing){
        const result = await client.db("pensions").collection("pensionDetails").insertOne(newListing);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    }


    res.render('manage-pensions')


})
router.post('/edit-pension', function (req, res) {
	let editPensionArray =[]

})
router.post('/delete-pension', function (req, res) {

})
module.exports = router
