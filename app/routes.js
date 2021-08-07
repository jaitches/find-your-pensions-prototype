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
    // store pension providers
    let pensionProviders = []
    async function storePensionProviders() {        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            pensionProviders = await storeProviders(client)
            console.log('pensionProviders ' + req.app.locals.pensionProviders)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
        }
    }

    storePensionProviders().catch(console.error);

    async function storeProviders(client) {
        const results = await client.db("pensions").collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

//        console.log('results providers' + JSON.stringify(results))
        return results
    }
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

        for (i=0; i < results.length; i++) {
            for (j=0; j < pensionProviders.length; j++) {
                if (results[i].administratorReference == pensionProviders[j]._id) {
                    results.push({"administratorName" : pensionProviders.administratorName})
                }
            }
        }
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

//        console.log('results providers' + JSON.stringify(results))
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

    let pension_Owner = req.session.data['pensionOwner']
    let pension_Reference = req.session.data['pensionReference']
    let pension_Name = req.session.data['pensionName']
    let pension_Type = req.session.data['pensionType']
    let pension_Origin = req.session.data['pensionOrigin']
    let pension_Status = req.session.data['pensionStatus']

    let pension_Start_Date = req.session.data['pensionStartDate-day'] + '/' + req.session.data['pensionStartDate-month'] + '/' + req.session.data['pensionStartDate-year']
    let pension_Retirement_Date = req.session.data['pensionRetirementDate-day'] + '/' + req.session.data['pensionRetirementDate-month'] + '/' + req.session.data['pensionRetirementDate-year']

    let pension_Link = req.session.data['pensionLink']
    let administrator_Reference = req.session.data['administratorReference']
    let administrator_Name = req.session.data['administratorName']
    let employer_Name = req.session.data['employerName']

    let employer_Start_Date = req.session.data['employerStartDate-day'] + '/' + req.session.data['employerStartDate-month'] + '/' + req.session.data['employerStartDate-year']
    let employer_End_Date = req.session.data['employerEndDate-day'] + '/' + req.session.data['employerEndDate-month'] + '/' + req.session.data['employerEndDate-year']

    let ERI_Type = req.session.data['ERIType']
    let ERI_Basis = req.session.data['ERIBasis']
    
    let ERI_Calculation_Date = req.session.data['ERICalculationDate-day'] + '/' + req.session.data['ERICalculationDate-month'] + '/' + req.session.data['ERICalculationDate-year']
    let ERI_Payable_Date = req.session.data['ERIPayableDate-day'] + '/' + req.session.data['ERIPayableDate-month'] + '/' + req.session.data['ERIPayableDate-year']

    let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
    let ERI_Pot = req.session.data['ERIPot']
    let ERI_Safeguarded_Benefits = req.session.data['ERISafeguardedBenefits']
    let ERI_Unavailable = req.session.data['ERIUnavailable']
    let accrued_Type = req.session.data['accruedType']
    let accrued_Amount_Type = req.session.data['accruedAmountType']

    let accrued_Calculation_Date = req.session.data['accruedCalculationDate-day'] + ' ' + req.session.data['accruedCalculationDate-month'] + '/' + req.session.data['accruedCalculationDate-year']
    let accrued_Payable_Date = req.session.data['accruedPayableDate-day'] + '/' + req.session.data['accruedPayableDate-month'] + '/' + req.session.data['accruedPayableDate-year']

    let accrued_Amount = req.session.data['accruedAmount']
    let accrued_Safeguarded_Benefits = req.session.data['accruedSafeguardedBenefits']
    let accrued_Unavailable = req.session.data['accruedUnavailable']
        
    console.log('pension_Owner' + JSON.stringify(pension_Owner))
    console.log('req.session.data' + JSON.stringify(req.session.data))
    console.log('req.session.data date' + JSON.stringify(req.session.data['pensionStartDate']))

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addPension() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {

                pensionOwner : pension_Owner,
                pensionReference : pension_Reference,
                pensionName : pension_Name,
                pensionType : pension_Type,
                pensionOrigin : pension_Origin,
                pensionStatus : pension_Status,
                pensionStartDate : pension_Start_Date,
                pensionRetirementDate : pension_Retirement_Date,
                pensionLink : pension_Link,
                administratorReference : administrator_Reference,
                administratorName : administrator_Name,
                employerName : employer_Name,
                employerStartDate : employer_Start_Date,
                employerEndDate : employer_End_Date,
                ERIType : ERI_Type,
                ERIBasis : ERI_Basis,
                ERICalculationDate : ERI_Calculation_Date,
                ERIPayableDate : ERI_Payable_Date,
                ERIAnnualAmount : ERI_Annual_Amount,
                ERIPot : ERI_Pot,
                ERISafeguardedBenefits : ERI_Safeguarded_Benefits,
                ERIUnavailable : ERI_Unavailable,
                accruedType : accrued_Type,
                accruedAmountType : accrued_Amount_Type,
                accruedCalculationDate : accrued_Calculation_Date,
                accruedPayableDate : accrued_Payable_Date,
                accruedAmount : accrued_Amount,
                accruedSafeguardedBenefits : accrued_Safeguarded_Benefits,
                accruedUnavailable : accrued_Unavailable,
                dateAdded: todayDateTime

            })
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
        console.log(`New listing created with the following id: ${result.insertedId}`)
    } 

})

router.post('/edit-pension', function (req, res) {
	let editPensionArray =[]

})
router.post('/delete-pension', function (req, res) {

})
module.exports = router
