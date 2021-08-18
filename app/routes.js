const express = require('express')
const router = express.Router()
const fs = require('fs')

const pensionList = require('./pensionList.json')
// Add your routes here - above the module.exports line
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
// Use these arrays to store the options for the select element when updating the pensions
const penTypes = [
    {type: "DC", text: "DC pension", selected : ""},
    {type: "DB", text: "DB pension", selected : ""},
    {type: "ST", text: "State pension", selected : ""},
    {type: "AVC", text: "AVC pension", selected : ""},
    {type: "HYB", text: "Hybrid pension", selected : ""}
]
const penOrigin = [
    {type: "W", text: "Workplace", selected : ""},
    {type: "P", text: "Private", selected : ""},
    {type: "S", text: "State", selected : ""}
]
const penStatus = [
    {type: "A", text: "Active", selected : ""},
    {type: "I", text: "Inactive", selected : ""}
]
const penAccAmtType = [
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},
    {type: "INC", text: "Calculation of an accrued recurring income", selected : ""},
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]
//
// ****** routes for main pages and prototypes
//

// choose to manage data or display prototypes
router.post('/display-or-manage-data', function (req, res) {
    const whatToDo = req.session.data['what-do-you-want-to-do']
    if (whatToDo == "prototype") {
        res.redirect('select-prototype')
    }
    else {
        res.redirect('manage-pensions')
    }
})

// choose which prototype to display
router.post('/select-prototype', function (req, res) {
    const selectPrototype = req.session.data['select-prototype']

    if (selectPrototype == "prototype-find") {
        res.redirect('01-find/01-enter-your-name')
    }
    else if (selectPrototype == "prototype-find-accrued") {
        res.redirect('02-find-accrued/02-enter-your-name')
    }    
    else {
        res.redirect('03-find-accrued-estimated/03-enter-your-name')
    }
})
// The user enters their name to use when selecting the documents from MongoDB
// the researcher will already have created their records
router.post('/enter-your-name/:prototypeId', function (req, res) {

    pensionOwner = req.session.data['owner-name']
    if (req.params.prototypeId == "01") {
        res.redirect('/01-find/01-display-pensions?owner=' + pensionOwner)
    }
    else if (req.params.prototypeId == "02") {
        res.redirect('/02-find-accrued/02-display-pensions')
    }
    else {
        res.redirect('/03-find-accrued-estimated/03-display-pension')
    }
})

//
// 01 Find pension prototype
//
router.get('/01-find/01-display-pensions', function (req, res) {

    async function findPensionsByOwner() {
        let pensionOwnerName = req.query.owner

        const client = new MongoClient(uri)

        try {
            // Connect to the MongoDB cluster
            await client.connect()
            req.app.locals.pensionDetails = await getPensionsByOwner(client, pensionOwnerName)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('01-find/01-display-pensions')
        }
    }

    findPensionByOwner().catch(console.error)

    async function getPensionsByOwner(client, pensionOwnerName) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({pensionOwner : pensionOwnerName})
        // save them to an array
        .sort({pensionOwner: 1, accruedType: 1})        
        .toArray()
//        console.log('results ' + JSON.stringify(results))
        return results
    }
})

