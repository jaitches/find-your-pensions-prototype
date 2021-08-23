const express = require('express')
const router = express.Router()
const fs = require('fs')
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
const prototypeDetails = [
    {number: 1, text: "Find"},
    {number: 2, text: "Find and accrued"},
    {number: 3, text: "Find, accrued and estimated"}
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
        case "prototype-find":
        req.app.locals.ptype.number = 1
        break;       
        case "prototype-find-accrued":
        req.app.locals.ptype.number = 2  
        break;             
        case "prototype-find-accrued-estimated":
        req.app.locals.ptype.number = 3
        break;       
        default:
        req.app.locals.ptype.number = 0
    }
    req.app.locals.ptype.text = findPtypeText(req.app.locals.ptype.number, prototypeDetails)

    res.redirect('prototype-options')
// get the prototype description from the list
    function findPtypeText (ptypeNo, prototypeArray) {
        for (let i=0; i < prototypeArray.length; i++) {
            if (prototypeArray[i].number === ptypeNo) {
                return prototypeArray[i].text;
            }
        }
    }

})

// choose which prototype options to apply
router.post('/prototype-options', function (req, res) {
    req.app.locals.splitOrigin = false
    req.app.locals.splitType = false
    let ptypeOption = req.session.data['ptype-option']

    for (i=0; i < ptypeOption.length; i++ ) {
        if (ptypeOption[i] == 'split-origin') {
            req.app.locals.splitOrigin =true
        }
        if (ptypeOption[i] == 'split-type') {
            req.app.locals.splitType =true
        }
    }
//    console.log('req.app.locals.ptype.number ' + req.app.locals.ptype.number)
    switch (req.app.locals.ptype.number) {
        case 1:
        res.redirect('01-find/01-start')
        break;     
        case 2:
        res.redirect('02-find-accrued/02-start')        
        break;     
        default:
        res.redirect('03-find-accrued-estimated/03-start')


    }
})
// The user enters their name this is used to select the documents from MongoDB
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
        let pensionDetailsAll = []
        req.app.locals.pensionOwner = pensionOwnerName
        // set the local variables to false so that the elements are not displayed in the html unless they exist
        req.app.locals.workplaceFlag = false
        req.app.locals.privateFlag = false
        req.app.locals.stateFlag = false
        req.app.locals.allFlag = false

        req.app.locals.workplacePensionDetails = []
        req.app.locals.privatePensionDetails = []
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
                if (req.app.locals.splitOrigin) {
                    for (i=0; i < pensionDetailsAll.length; i++) {
                        if (pensionDetailsAll[i].pensionOrigin == "W") {
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
                else {
                    for (i=0; i < pensionDetailsAll.length; i++) {
                        if (pensionDetailsAll[i].pensionOrigin == "W") {
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
            await client.close();    
            res.render('01-find/01-display-pensions')
        }
    }

    findPensionsByOwner().catch(console.error)

    async function getPensionsByOwner(client, pensionOwnerName) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({pensionOwner : pensionOwnerName})
        // save them to an array
        .sort({pensionOwner: 1, pensionType: 1})        
        .toArray()
//        console.log('results ' + JSON.stringify(results))
        return results
    }

    async function getAllPensions(client) {
        const results = await client.db("pensions").collection("pensionDetails")
        // find all documents
        .find({})
        // save them to an array
        .sort({pensionOwner: 1, pensionName: 1})        
        .toArray()
//        console.log('results all pensions' + JSON.stringify(results))
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
            
            req.app.locals.pensionProvider.administratorShortURL = req.app.locals.pensionProvider.administratorURL,replace(/^https?\:\/\//i, "")
            req.app.locals.pensionProvider.administratorAnnualReportShortURL = req.app.locals.pensionProvider.administratorAnnualReportURL.replace(/^https?\:\/\//i, "")
            req.app.locals.pensionProvider.administratorCostsChargesShortPURL = req.app.locals.pensionProvider.administratorCostsChargesURL.replace(/^https?\:\/\//i, "")
            req.app.locals.pensionProvider.administratorImplementationShortURL = req.app.locals.pensionProvider.administratorImplementationURL.replace(/^https?\:\/\//i, "")
            req.app.locals.pensionProvider.administratorShortSIPURL = req.app.locals.pensionProvider.administratorSIPURL.replace(/^https?\:\/\//i, "")
            console.log('req.app.locals.pensionProvider.administratorShortURL ' +req.app.locals.pensionProvider.administratorShortURL).replace(/^https?\:\/\//i, "")

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

module.exports = router
