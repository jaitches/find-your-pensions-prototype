const express = require('express')
const router = express.Router()
const fs = require('fs')
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uri = 'mongodb+srv://' + process.env.MONGODB_URI + '?retryWrites=true&w=majority'

// const uri = "mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pensions?retryWrites=true&w=majority";
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
    {type: "N/A", text: "N/A", selected : ""},
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},
    {type: "INC", text: "Calculation of an accrued recurring income", selected : ""},
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]
const penEriOrAccrType = [
    {type: "N/A", text: "N/A", selected : ""},
    {type: "DC", text: "Defined contribution", selected : ""},              
    {type: "DB", text: "Defined benefit", selected : ""},           
    {type: "DBL", text: "A separately accrued lump sum (not commutation)", selected : ""},              
    {type: "AVC", text: "Additional voluntary contribution", selected : ""},              
    {type: "CDI", text: "Collective DC (CC) benefits expressed as regular income", selected : ""},           
    {type: "CDL", text: "Collective DC (CC) benefits expressed as lump sum", selected : ""},              
    {type: "CBS", text: "Cash balance scheme", selected : ""}
]
const penHowEriCalc = [
              {
                type: "N/A",
                text: "N/A", selected : ""
              },
              {
                type: "SMPI",
                text: "SMPI - statutory money purchase illustration", selected : ""
              },              
              {
                type: "COBS",
                text: "COBS - Income illustration FCA COBS rules", selected : ""
              },             
              {
                type: "BS",
                text: "BS - Benefit specific method no allowance of future build-up of benefits", selected : ""
              },              
              {
                type: "BSF",
                text: "BSF - Benefit specific method including future build-up of benefits", selected : ""
              }
            ]
const penAccrAmtType = [
    {type: "N/A",text: "N/A", selected : ""},
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},              
    {type: "INC",text: "Calculation of an accrued recurring income", selected : ""},              
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]

const prototypeDetails = [
    {number: 1, text: "Find only", urlPath: "01-find-only", startUrl: "01-find-only/01-start", displayUrl: "01-find-only/01-display-pensions"},
    {number: 2, text: "Find and view", urlPath: "02-find-view", startUrl: "02-find-view/02-start", displayUrl: "02-find-view/02-display-pensions"},
    {number: 3, text: "Find and accrued", urlPath: "03-find-accrued", startUrl: "03-find-accrued/03-start", displayUrl: "03-find-accrued/03-display-pensions"},
    {number: 4, text: "Find, accrued and estimated", urlPath: "04-find-accrued-estimated", startUrl: "04-find-accrued-estimated/04-start", displayUrl: "04-find-accrued-estimated/04-display-pensions"}
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
    req.app.locals.ptype = {}
//    console.log('selectPrototype ' + selectPrototype)

    switch (selectPrototype) {
        case "prototype-find-only":
        ptypeNumber = 1
        break;
        case "prototype-find-view":
        ptypeNumber = 2
        break;       
        case "prototype-find-accrued":
        ptypeNumber = 3  
        break;             
        case "prototype-find-accrued-estimated":
        ptypeNumber = 4
        break;       
        default:
        ptypeNumber = 0
    }
    ptypeDetails = findPtypeText(ptypeNumber, prototypeDetails)
    req.app.locals.ptype = ptypeDetails


//    res.redirect('prototype-options')
    res.redirect(ptypeDetails.startUrl + '?ptype=' + ptypeNumber)
// get the prototype description from the list
    function findPtypeText (ptypeNo, prototypeArray) {
        for (let i=0; i < prototypeArray.length; i++) {
            if (prototypeArray[i].number === ptypeNo) {
                return {
                    "number" : prototypeArray[i].number,
                    "text" : prototypeArray[i].text,
                    "startUrl" : prototypeArray[i].startUrl,
                    "displayUrl" : prototypeArray[i].displayUrl
                }
            }
        }
    }

})

// enter your details
router.post('/enter-your-details', function (req, res) {

    res.redirect('02-find-view/02-display-pensions')
})

