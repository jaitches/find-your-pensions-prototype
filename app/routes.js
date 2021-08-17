const express = require('express')
const router = express.Router()
const fs = require('fs')

const pensionList = require('./pensionList.json')
// Add your routes here - above the module.exports line
const { MongoClient } = require('mongodb');
const {ObjectId} = require('mongodb')
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

router.post('/display-or-manage-data', function (req, res) {
    const whatToDo = req.session.data['what-do-you-want-to-do']
    if (whatToDo == "display-prototype") {
        res.redirect('select-prototype')
    }
    else {
        res.redirect('manage-pensions')
    }
})

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

router.post('/select-owner', function (req, res) {
    req.app.locals.pensionOwner = req.session.data['pension-owner']
///////////set this to the prototype selected earlier
    res.redirect('/prototype')

})
//
// 01 Find pension prototype
//
router.get('/01-find-pensions', function (req, res) {

    async function findPensionProvidersByOwner() {
        let pensionOwnerId = req.app.locals.pensionOwnerId

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionDetails = await getPensionsByOwner(client);
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('display-pensions')
        }
    }

    findPensionsProvidersByOwner().catch(console.error)

    async function getPensionsByOwner(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({})
        // save them to an array
        .sort({pensionOwner: 1, accruedType: 1})        
        .toArray()
        console.log('results ' + JSON.stringify(results))
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
        .find({pensionOwnertype: "M"})
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

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0')
    var min = String(today.getMinutes()).padStart(2, '0')

    createdDateTime = dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + min
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

                pensionOwnertype : pension_Owner_Type,
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
        req.app.locals.id = req.query.id
        console.log('req.app.locals.id ' + req.app.locals.id)

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
        let pensionId = req.app.locals.id
        
        // format date
        let today_timestamp = new Date().toLocaleString();

        // make the date variables have a date format
        let pension_Start_Date = new Date()
        let pension_Retirement_Date = new Date()
        let employement_Start_Date = new Date()
        let employment_End_Date = new Date()
        let ERI_Calculation_Date = new Date()
        let ERI_Payable_Date = new Date()
        let accrued_Payable_Date = new Date()

        // get the inputted pension data 

        let pension_Owner = req.session.data['pensionOwner']
        console.log('pension_Owner allocated ' + pension_Owner)
        console.log('req.session.data[pensionOwner] allocated ' + req.session.data['pensionOwner'])
        let pension_Reference = req.session.data['pensionReference']
        let pension_Name = req.session.data['pensionName']
        let pension_Type = req.session.data['pensionType']
        let pension_Origin = req.session.data['pensionOrigin']
        let pension_Status = req.session.data['pensionStatus']
        console.log('pension_Status after allocated ' + pension_Status)

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

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0')
    var min = String(today.getMinutes()).padStart(2, '0')
    todayDateTime = dd + '-' + mm + '-' + yyyy + ' ' + hh + ':' + min

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
                administratorContactPreference : "Email",
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
    async function createPension(client, newPension){
        const result = await client.db("pensions").collection("pensionProvider").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`);
    } 

})

router.get('/update-provider', function (req, res) {
    // find the pension providers for the select options
    async function findAndDisplayProviders() { 
        let providerId = req.query.id
        req.app.locals.providerDetail = []
        req.app.locals.id = req.query.id
        console.log('req.app.locals.id ' + req.app.locals.id)

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close() 
            res.render('update-pension')
        }
    }

    findAndDisplayProviders().catch(console.error);

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

router.post('/update-provider', function (req, res) {    

    async function updateProvider() {
    // create an instance of the client
        const client = new MongoClient(uri);        

        req.app.locals.providerUpdatedMessage = ""
        let providerId = req.app.locals.id
        
        // format date
        let today_timestamp = new Date().toLocaleString();


        // get the inputted provider data 
        let administratorName = req.session.data['administratorName']
        let administratorContactPreference = req.session.data['administratorContactPreference']
        let administratorURL = 'https://' + administratorName + 'co.uk'
        let administratorEmail = 'enquiries@' + administratorName + "co.uk"
        let administratorPhoneNumber = '01234 567 890'
        let administratorPhoneNumberType = 'Enquiries'
        let administratorAddressLine1 = administratorAddressLine1
        let administratorAddressLine2  = administratorAddressLine1
        let administratorAddressLine3 = administratorAddressLine1
        let administratorAddressLine4 = administratorAddressLine1
        let administratorAddressLine5 = administratorAddressLine1
        let administratorPostcode = administratorPostcode
        let administratorAnnualReportURL = administratorAnnualReportURL
        let administratorCostChargesURL = administratorCostChargesURL
        let administratorImplementationURL = administratorImplementationURL
        let administratorPostalName = administratorPostalName
        let administratorSIPURL = administratorSIPURL

        let pension_Owner = req.session.data['pensionOwner']
        console.log('pension_Owner allocated ' + pension_Owner)
        console.log('req.session.data[pensionOwner] allocated ' + req.session.data['pensionOwner'])
        let pension_Reference = req.session.data['pensionReference']
        let pension_Name = req.session.data['pensionName']
        let pension_Type = req.session.data['pensionType']
        let pension_Origin = req.session.data['pensionOrigin']
        let pension_Status = req.session.data['pensionStatus']
        console.log('pension_Status after allocated ' + pension_Status)

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
