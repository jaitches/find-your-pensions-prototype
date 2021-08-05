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
    async function findPensions() {
//       const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionDetails = await getPensions(client);
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('display-pensions')
        }
    }

    findPensions().catch(console.error);

    async function getPensions(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({})
        // save them to an array
        .sort({pensionOwner: 1, accruedType: 1})        
        .toArray()


//        console.log('results ' + JSON.stringify(results))
        return results
    }
})

router.post('/add-provider-details', function (req, res) {
//get the pension provider list

// format date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0')
    var min = String(today.getMinutes()).padStart(2, '0')

    todayDateTime = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min
    let addAdministratorName = req.session.data['administrator-name']
    let addAdministratorURL = "https://" + addAdministratorName.toLowerCase().replace(/" "/g,"") + ".co.uk"
    let addAdministratorEmail = "info@" + addAdministratorName.toLowerCase().replace(/" "/g,"") + ".co.uk"
    let addAdministratorPhoneNumber = "01" + Math.floor(Math.random() * 1000).toString().substring(1,3) + " 020500"
    let addAdministratorAnnualReportURL = "https://" + addAdministratorName.toLowerCase().replace(/" "/g,"") + "/annual-report.co.uk"
    let addAdministratorCostChargesURL = "https://" + addAdministratorName.toLowerCase().replace(/" "/g,"") + "/costs-and-charges.co.uk"
    let addAdministratorImplementationURL = "https://" + addAdministratorName.toLowerCase().replace(/" "/g,"") + "/implementation-statement.co.uk"
    let addAdministratorSIPURL = "https://" + addAdministratorName.toLowerCase().replace(/" "/g,"") + "/statement-of-investment.co.uk"

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addProvider() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {

                administratorName : addAdministratorName,
                administratorContactPreference : "email",
                administratorURL : addAdministratorURL,
                administratorEmail : addAdministratorEmail,
                administratorPhoneNumber : "Enquiries",
                administratorPhoneNumberType: "",
                admisistratorPostalName : addAdministratorName,
                administratorAddressLine1 : "Floor 21",        
                administratorAddressLine2 : "Tall Tower",
                administratorAddressLine3 : "High Street",
                administratorAddressLine4 : "Trumpton", 
                administratorAddressLine5 : "",
                administratorPostcode : "TR7 5DS",
                administratorAnnualReportURL : addAdministratorAnnualReportURL,
                administratorCostChargesURL : addAdministratorCostChargesURL,
                administratorImplementationURL : addAdministratorImplementationURL,
                administratorSIPURL : addAdministratorSIPURL,
                dateAdded: todayDateTime

            });
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect('add-providers')
        }
    }

    addProvider().catch(console.error);

    // Add functions that make DB calls here
    async function createPension(client, newListing){
        const result = await client.db("pensions").collection("pensionProvider").insertOne(newListing);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    } 

})
router.get('/add-pensions', function (req, res) {
    req.app.locals.pensionProviders = []
    async function findPensionProviders() {        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
            console.log('pensionProviders ' + req.app.locals.pensionProviders)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('add-pensions')
        }
    }

    findPensionProviders().catch(console.error);

    async function getProviders(client) {
        const results = await client.db("pensions").collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

        console.log('results ' + JSON.stringify(results))
        return results
    }

})

router.post('/add-pension-details', function (req, res) {
//get the pension provider list

// format date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0')
    var min = String(today.getMinutes()).padStart(2, '0')

    todayDateTime = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min
    // get the inputted pension data 
    let addPensionOwner = req.session.data['pension-owner']
    let addPensionName = req.session.data['pension-name']
    let addAdministratorName = req.session.data['pension-provider']
    let addERICalculationDate = req.session.data['date-calculated']
    let addERIPayableDate = req.session.data['date-payable']
    let addERIAnnualAmount = req.session.data['annual-eri']
    let addERIPot = req.session.data['pension-value']

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addPension() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {

                pensionOwner : addPensionOwner,
                pensionName : addPensionName,
                administratorName : addAdministratorName,
                ERICalculationDate : addERICalculationDate,
                ERIPayableDate : addERICalculationDate,
                ERIAnnualAmount : Number(addERIAnnualAmount),
                ERIPot: Number(addERIPot),
                dateAdded: todayDateTime

            });
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect('add-pensions')
        }
    }

    addPension().catch(console.error);

    // Add functions that make DB calls here
    async function createPension(client, newListing){
        const result = await client.db("pensions").collection("pensionDetails").insertOne(newListing);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    } 

})

router.post('/edit-pension', function (req, res) {
	let editPensionArray =[]

})
router.post('/delete-pension', function (req, res) {

})
module.exports = router