// Get the documents from MongoDB to display fo rall prototypes
// the * is a wildcard for the prototype number in this get
router.get('/*-display-pensions', function (req, res) {

// set the default values for while testing
    req.app.locals.splitOrigin = true
    req.app.locals.splitType = false

    async function findPensionsByOwner() {
        let pensionOwnerName = req.query.owner
        let pensionDetailsAll = []
        req.app.locals.pensionOwner = pensionOwnerName
        // set the local variables to false so that the elements are not displayed in the html unless they exist
        req.app.locals.workplaceFlag = false
        req.app.locals.workplaceTypeDBFlag = false
        req.app.locals.workplaceTypeDCFlag = false
        req.app.locals.workplaceTypeOtherFlag = false
        req.app.locals.privateFlag = false
        req.app.locals.privateTypeDCFlag = false
        req.app.locals.privateTypeOtherFlag = false
        req.app.locals.stateFlag = false
        req.app.locals.allFlag = false

        req.app.locals.workplacePensionDetails = []
        req.app.locals.workplaceDBPensionDetails = []
        req.app.locals.workplaceDCPensionDetails = []
        req.app.locals.workplaceOtherPensionDetails = []
        req.app.locals.privatePensionDetails = []
        req.app.locals.privateDCPensionDetails = []
        req.app.locals.privateOtherPensionDetails = []
        req.app.locals.statePensionDetails = []


        const client = new MongoClient(uri)

        try {
            // Connect to the MongoDB cluster
            await client.connect()
            // if no name enter find all the pension documents
            if (pensionOwnerName == "") {
                // get all pensions
                pensionDetailsAll = await getAllPensions(client)
            }
            // if a name is entered select the relevant documents
            else {
                 pensionDetailsAll = await getPensionsByOwner(client, pensionOwnerName)
            }

            // split into workplace, private and state pensions if prototypeOptionOrigin selected
            if (req.app.locals.splitOrigin) {
                //display by origin - state, workplace, private
                if (req.app.locals.splitType) {
                    // display by type inside origin - DC, DB etc

                    for (i=0; i < pensionDetailsAll.length; i++) {
                        if (pensionDetailsAll[i].pensionOrigin == "W") {
                            req.app.locals.workplaceFlag = true
                            console.log('pensionDetailsAll[i] ' + JSON.stringify(pensionDetailsAll[i]))
                            req.app.locals.workplacePensionDetails.push(pensionDetailsAll[i])
                            console.log('pensionType before ifs' + pensionDetailsAll[i].pensionType)
                            if (pensionDetailsAll[i].pensionType == "DB") {
                                console.log('pensionDetailsAll[i].pensionType DB ' + pensionDetailsAll[i].pensionType)
                                req.app.locals.workplaceTypeDBFlag = true
                                req.app.locals.workplaceDBPensionDetails.push(pensionDetailsAll[i])
                            }
                            else if (pensionDetailsAll[i].pensionType == "DC") {                            
                                console.log('pensionDetailsAll[i].pensionType DC ' + pensionDetailsAll[i].pensionType)
                                req.app.locals.workplaceTypeDCFlag = true
                                req.app.locals.workplaceDCPensionDetails.push(pensionDetailsAll[i])
                            }
                            else {                            
                                console.log('pensionDetailsAll[i].pensionType other ' + pensionDetailsAll[i].pensionType)
                                req.app.locals.workplaceTypeOtherFlag = true
                                req.app.locals.workplaceOtherPensionDetails.push(pensionDetailsAll[i])                       
                            }
                        }
                        else if (pensionDetailsAll[i].pensionOrigin == "P") {
                            req.app.locals.privateFlag = true
                            req.app.locals.privatePensionDetails.push(pensionDetailsAll[i])
                            if (pensionDetailsAll[i].pensionType = "DC") {
                                req.app.locals.privateTypeDCFlag = true
                                req.app.locals.privateDCPensionDetails.push(pensionDetailsAll[i])
                            }
                            else {
                                req.app.locals.privateTypeOtherFlag == true
                                req.app.locals.privateDCPensionDetails.push(pensionDetailsAll[i])                       
                            }
                        }
                        else if (pensionDetailsAll[i].pensionOrigin == "S"){
                            req.app.locals.stateFlag = true
                            // there will only be one record for State pension!
                            req.app.locals.statePensionDetails = pensionDetailsAll[i]
                        }
                    }
                }
                else {
                    // split by origin not type

 //                   console.log('show all pensions ' + JSON.stringify(pensionDetailsAll))
                    for (i=0; i < pensionDetailsAll.length; i++) {
                        if (pensionDetailsAll[i].pensionOrigin == "W") {
//                            console.log('pensionDetailsAll[i].pensionOrigin W ' + pensionDetailsAll[i].pensionReference)
                            req.app.locals.workplaceFlag = true
                            req.app.locals.workplacePensionDetails.push(pensionDetailsAll[i])
                        }
                        else if (pensionDetailsAll[i].pensionOrigin == "P") {
                            req.app.locals.privateFlag = true
                            req.app.locals.privatePensionDetails.push(pensionDetailsAll[i])
                        }
                        else if (pensionDetailsAll[i].pensionOrigin == "S"){
                            req.app.locals.stateFlag = true
                            // there will only be one record for State pension!
                            req.app.locals.statePensionDetails = pensionDetailsAll[i]
                        }
                    }
                }
            }
            else {
                req.app.locals.allFlag = true
                req.app.locals.pensionDetails = pensionDetailsAll

            }
/*            console.log('req.app.locals.workplacePensionDetails ' +JSON.stringify(req.app.locals.workplacePensionDetails))
            console.log('req.app.locals.privatePensionDetails ' +JSON.stringify(req.app.locals.privatePensionDetails))
            console.log('req.app.locals.statePensionDetails ' +JSON.stringify(req.app.locals.statePensionDetails))
            console.log('req.app.locals.pensionDetails ' +JSON.stringify(req.app.locals.pensionDetails))
*/
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            console.log('req.app.locals.ptype ' + JSON.stringify(req.app.locals.ptype))
            let ptypeDisplayUrl = ""
            switch(req.app.locals.ptype.number) {
                case 1:
                ptypeDisplayUrl = req.app.locals.ptype.displayUrl
                break;                
                case 2:
                ptypeDisplayUrl = req.app.locals.ptype.displayUrl
                break;                
                case 3:
                ptypeDisplayUrl = req.app.locals.ptype.displayUrl
                break;                
                case 4:
                ptypeDisplayUrl = req.app.locals.ptype.displayUrl
                break;
            }
            console.log('displayUrl ' + ptypeDisplayUrl)
            res.render(ptypeDisplayUrl)
        }
    }

    findPensionsByOwner().catch(console.error)

    async function getPensionsByOwner(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({pensionOwnerType: "M"})
        // save them to an array
        .sort({pensionOrigin: 1, pensionType: 1, pensionRetirementDate: -1, pensionName: 1})        
        .toArray()
//        console.log('results ' + JSON.stringify(results))
        return results
    }    

    async function getAllPensions(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({pensionOwnerType: "M"})
        // save them to an array
        .sort({pensionOrigin: 1, pensionType: 1, pensionRetirementDate: -1, pensionName: 1})        
        .toArray()
//        console.log('results all pensions' + JSON.stringify(results))
        return results
    }
})


