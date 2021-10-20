const express = require('express')
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uri = 'mongodb+srv://all_dbs_user:U5oZLxA850eM8TFr@cluster0.de9k1.mongodb.net/pdp-examples&ssl=true?retryWrites=true&w=majority'
const dataBaseName = 'pdp-examples'
const client = new MongoClient(uri)
async function createExampleCollection() {
	try {
		console.log('dataBaseName ' + dataBaseName)
		console.log('uri ' + uri)

	    // Connect to the MongoDB cluster
	    await client.connect()

		await client.db(dataBaseName).createCollection("pensionDetails", {
			validator: {
			    "$jsonSchema": {
				    "bsonType": "object",
				    "title": "The root schema",
				    "description": "The root schema comprises the entire JSON document.",
				    "required": [
				        "pensionArrangementDetails",
				        "pensionAdministratorDetails",
				        "estimatedRetirementIncomeDetails"
				       
				    ],
				    "properties": {
				        "pensionArrangementDetails": {
				            "bsonType": "object",
				            "title": "The pension arrangement details",
				            "description": "Information about the pension arrangement within which the individual has a pension",
				            "required": [
				                "pensionReference",
				                "pensionName",
				                "pensionType",
				                "pensionOrigin",
				                "pensionStatus",
				                "pensionStartDate"        
				                
				            ],
				            "properties": {
				                "pensionReference": {
				                    "bsonType": "string",
				                    "title": "Pension Reference",
				                    "description": "A unique reference number that connects the individual to the pension arrangement data. It could be their scheme/policy number, but it does not need to be, as it could be a one-time ‘quote this reference’ for an individual to use if they contact the provider.",
				                    "minLength": 1,
				                    "maxLength": 35
				                },
				                "pensionName": {
				                    "bsonType": "string",
				                    "title": "Pension Name",
				                    "description": "Name of the pension arrangement that should resonate with the individual",
				                    "minLength": 1,
				                    "maxLength": 100
				                },
				                "pensionType": {
				                    "bsonType": "string",
				                    "title": "Pension Type",
				                    "description": "Type of pension arrangement e.g. DC",
				                    "minLength": 2,
				                    "maxLength": 3,
				                    "enum": ["DB", "DC","AVC","HYB"]
				                },
				                "pensionOrigin": {
				                    "bsonType": "string",
				                    "title": "Pension Origin",
				                    "description": "Origin of the pension arrangement e.g. work",
				                    "minLength": 1,
				                    "maxLength": 1,
				                    "enum": ["W", "P"]
				                },
				                "pensionStatus": {
				                    "bsonType": "string",
				                    "title": "Pension Status",
				                    "description": "A code identifying the status of the pension arrangement according to a set list of values, allows the individual to see if they are still actively building up the pension, through ongoing contributions and / or pensionable employment",
				                    "minLength": 1,
				                    "maxLength": 1,
				                    "enum": ["A", "I"]
				                },
				                "pensionStartDate": {
				                    "bsonType": "string",
				                    "title": "Pension Start Date",
				                    "description": "A date identifying the start date of the individual’s pension with the pension arrangement",
				                    "minLength": 1,
				                    "maxLength": 10				                },
				                "pensionRetirementDate": {
				                    "bsonType": "string",
				                    "title": "Pension Retirement Date",
				                    "description": "A date identifying when the pension arrangement is set to start paying a retirement income to the individual",
				                    "minLength": 1,
				                    "maxLength": 10
				                },
				                "pensionLink": {
				                    "bsonType": "string",
				                    "title": "Pension Link",
				                    "description": "Identifier used to link pension arrangements together, e.g. AVC pot with main scheme pension",
				                    "minLength": 1,
				                    "maxLength": 35
				                }
				            }
				        },
				        "pensionAdministratorDetails": {
				            "bsonType": "object",
				            "title": "Pension Administrator Details",
				            "description": "Information about the organisation which the individual should get in touch with, to find out more about their pension",
				            "required": [
				                "administratorReference",
				                "administratorName",
				                "adminContactPreference"
				                ],
				            "properties": {
				                "administratorReference": {
				                    "bsonType": "string",
				                    "title": "Administrator Reference",
				                    "description": "A unique reference number identifying the pension administrator – this could be their governance register number",
				                    "minLength": 1,
				                    "maxLength": 35
				                },
				                "administratorName": {
				                    "bsonType": "string",
				                    "title": "Administrator Name",
				                    "description": "Name of the organisation which administers the pension arrangement that should resonate with the individual",
				                    "minLength": 1,
				                    "maxLength": 100
				                },
				                "adminContactPreference": {
				                    "bsonType": "string",
				                    "title": "Admin Contact Preference",
				                    "description": "Provide the administrator’s preferred method of being contacted",
				                    "minLength": 1,
				                    "maxLength": 1,
				                    "enum": ["W", "E", "P","M"]
				                },
				                "administratorURL ": {
				                    "bsonType": "string",
				                    "title": "Administrator URL",
				                    "description": "AURL of the pension administrator, which would allow an individual to get more information about their pension arrangement, and their pension within the pension arrangement",
				                    "minLength": 5,
				                    "maxLength": 100
				                    
				                },
				                "administratorEmail": {
				                    "bsonType": "string",
				                    "title": "Administrator Email",
				                    "description": "AEmail address that the pension administrator wishes to direct the individual to, for the individual to use to request further information/support outside of the dashboards ecosystem",
				                    "minLength": 5,
				                    "maxLength": 100
				                },
				                "administratorPhoneNumber": {
				                    "bsonType": "string",
				                    "title": "Administrator Phone Number",
				                    "description": "Full telephone number that the pension administrator wishes to direct the individual to, for the individual to use to request further information/support outside of the dashboards ecosystem",
				                    "minLength": 1,
				                    "maxLength": 12
				                },
				                "administratorPhoneNumberType": {
				                    "bsonType": "string",
				                    "title": "Administrator Phone Number Type",
				                    "description": "Type of telephone number provided e.g. Welsh speaking, or hearing impairment",
				                    "minLength": 1,
				                    "maxLength": 1,
				                    "enum": ["M", "W", "S"]
				                },
				                "administratorPostalName": {
				                    "bsonType": "string",
				                    "title": "Administrator Postal Name",
				                    "description": "Name of pension administrator/provider for postal contact",
				                    "minLength": 1,
				                    "maxLength": 100
				                },
				                "administratorAddressLine1": {
				                    "bsonType": "string",
				                    "title": "Administrator Address Line 1",
				                    "description": "First line of postal address.",
				                    "minLength": 1,
				                    "maxLength": 70
				                },
				                "administratorAddressLine2": {
				                    "bsonType": "string",
				                    "title": "Administrator Address Line 2",
				                    "description": "Second line of postal address",
				                    "minLength": 1,
				                    "maxLength": 70
				                },
				                "administratorAddressLine3": {
				                    "bsonType": "string",
				                    "title": "Administrator Address Line 3",
				                    "description": "Third line of postal address",
				                    
				                    "minLength": 1,
				                    "maxLength": 70
				                },
				                "administratorAddressLine4": {
				                    "bsonType": "string",
				                    "title": "Administrator Address Line 4",
				                    "description": "Fourth line of postal address",
				                    
				                    "minLength": 1,
				                    "maxLength": 70
				                },
				                "administratorAddressLine5": {
				                    "bsonType": "string",
				                    "title": "Administrator Address Line 5",
				                    "description": "Fifth line of postal address",
				                    
				                    "minLength": 1,
				                    "maxLength": 70
				                },
				                "administratorPostcode": {
				                    "bsonType": "string",
				                    "title": "Administrator Postcode",
				                    "description": "Postcode for address",
				                    
				                    "minLength": 1,
				                    "maxLength": 16
				                }
				            }
				        },
				        "employerDetails": {
				            "bsonType": "object",
				            "title": "Employer Details",
				            "description": "Where applicable (ie for workplace pensions), information about the employment that gave rise to the pension",
				            "properties": {
				                "employerName": {
				                    "bsonType": "string",
				                    "title": "Employer Name",
				                    "description": "Name of the employer / employment which gave rise to the individual’s pension",
				                    
				                    "minLength": 1,
				                    "maxLength": 100
				                },
				                "employmentStartDate": {
				                    "bsonType": "string",
				                    "title": "Employment Start Date",
				                    "description": "A date identifying the start of the individual’s employment which gave rise to their pension",
				                },
				                "employmentEndDate": {
				                    "bsonType": "string",
				                    "title": "Wmployment End Date",
				                    "description": "A date identifying the end of the individual’s employment which gave rise to the pension"
				                }
				            }
				        },
				        "estimatedRetirementIncomeDetails": {
				            "bsonType": "object",
				            "title": "Estimated Retirement Income Details",
				            "description": "The estimated retirement income details relating to the pension asset",
				             "required": [
				                "eriType",
				                "eriBasis",
				                "eriCalculationDate",
				                "eriPayableDate",
				                "eriAmount",
				                "eriSafeguardedBenefits"
				                
				            ],
				            "properties": {
				                "eriType": {
				                    "bsonType": "string",
				                    "title": "ERI Type",
				                    "description": "Type of pension generating the retirement income e.g. DC. To allow dashboards to signpost information to the dashboard user",
				                    "minLength": 2,
				                    "maxLength": 3,
				                    "enum": ["DC", "DB", "DBL", "AVC", "CDI", "CDL","CBS"]
				                    
				                },
				                "eriBasis": {
				                    "bsonType": "string",
				                    "title": "ERI Basis",
				                    "description": "A code representing the basis of calculation for the ERI to enable the dashboard to explain the basis of calculation",
				                    
				                    "minLength": 2,
				                    "maxLength": 4,
				                    "enum": ["SMPI","COBS","BS","BSF"]
				                },
				                "eriCalculationDate": {
				                    "bsonType": "string",
				                    "title": "ERI Calculation Date",
				                    "description": "The date the ERI was calculated"
				                },
				                "eriPayableDate": {
				                    "bsonType": "string",
				                    "title": "ERI Payable Date",
				                    "description": "The date the ERI is payable from"
				                },
				                "eriAmount": {
				                    "bsonType": "number",
				                    "title": "ERI Amount",
				                    "description": "Estimated retirement income amount"
				                },
				                "eriPot": {
				                    "bsonType": "number",
				                    "title": "ERI Pot",
				                    "description": "Estimated retirement pot used to calculate the estimated retirement income"
				                },
				                "eriSafeguardedBenefits": {
				                    "bsonType": "bool",
				                    "title": "ERI Safeguarded Benefits",
				                    "description": "The individual’s pension has safeguarded benefits",
				                },
				                "eriUnavailable": {
				                    "bsonType": "string",
				                    "title": "ERI Unavailable",
				                    "description": "Provide a reason for an ERI not being available from a set list of reasons",
				                    "enum": ["ERR","TRN","MAN"]
				                }
				            }
				        },
				        "accruedPensionDetails": {
				            "bsonType": "object",
				            "title": "The Accrued Pension Details",
				            "description": "The Accrued Pension Details",
				            "properties": {
				                "accruedType": {
				                    "bsonType": "string",
				                    "title": "Accrued Type",
				                    "description": "Type of accrued pension information, e.g. DC",
				                    
				                    "minLength": 2,
				                    "maxLength": 3,
				                    "enum": ["DC", "DB", "DBL", "AVC", "CDI","CDL", "CBS"]
				                     
				                },
				                "accruedAmountType": {
				                    "bsonType": "string",
				                    "title": "Accrued Amount Type",
				                    "description": "A code representing the basis of calculation for the accrued amount",
				                    
				                    "minLength": 2,
				                    "maxLength": 3,
				                    "enum": ["POT", "INC", "LS"]
				                },
				                "accruedCalculationDate": {
				                    "bsonType": "string",
				                    "title": "Accrued Calculation Date",
				                    "description": "The effective date the amount is calculated to"
				                },
				                "accruedPayableDate": {
				                    "bsonType": "string",
				                    "title": "Accrued Payable Date",
				                    "description": "The date the pension is payable from"
				                },
				                "accruedAmount": {
				                    "bsonType": "number",
				                    "title": "Accrued Amount",
				                    "description": "Accrued pension as at the calculation date",
				                },

				                "accruedSafeguardedBenefits": {
				                    "bsonType": "bool",
				                    "title": "Accrued Safeguarded Benefits",
				                    "description": "The individual’s pension has safeguarded benefits",
				                },
				                "accruedUnavailable": {
				                    "bsonType": "string",
				                    "title": "Accrued Unavailable",
				                    "description": "Provide a reason for an accrued pension amount not being available from a set list of reasons",
				                    
				                    "minLength": 2,
				                    "maxLength": 3,
				                    "enum": ["EXC", "ERR","TRN", "MAN"]                    
				                }             
					        }
					    }
					}
				}
			}
		})
	}

	finally {
	    // Close the connection to the MongoDB cluster
	    await client.close()
	}
}
createExampleCollection().catch(console.error)
	         