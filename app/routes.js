const express = require('express')
const router = express.Router()
const fs = require('fs')

const pensionList = require('./pensionList.json')
// Add your routes here - above the module.exports line


router.get('/display-pensions', function (req, res) {
	let pensionArray = []
	console.log('pensionList.pensions.length ' + pensionList.pensions.length)
	for (let i=0; i < pensionList.pensions.length; i++) {
        pension = pensionList.pensions[i]
        pensionArray.push(pension) 
	}
	req.app.locals.pensionDetails = pensionArray

  res.render('display-pensions')
})

router.get('/manage-pensions', function (req, res) {
	let pensionArray = []
	console.log('pensionList.pensions.length ' + pensionList.pensions.length)
	for (let i=0; i < pensionList.pensions.length; i++) {
        pension = pensionList.pensions[i]
        pensionArray.push(pension) 
	}
	req.app.locals.pensionDetails = pensionArray

  res.render('manage-pensions')
})

router.post('/add-pension', function (req, res) {
	// get the inputted info

    let pensionName = req.session.data['pension-name']

    let administratorName = req.session.data['pension-provider']

    let ERICalculationDate = req.session.data['date-calculated']

    let ERIPayableDate = req.session.data['date-payable']

    let ERIAnnualAmount = req.session.data['annual-eri']

    let ERIPot = req.session.data['pension-value']

    let addPension =
    {
    	"pensionName" : pensionName,
    	"administratorName" : administratorName,
    	"ERICalculationDate" : ERICalculationDate,
    	"ERIPayableDate" : ERICalculationDate,
    	"ERIAnnualAmount" : Number(ERIAnnualAmount),
    	"ERIPot": Number(ERIPot)

    }

    // write the line to the array
    pensionList.pensions.push(addPension)

    console.log (JSON.stringify(pensionList))
    let writeData = JSON.stringify(pensionList, null, 4)

    fs.writeFileSync ("./pensionList.json", writeData, function(err) {
	    if (err) throw err;
	    console.log('pension added')
	    }
	)
    // re load the page to show new line

    res.render('add-pensions')


})
router.post('/edit-pension', function (req, res) {
	let editPensionArray =[]

})
router.post('/delete-pension', function (req, res) {

})
module.exports = router
