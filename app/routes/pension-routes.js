const express = require('express')
const router = express.Router()
const fs = require('fs')
const { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb')
const uri = 'mongodb+srv://' + process.env.MONGODB_URI + '?retryWrites=true&w=majority'
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
const penEriOrAccrType = [
    {type: "", text: "N/A", selected: ""},
    {type: "DC", text: "Defined contribution", selected: ""},
    {type: "DB", text: "Defined benefit", selected: ""},
    {type: "DBL", text: "A separately accrued lump sum (not commutation)", selected: ""},
    {type: "AVC", text: "Additional volunatary contribution", selected: ""},
    {type: "CDI", text: "Collective DC (CC) benefits expressed as regular income", selected: ""},
    {type: "CDL", text: "Collective DC (CC) benefits expressed as lump sum", selected: ""},
    {type: "CBS", text: "Cash balance scheme", selected: ""}
    ]
const penHowEriCalc = [
    {type: "", text: "N/A", selected: ""},
    {type: "SMPI", text: "SMPI - statutory money purchase illustration", selected: ""},              
    {type: "COBS", text: "COBS - Income illustration FCA COBS rules", selected: ""},
    {type: "BS", text: "BS - Benefit specific method no allowance of future build-up of benefits", selected: ""},
    {type: "BSF",text: "BSF - Benefit specific method including future build-up of benefits", selected: ""}
]              
const penAccrAmtType = [
    {type: "", text: "N/A", selected : ""},
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},
    {type: "INC", text: "Calculation of an accrued recurring income", selected : ""},
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]
const prototypeDetails = [
    {number: 1, text: "Find"},
    {number: 2, text: "Find and accrued"},
    {number: 3, text: "Find, accrued and estimated"}
]
//
// ****** routes for admin pension pages
//

// Display pensions
router.get('/display-pensions', function (req, res) {
// connect to MongoDB to add the doc (record) to the collection (table)
    async function findAllPensions() {
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect()
            let allPensionDetails = await getAllPensions(client)
            let manualPensionDetails = []
            let examplePensionDetails = []
            for (i=0; i<allPensionDetails.length; i++){
                if (allPensionDetails[i].pensionOwnerType == "M") {
                    manualPensionDetails.push(allPensionDetails[i])
                }
                else {
                    examplePensionDetails.push(allPensionDetails[i])
                }
            }
            req.app.locals.manualPensionDetails = manualPensionDetails
            req.app.locals.examplePensionDetails = examplePensionDetails
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
        .find({})
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
    let ERI_Type = req.session.data['ERIType']
    let ERI_Basis = req.session.data['ERIBasis']
    ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
    ERI_Payable_Date = pension_Retirement_Date
    let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
    let ERI_Pot = req.session.data['ERIPot']
    let ERI_Safeguarded_Benefits = 0
    let ERI_Unavailable = null
    
    let accrued_Type = req.session.data['accruedType']
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
            for (i=0; i < req.app.locals.pensionDetails.pensionOriginArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionOrigin == req.app.locals.pensionDetails.pensionOriginArr[i].type) {
                 req.app.locals.pensionDetails.pensionOriginArr[i].selected = 'selected'   
                }
            }

            // Pension origin set the selected option
            req.app.locals.pensionDetails.pensionStatusArr = penStatus
            for (i=0; i < req.app.locals.pensionDetails.pensionStatusArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionStatus == req.app.locals.pensionDetails.pensionStatusArr[i].type) {
                 req.app.locals.pensionDetails.pensionStatusArr[i].selected = 'selected'   
                }
            }
            
            // Pension ERI type set the selected option
            req.app.locals.pensionDetails.pensionERITypeArr = penEriOrAccrType
            for (i=0; i < req.app.locals.pensionDetails.pensionERITypeArr.length; i++) {
                if (req.app.locals.pensionDetails.ERIType == req.app.locals.pensionDetails.pensionERITypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionERITypeArr[i].selected = 'selected'   
                }
            }            

            // Pension how ERI calculated
            req.app.locals.pensionDetails.pensionERICalcArr = penHowEriCalc
            for (i=0; i < req.app.locals.pensionDetails.pensionERICalcArr.length; i++) {
                if (req.app.locals.pensionDetails.ERICalcArr == req.app.locals.pensionDetails.pensionERICalcArr[i].type) {
                 req.app.locals.pensionDetails.pensionERICalcArr[i].selected = 'selected'   
                }
            }

            // Pension accrued type set the selected option
            req.app.locals.pensionDetails.pensionAccruedTypeArr = penEriOrAccrType
            for (i=0; i < req.app.locals.pensionDetails.pensionAccruedTypeArr.length; i++) {
                if (req.app.locals.pensionDetails.accruedType == req.app.locals.pensionDetails.pensionAccruedTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionAccruedTypeArr[i].selected = 'selected'   
                }
            }   

            // Pension accrued amount type set the selected option
            req.app.locals.pensionDetails.pensionAccruedAmtTypeArr = penAccrAmtType
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
        console.log('req.app.locals.pensionId ' + req.app.locals.pensionId)
        let pensionId = req.app.locals.pensionId
       
        // format date
        let today_timestamp = new Date().toLocaleString()

        // make the date variables have a date format
        let pension_Start_Date = new Date()
        let pension_Retirement_Date = new Date()
        let employment_Start_Date = new Date()
        let employment_End_Date = new Date()
        let ERI_Calculation_Date = new Date()
        let ERI_Payable_Date = new Date()
        let accrued_Payable_Date = new Date()

        // get the inputted pension data 

        let pension_Owner = req.session.data['pensionOwner']
        let pension_Reference = req.session.data['pensionReference']
        let pension_Name = req.session.data['pensionName']
        let pension_Type = req.session.data['pensionType']
        let pension_Origin = req.session.data['pensionOrigin']
        let pension_Status = req.session.data['pensionStatus']
        pension_Start_Date = req.session.data['pensionStartDate']
        pension_Retirement_Date = req.session.data['pensionRetirementDate']
 
        let pension_Link = req.session.data['pensionLink']

        let administrator = req.session.data['administratorDetails']
        let administratorArray = administrator.split(":")
        let administrator_Reference = administratorArray [0]
        let administrator_Name = administratorArray [1]

        let employer_Name = req.session.data['employerName']   
        employment_Start_Date = req.session.data['employmentStartDate']
        employment_End_Date = req.session.data['employmentEndDate']

        let ERI_Type = req.session.data['ERIType']
        let ERI_Basis = req.session.data['ERIBasis']
        ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
        ERI_Payable_Date = pension_Retirement_Date
        let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
        let ERI_Pot = req.session.data['ERIPot']
        let ERI_Safeguarded_Benefits = 0
        let ERI_Unavailable = null

        let accrued_Type = req.session.data['accruedType']
        let accrued_Amount_Type = req.session.data['accruedAmountType']

        accrued_Calculation_Date = req.session.data['accruedCalculationDate'] 
        accrued_Payable_Date = pension_Retirement_Date
        let accrued_Amount = req.session.data['accruedAmount']
        let accrued_Safeguarded_Benefits = 0
        let accrued_Unavailable = null

        try {
            await client.connect();

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
            res.redirect('display-pensions')
        }
    }

    updatePension().catch(console.error);

    // Add functions that make DB calls here
    async function updatePensionDetails(client, pensionId, updatePension){
        console.log('updatePension ' + JSON.stringify(updatePension))
        console.log('pensionId ' + pensionId)
        const result = await client.db("pensions").collection("pensionDetails")
            .updateOne({ _id : ObjectId(pensionId)}, {$set: updatePension});
        console.log(`${result.modifiedCount} document was updated.`)
    }

})

