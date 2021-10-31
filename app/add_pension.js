const express = require('express')
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uriExamples = 'mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pdp-examples&ssl=true?retryWrites=true&w=majority'
const exampleDB = 'pdp-examples'
const uriTest = 'mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pdp-examples&ssl=true?retryWrites=true&w=majority'
const testDB = 'pdp-test'
const clientExample = new MongoClient(uriExamples)

async function createExampleCollection() {
	try {
	    // Connect to the MongoDB cluster
	    await clientExample.connect()
        await createPension(clientExample, {
			"pensionOwnerType":"M","pensionOwner":"Alicia Phillips","pensionDescription":"Solar Energy Systems Pension Fund","pensionReference":"7261481","pensionName":"Solar Energy Systems Pension Fund - AVCs","pensionType":"AVC","pensionOrigin":"W","pensionStatus":"A","pensionStartDate":"2018-07-01","pensionRetirementDate":"2042-11-26","pensionRetirementAge":"","pensionLink":"","administratorReference":"617c393413a74110b4236523","administratorName":"Solar Energy Systems Pension Fund","employerName":"","employmentStartDate":"","employmentEndDate":"","ERIType":null,"ERIBasis":null,"ERICalculationDate":null,"ERIPayableDate":"2042-11-26","ERIAnnualAmount":"","ERIPot":"","ERISafeguardedBenefits":{"$numberInt":"0"},"ERIUnavailable":null,"accruedType":null,"accruedAmountType":null,"accruedCalculationDate":"","accruedPayableDate":"2042-11-26","accruedAmount":"","accruedSafeguardedBenefits":{"$numberInt":"0"},"accruedUnavailable":null,"timeStamp":"31/10/2021, 17:19:58"
			, "pensionParticipant" : "3"
		})
    }

	finally {
	    // Close the connection to the MongoDB cluster
	    await clientExample.close()
	}
    async function createPension(client, newPension){
        const result = await clientExample.db(exampleDB).collection("pensionDetails").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`)
    } 
}

/*    // get the pension details
    async function getTest(client, pensionId) {
        const results = await client.db(uriTest).collection("pensionDetails")
        .find({ _id : ObjectId(pensionId)})
//        console.log('results getPensionById' + JSON.stringify(results))
        return results
    }
}
*/
createExampleCollection().catch(console.error)
	         