// 01 additional page of pension details 
router.get('/01-find/01-pension-details', function (req, res) {

    async function findPensionDetails() {
        req.app.locals.pensionDetails = []
        req.app.locals.pensionProvider = []

        let pensionId = req.query.pensionId
        let providerId = req.query.providerId
        // let pensionOwnerName = req.app.locals.pensionOwner

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionDetails = await getPensionById(client, pensionId)
            req.app.locals.pensionProvider = await getProviderById(client, providerId)
 //           console.log('req.app.locals.pensionProvider.administratorURL ' + req.app.locals.pensionProvider.administratorURL)
            
            req.app.locals.pensionProvider.administratorHTTPURL = 'http://' + req.app.locals.pensionProvider.administratorURL
            req.app.locals.pensionProvider.administratorAnnualReportHTTPURL = 'http://' + req.app.locals.pensionProvider.administratorAnnualReportURL
            req.app.locals.pensionProvider.administratorCostsChargesHTTPURL = 'http://' + req.app.locals.pensionProvider.administratorCostsChargesURL
            req.app.locals.pensionProvider.administratorImplementationHTTPURL = 'http://' + req.app.locals.pensionProvider.administratorImplementationURL
            req.app.locals.pensionProvider.administratorHTTPSIPURL = 'http://' + req.app.locals.pensionProvider.administratorSIPURL
//            console.log('req.app.locals.pensionProvider.administratorHTTPURL ' +req.app.locals.pensionProvider.administratorHTTPURL)

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('01-find/01-pension-details')
        }
    }

    findPensionDetails().catch(console.error)

    // get the pension details
    async function getPensionById(client, pensionId) {
        const results = await client.db("pensions").collection("pensionDetails")
        .findOne({ _id : ObjectId(pensionId)})
//        console.log('results getPensionById' + JSON.stringify(results))
        return results
    }
    // get the provider details
    async function getProviderById(client, providerId) {
        const results = await client.db("pensions").collection("pensionProvider")
        // find all documents
        .findOne({ _id : ObjectId(providerId)})
        console.log('results providers' + JSON.stringify(results))
        return results
    }
})

// choose what data to add or update
router.post('/manage-pensions', function (req, res) {
    const whatDataToManage = req.session.data['what-do-you-want-to-manage']
    console.log('whatDataToManage ' + whatDataToManage )
    if (whatDataToManage == "add-pension") {
        res.redirect('add-pension')
    }
    else if (whatDataToManage == "display-pensions") {
        res.redirect('display-pensions')
    }    
    else if (whatDataToManage == "add-provider") {
        res.redirect('add-provider')
    }
    else {
        res.redirect('display-providers')
    }
})


// index page - get the list of pension owners to select for the display

router.get('/choose-owner', function (req, res) {
// return a list of distict owners from the pensions collection to display for selection
    async function findPensionOwners() {
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionOwners = await getOwners(client)
            console.log('req.app.locals.pensionOwners ' + JSON.stringify(results))

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('index')
        }
    }

    findPensionOwners().catch(console.error)

    async function getOwners(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .distinct("pensionOwner")
        return results
    }

})


//
// ****** routes for maintaining pensions and providers
//

// Display manually added pensions
router.get('/display-pensions', function (req, res) {
// connect to MongoDB to add the doc (record) to the collection (table)
    async function findAllPensions() {

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionDetails = await getAllPensions(client);
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('display-pensions')
        }
    }

    findAllPensions().catch(console.error);

    async function getAllPensions(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({ pensionOwnerType: "M" })
        // save them to an array
        .sort({pensionOwner: 1, accruedType: 1})        
        .toArray()
        return results
    }
})