// 01 additional page of pension details 
router.get('/02-find-view/02-pension-details', function (req, res) {

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
            if (req.app.locals.pensionProvider.administratorURL){
                req.app.locals.pensionProvider.administratorShortURL = req.app.locals.pensionProvider.administratorURL.replace(/^https?\:\/\//i, "")
                req.app.locals.pensionProvider.administratorAnnualReportShortURL = req.app.locals.pensionProvider.administratorAnnualReportURL.replace(/^https?\:\/\//i, "")
                req.app.locals.pensionProvider.administratorCostsChargesShortPURL = req.app.locals.pensionProvider.administratorCostsChargesURL.replace(/^https?\:\/\//i, "")
                req.app.locals.pensionProvider.administratorImplementationShortURL = req.app.locals.pensionProvider.administratorImplementationURL.replace(/^https?\:\/\//i, "")
                req.app.locals.pensionProvider.administratorShortSIPURL = req.app.locals.pensionProvider.administratorSIPURL.replace(/^https?\:\/\//i, "")
                console.log('req.app.locals.pensionProvider.administratorShortURL ' +req.app.locals.pensionProvider.administratorShortURL).replace(/^https?\:\/\//i, "")
            }

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('02-find-view/02-pension-details')
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
    else if (whatDataToManage == "pensions-list") {
        res.redirect('pensions-list')
    }    
    else if (whatDataToManage == "add-provider") {
        res.redirect('add-provider')
    }
    else {
        res.redirect('display-providers')
    }
})

//
// ****** routes for pension crud
//

// Display pensions
router.get('/pensions-list', function (req, res) {
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
                else if (allPensionDetails[i].pensionOwnerType == "E") {
                    examplePensionDetails.push(allPensionDetails[i])
                }
            }
            req.app.locals.manualPensionDetails = manualPensionDetails
            req.app.locals.examplePensionDetails = examplePensionDetails
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('pensions-list')
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
        // initialise variables - I have no idea how the selected values are being updated in the const copied into the seesion variables
    
        for (i=0; i < penTypes.length; i++) {
            penTypes[i].selected = ""
        }
        for (i=0; i < penOrigin.length; i++) {
            penOrigin[i].selected = ""
        }
        for (i=0; i < penStatus.length; i++) {
            penStatus[i].selected = ""
        }
        for (i=0; i < penEriOrAccrType.length; i++) {
            penEriOrAccrType[i].selected = ""
        }
        for (i=0; i < penAccrAmtType.length; i++) {
            penAccrAmtType[i].selected = ""
        }

        req.app.locals.pensionProviders = []
        req.app.locals.pensionDetails = []

        req.app.locals.pensionId = req.query.pensionId
//        console.log('req.app.locals.pensionId ' + req.app.locals.pensionId)

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
            req.app.locals.pensionDetails = await getPensionById(client, pensionId)
            // reset selected in penTypes 


        // *** for the HTML select component -  set the selected option to the value in document in MongoDB 

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

            // Pension status set the selected option
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

            // Pension how ERI calculated - Basis
            req.app.locals.pensionDetails.pensionERIBasis = penHowEriCalc
            for (i=0; i < req.app.locals.pensionDetails.pensionERIBasis.length; i++) {
               if (req.app.locals.pensionDetails.ERIBasis == req.app.locals.pensionDetails.pensionERIBasis[i].type) {
                    req.app.locals.pensionDetails.pensionERIBasis[i].selected = 'selected'   
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
            res.redirect('pensions-list')
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
            res.redirect ('/pensions-list')   
        }
    }
    deletePension().catch(console.error)

    async function deletePensionWithId(client, pensionId) {
        const result = await client.db("pensions").collection("pensionDetails")
            .deleteOne({_id: ObjectId(pensionId)});
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

// the delete button from the list of pensions

router.post('/delete-all-pensions', function (req, res) {

    async function deleteAllPension() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deletePensions(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/pensions-list')   
        }
    }
    deleteAllPension().catch(console.error)

    async function deletePensions(client, pensionId) {
        const result = await client.db("pensions").collection("pensionDetails")
            .deleteMany({pensionOwnerType: "M"});
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
//
// ****** routes for providers
//

// Display providers
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

router.post('/add-provider-details', function (req, res) {
//get the pension provider list

// format date
    let today_timestamp = new Date().toLocaleString()

    let administrator_Name = req.session.data['administrator-name']
    let administrator_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Email = "info@" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Phone_Number = "01234 020500"
    let administrator_Annual_Report_URL = administrator_URL + "/annual-report"
    let administrator_Costs_Charges_URL = administrator_URL + "/costs-and-charges"
    let administrator_Implementation_URL = administrator_URL  + "/implementation-statement"
    let administrator_SIP_URL = administrator_URL + "/statement-of-investment.co.uk"

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
                administratorContactPreference : "Website",
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
            let newProviderDocument = await client.db("pensions").collection("pensionProvider").findOne({ timeStamp : today_timestamp});
            await client.close()
            res.redirect('update-provider?providerId=' + newProviderDocument._id)
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

router.post('/delete-provider/:id', function (req, res) {

    async function deleteProvider() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deleteProviderById(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/display-providers')   
        }
    }
    deleteProvider().catch(console.error)

    async function deleteProviderById(client, providerId) {
        const result = await client.db("pensions").collection("pensionProvider")
            .deleteOne({_id: ObjectId(providerId)})
            console.log('providerId' + providerId)
            console.log('result ' + JSON.stringify(result))
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

module.exports = router
