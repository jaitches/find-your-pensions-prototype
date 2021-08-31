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