router.get('/add-pension', function (req, res) {
    // load pension providers into local var to select on form
    req.app.locals.pensionProviders = []
    async function findPensionProviders() {        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
//            console.log('pensionProviders ' + req.app.locals.pensionProviders)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('add-pension')
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
    req.app.locals.pensionAddedMessage = ""

// format date
    let today_timestamp = new Date().toLocaleString()
    // get the inputted pension data 

    let pension_Start_Date = new Date()
    let pension_Retirement_Date = new Date()
    let employment_Start_Date = new Date()
    let employment_End_Date = new Date()
    let ERI_Calculation_Date = new Date()
    let ERI_Payable_Date = new Date()
    let accrued_Payable_Date = new Date()
//set type to manual added - M (not default - D)
    let pension_Owner_Type = "M"
    let pension_Owner = req.session.data['pensionOwner']
    let pension_Reference = req.session.data['pensionReference']
    let pension_Name = req.session.data['pensionName']
    let pension_Type = req.session.data['pensionType']
    let pension_Origin = req.session.data['pensionOrigin']
    let pension_Status = req.session.data['pensionStatus']
    pension_Start_Date = req.session.data['pensionStartDate']
    pension_Retirement_Date = req.session.data['pensionRetirementDate']
    let pension_Link = ""

// the administratorDetails passed from the form includes the administrator _id and the name
    let administrator = req.session.data['administratorDetails']
    let administratorArray = administrator.split(":")
    let administrator_Reference = administratorArray [0]
    let administrator_Name = administratorArray [1]

    let employer_Name = req.session.data['employerName']
    employment_Start_Date = req.session.data['employmentStartDate']
    employment_End_Date = req.session.data['employmentEndDate']
//    let ERI_Type = req.session.data['ERIType']
    let ERI_Type = pension_Type
    let ERI_Basis = "SMPI"
    ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
    ERI_Payable_Date = pension_Retirement_Date
    let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
    let ERI_Pot = req.session.data['ERIPot']
    let ERI_Safeguarded_Benefits = 0
    let ERI_Unavailable = null
    
    let accrued_Type = pension_Type
    let accrued_Amount_Type = req.session.data['accruedAmountType']
    accrued_Calculation_Date = req.session.data['accruedCalculationDate'] 
    accrued_Payable_Date = pension_Retirement_Date
    let accrued_Amount = req.session.data['accruedAmount']
    let accrued_Safeguarded_Benefits = 0
    let accrued_Unavailable = null

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addPension() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {

                pensionOwnerType : pension_Owner_Type,
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
                employmentStartDate : employment_Start_Date,
                employmentEndDate : employment_End_Date,
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
                timeStamp: today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            req.app.locals.pensionAddedMessage = "Pension added successfully"
            res.redirect('add-pension')
        }
    }

    addPension().catch(console.error);

    // Add functions that make DB calls here
    async function createPension(client, newPension){
        const result = await client.db("pensions").collection("pensionDetails").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`)
    } 

})

router.get('/update-pension', function (req, res) {
    // find the pension providers for the select options
    async function findAndDisplayPension() { 
        let pensionId = req.query.pensionId
        req.app.locals.pensionProviders = []
        req.app.locals.pensionDetail = []
        req.app.locals.pensionId = req.query.pensionId
//        console.log('req.app.locals.pensionId ' + req.app.locals.pensionId)

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
            req.app.locals.pensionDetails = await getPensionById(client, pensionId)

// *** for the HTML select set the selected option to the value in document in MongoDB 

            // Pension type set the selected option

            req.app.locals.pensionDetails.pensionTypeArr = penTypes
            for (i=0; i < req.app.locals.pensionDetails.pensionTypeArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionType == req.app.locals.pensionDetails.pensionTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionTypeArr[i].selected = 'selected'   
                }
            }

            // Pension origin set the selected option
            req.app.locals.pensionDetails.pensionOriginArr = penOrigin
//            console.log('pensionOriginArr ' + JSON.stringify(req.app.locals.pensionDetails.pensionOriginArr))
            for (i=0; i < req.app.locals.pensionDetails.pensionOriginArr.length; i++) {
//                console.log('origin on DB ' + req.app.locals.pensionDetails.pensionOrigin)
//                console.log('origin in array ' + req.app.locals.pensionDetails.pensionOriginArr[i].type)

                if (req.app.locals.pensionDetails.pensionOrigin == req.app.locals.pensionDetails.pensionOriginArr[i].type) {
                 req.app.locals.pensionDetails.pensionOriginArr[i].selected = 'selected'   
                }
            }

            // Pension origin set the selected option
            req.app.locals.pensionDetails.pensionStatusArr = penStatus
            for (i=0; i < req.app.locals.pensionDetails.pensionStatusArr.length; i++) {
//                console.log('status on DB ' + req.app.locals.pensionDetails.pensionStatus)
//                console.log('status in array ' + req.app.locals.pensionDetails.pensionStatusArr[i].type)

                if (req.app.locals.pensionDetails.pensionStatus == req.app.locals.pensionDetails.pensionStatusArr[i].type) {
                 req.app.locals.pensionDetails.pensionStatusArr[i].selected = 'selected'   
                }
            }
 //           console.log('pensionStatusArr ' + JSON.stringify(req.app.locals.pensionDetails.pensionStatusArr))
            
            // Pension accrued amount type set the selected option
            req.app.locals.pensionDetails.pensionAccruedAmtTypeArr = penAccAmtType
            for (i=0; i < req.app.locals.pensionDetails.pensionAccruedAmtTypeArr.length; i++) {

                if (req.app.locals.pensionDetails.accruedAmountType == req.app.locals.pensionDetails.pensionAccruedAmtTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionAccruedAmtTypeArr[i].selected = 'selected'   
                }
            }

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close() 
            res.render('update-pension')
        }
    }

    findAndDisplayPension().catch(console.error);

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

    async function getPensionById(client, pensionId) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .findOne({_id: ObjectId(pensionId)})

//        console.log('results ' + JSON.stringify(results))
//        console.log('req.app.locals.pensionProviders.length ' + req.app.locals.pensionProviders.length)

        for (i=0; i < req.app.locals.pensionProviders.length; i++) {
//            console.log('req.app.locals.pensionProviders[i].administratorName ' + req.app.locals.pensionProviders[i].administratorName)
//            console.log('results.administratorName ' + results.administratorName)
        // where the select option is used to display fields, find the correct option from the mongo document and mark it as the selected option
            // mark the administrator name as selected 
            if (results.administratorName == req.app.locals.pensionProviders[i].administratorName) {
//                console.log('selected ' + results.administratorName)
                req.app.locals.pensionProviders[i].selected = 'selected'
            }
            else {
                req.app.locals.pensionProviders[i].selected = ""
            }
        
        }
        return results
    }


})

router.post('/update-pension-details', function (req, res) {    

    async function updatePension() {
    // create an instance of the client
        const client = new MongoClient(uri);        

        req.app.locals.pensionUpdatedMessage = ""
//        console.log('req.app.locals.pensionId ' + req.app.locals.pensionId)
        let pensionId = req.app.locals.pensionId
       
        // format date
        let today_timestamp = new Date().toLocaleString()

        // make the date variables have a date format
        let pension_Start_Date = new Date()
        let pension_Retirement_Date = new Date()
        let employement_Start_Date = new Date()
        let employment_End_Date = new Date()
        let ERI_Calculation_Date = new Date()
        let ERI_Payable_Date = new Date()
        let accrued_Payable_Date = new Date()

        // get the inputted pension data 

        let pension_Owner_Type = "M"
        let pension_Owner = req.session.data['pensionOwner']
        let pension_Reference = req.session.data['pensionReference']
        let pension_Name = req.session.data['pensionName']
        let pension_Type = req.session.data['pensionType']
        let pension_Origin = req.session.data['pensionOrigin']
        let pension_Status = req.session.data['pensionStatus']

        if (req.session.data['pensionStartDate']) {
            pension_Start_Date = req.session.data['pensionStartDate']
        }
        else {
            pension_Start_Date = ""
        }
        if (req.session.data['pensionRetirementDate']) {
            pension_Retirement_Date = req.session.data['pensionRetirementDate']
        }
        else {
            pension_Retirement_Date = ""
        }
        let pension_Link = req.session.data['pensionLink']

        let administrator = req.session.data['administratorDetails']
        let administratorArray = administrator.split(":")
        let administrator_Reference = administratorArray [0]
        let administrator_Name = administratorArray [1]

        let employer_Name = req.session.data['employerName']   
        if (req.session.data['employmentStartDate']) {
            let employment_Start_Date = req.session.data['employmentStartDate']
        }
        else {
            employment_Start_Date = null
        }

        if (req.session.data['employmentEndDate']) {
            employment_End_Date = req.session.data['employmentEndDate']
        }
        else {
            employment_End_Date = null
        }

        let ERI_Type = pension_Type
        let ERI_Basis = "SMPI"
        
        if (req.session.data['ERICalculationDate']) {
            ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
        }
        else {
            ERI_Calculation_Date = null
        }
        ERI_Payable_Date = pension_Retirement_Date
        let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
        let ERI_Pot = req.session.data['ERIPot']
        let ERI_Safeguarded_Benefits = 0
        let ERI_Unavailable = null

        let accrued_Type = pension_Type
        let accrued_Amount_Type = req.session.data['accruedAmountType']

        if (req.session.data['accruedCalculationDate']) {
            accrued_Calculation_Date = req.session.data['accruedCalculationDate'] 
        }
        else {
            accrued_Calculation_Date = null
        }
        accrued_Payable_Date = pension_Retirement_Date
        let accrued_Amount = req.session.data['accruedAmount']
        let accrued_Safeguarded_Benefits = 0
        let accrued_Unavailable = null

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            console.log('pension_Owner' + pension_Owner)


            await updatePensionDetails(client, pensionId, {

                pensionOwnerType : pension_Owner_Type,
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
                employmentStartDate : employment_Start_Date,
                employmentEndDate : employment_End_Date,
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
                timeStamp : today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            req.app.locals.pensionUpdatedMessage = "Pension updated successfully"

            res.redirect('display-pensions')
        }
    }

    updatePension().catch(console.error);

    // Add functions that make DB calls here
    async function updatePensionDetails(client, pensionId, updatePension){
//        console.log('updatePension ' + JSON.stringify(updatePension))
//        console.log('pensionId ' + pensionId)
        const result = await client.db("pensions").collection("pensionDetails")
            .updateOne({ _id : ObjectId(pensionId)}, {$set: updatePension});
        console.log(`${result.modifiedCount} document was updated.`)
    }

})
// Display manually added pensions
router.get('/display-providers', function (req, res) {
// connect to MongoDB to add the doc (record) to the collection (table)
    async function findAllProviders() {

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.providersDetails = await getAllProviders(client);
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('display-providers')
        }
    }

    findAllProviders().catch(console.error);

    async function getAllProviders(client) {
        const results = await client.db("pensions").collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

        return results
    }
})

// 
router.get('/add-provider', function (req, res) {
    async function findPensionProviders() {        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.providerDetails = await getProviders(client)
//            console.log('pensionProviders ' + req.app.locals.pensionProviders)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('add-provider')
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

router.post('/add-provider-details', function (req, res) {
//get the pension provider list

// format date
    let todayTimeStamp = new Date().toLocaleString()

    let administrator_Name = req.session.data['administrator-name']
    let administrator_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Email = "info@" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Phone_Number = "01" + Math.floor(Math.random() * 1000).toString().substring(1,3) + " 020500"
    let administrator_Annual_Report_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + "/annual-report.co.uk"
    let administrator_Costs_Charges_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + "/costs-and-charges.co.uk"
    let administrator_Implementation_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + "/implementation-statement.co.uk"
    let administrator_SIP_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + "/statement-of-investment.co.uk"

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addProvider() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createProvider(client, {

                administratorName : administrator_Name,
                administratorContactPreference : "Email",
                administratorURL : administrator_URL,
                administratorEmail : administrator_Email,
                administratorPhoneNumber : administrator_Phone_Number,
                administratorPhoneNumberType: "Enquiries",
                admisistratorPostalName : administrator_Name,
                administratorAddressLine1 : "Floor 21",        
                administratorAddressLine2 : "Palmerston Tower",
                administratorAddressLine3 : "High Street",
                administratorAddressLine4 : "Avontown", 
                administratorAddressLine5 : "",
                administratorPostcode : "AV7 5DS",
                administratorAnnualReportURL : administrator_Annual_Report_URL,
                administratorCostsChargesURL : administrator_Costs_Charges_URL,
                administratorImplementationURL : administrator_Implementation_URL,
                administratorSIPURL : administrator_SIP_URL,
                timeStamp: today_timestamp

            });
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.render('add-provider')
        }
    }

    addProvider().catch(console.error);

    // Add functions that make DB calls here
    async function createProvider(client, newPension){
        const result = await client.db("pensions").collection("pensionProvider").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`);
    } 

})