// the delete button from the list of pensions

router.post('/delete-pension/:id', function (req, res) {

    async function deletePension() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deletePensionWithId(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/display-pensions')   
        }
    }
    deletePension().catch(console.error)

    async function deletePensionWithId(client, pensionId) {
        const result = await client.db("pensions").collection("pensionDetails")
            .deleteOne({_id: ObjectId(pensionId)});
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

router.post('/copy-pension/:id', function (req, res) {

    async function copyPension() {
        
        const client = new MongoClient(uri)
        let examplePensionDetail = {}
        let today_timestamp = new Date().toLocaleString()


        try {
            // Connect to the MongoDB cluster
            await client.connect()
            // get the details of the pension to copy
            examplePensionDetail = await getPensionById(client, req.params.id)

            await createPension(client, {

                pensionOwnerType : "M",
                pensionOwner : examplePensionDetail.pensionOwner,
                pensionReference : examplePensionDetail.pensionReference,
                pensionName : examplePensionDetail.pensionName,
                pensionType : examplePensionDetail.pensionType,
                pensionOrigin : examplePensionDetail.pensionOrigin,
                pensionStatus : examplePensionDetail.pensionStatus,
                pensionStartDate : examplePensionDetail.pensionStartDate,
                pensionRetirementDate : examplePensionDetail.pensionRetirementDate,
                pensionLink : examplePensionDetail.pensionLink,
                administratorReference : examplePensionDetail.administratorReference,
                administratorName : examplePensionDetail.administratorName,
                employerName : examplePensionDetail.employerName,
                employmentStartDate : examplePensionDetail.employmentStartDate,
                employmentEndDate : examplePensionDetail.employmentEndDate,
                ERIType : examplePensionDetail.ERIType,
                ERIBasis : examplePensionDetail.ERIBasis,
                ERICalculationDate : examplePensionDetail.ERICalculationDate,
                ERIPayableDate : examplePensionDetail.ERIPayableDate,
                ERIAnnualAmount : examplePensionDetail.ERIAnnualAmount,
                ERIPot : examplePensionDetail.ERIPot,
                ERISafeguardedBenefits : examplePensionDetail.ERISafeguardedBenefits,
                ERIUnavailable : examplePensionDetail.ERIUnavailable,
                accruedType : examplePensionDetail.accruedType,
                accruedAmountType : examplePensionDetail.accruedAmountType,
                accruedCalculationDate : examplePensionDetail.accruedCalculationDate,
                accruedPayableDate : examplePensionDetail.accruedPayableDate,
                accruedAmount : examplePensionDetail.accruedAmount,
                accruedSafeguardedBenefits : examplePensionDetail.accruedSafeguardedBenefits,
                accruedUnavailable : examplePensionDetail.accruedUnavailable,
                timeStamp: today_timestamp

            })
            // create the new record

        } finally {
            // find the _id of the document just created
            let newPensionDocument = await client.db("pensions").collection("pensionDetails").findOne({ timeStamp : today_timestamp});
            let newPensionId = newPensionDocument._id
            console.log('newPensionDocument ' + JSON.stringify(newPensionDocument))
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/update-pension?pensionId=' + newPensionId)   
        }
    }
    copyPension().catch(console.error)

    async function getPensionById(client, pensionId) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .findOne({_id: ObjectId(pensionId)})
        return results
    }
    async function createPension(client, newPension){
        console.log('create pension in copy')
        const result = await client.db("pensions").collection("pensionDetails").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`)
    } 
})

module.exports = router