router.get('/update-provider', function (req, res) {
    // find the pension providers for the select options
    async function findAndDisplayProviders() { 
        let providerId = req.query.providerId
        req.app.locals.providerDetail = []
        req.app.locals.providerId = req.query.providerId
        console.log('req.app.locals.providerId ' + req.app.locals.providerId)

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProvider = await getProvider(client, providerId)

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close() 
            res.render('update-provider')
        }
    }

    findAndDisplayProviders().catch(console.error);

    async function getProvider(client, providerId) {
        const results = await client.db("pensions").collection("pensionProvider")
        // find all documents
       .findOne({_id: ObjectId(providerId)})
        return results
    }

})

router.post('/update-provider-details', function (req, res) {    

    req.app.locals.providerUpdatedMessage = ""
    let providerId = req.app.locals.providerId
    
    // format date
    let today_timestamp = new Date().toLocaleString();

    let administrator_Name = req.session.data['administratorName']
    let administrator_Contact_Preference = req.session.data['administratorContactPreference']
    let administrator_URL = req.session.data['administratorURL']
    let administrator_Email = req.session.data['administratorEmail']
    let administrator_Phone_Number = req.session.data['administratorPhoneNumber']
    let administrator_Phone_Number_Type = req.session.data['administratorPhoneNumberType']
    let administrator_Address_Line_1 = req.session.data['administratorAddressLine1']
    let administrator_Address_Line_2 = req.session.data['administratorAddressLine2']
    let administrator_Address_Line_3 = req.session.data['administratorAddressLine3']
    let administrator_Address_Line_4 = req.session.data['administratorAddressLine4']
    let administrator_Address_Line_5 = req.session.data['administratorAddressLine5']
    let administrator_Postcode = req.session.data['administrator_Postcode']
    let administrator_Annual_Report_URL = req.session.data['administratorAnnualReportURL']
    let administrator_Costs_Charges_URL = req.session.data['administrator_Costs_Charges_URL']
    let administrator_Implementation_URL = req.session.data['administratorImplementationURL']
    let administrator_SIP_URL = req.session.data['administratorSIPURL']

    async function updateProvider() {

        const client = new MongoClient(uri)
        try {
            await client.connect()

            await updateProviderDetails(client, providerId, {

                administratorName : administrator_Name,
                administratorContactPreference : administrator_Contact_Preference,
                administratorURL : administrator_URL,
                administratorEmail : administrator_Email,
                administratorPhoneNumber : administrator_Phone_Number,
                administratorPhoneNumberType: administrator_Phone_Number_Type,
                admisistratorPostalName : administrator_Name,
                administratorAddressLine1 : administrator_Address_Line_1,        
                administratorAddressLine2 : administrator_Address_Line_2,
                administratorAddressLine3 : administrator_Address_Line_3,
                administratorAddressLine4 : administrator_Address_Line_4, 
                administratorAddressLine5 : administrator_Address_Line_5,
                administratorPostcode : administrator_Postcode,
                administratorAnnualReportURL : administrator_Annual_Report_URL,
                administratorCostsChargesURL : administrator_Costs_Charges_URL,
                administratorImplementationURL : administrator_Implementation_URL,
                administratorSIPURL : administrator_SIP_URL,
                timeStamp: today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            req.app.locals.providerUpdatedMessage = "Provider updated successfully"

            res.redirect('display-providers')
        }
    }

    updateProvider().catch(console.error);

    async function updateProviderDetails(client, providerId, updateProvider){
        const result = await client.db("pensions").collection("pensionProvider")
            .updateOne({ _id : ObjectId(providerId)}, {$set: updateProvider})
        console.log(`${result.modifiedCount} document was updated.`)
    }

})

router.post('/delete-pension/:id', function (req, res) {
//    let pensionIdToDelete = req.params.id

    async function deletePension() {
        
        const client = new MongoClient(uri)

        try {
            // Connect to the MongoDB cluster

            await client.connect()
//            console.log('delete pension id ' + req.params.id)    
//            await printIfPensionExists(client, req.params.id)
            await deletePensionWithId(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            req.app.locals.pensionDeletedMessage = "Pension deleted successfully"
            res.redirect ('/display-pensions')   
        }
    }
    deletePension().catch(console.error)

    async function deletePensionWithId(client, pensionId) {
        console.log('passed id ' + pensionId)

        const result = await client.db("pensions").collection("pensionDetails")
            .deleteOne({_id: ObjectId(pensionId)});
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

module.exports = router
