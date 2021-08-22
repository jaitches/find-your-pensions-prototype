const express = require('express')
const router = express.Router()

//
// ****** routes for main pages and prototypes
//

// choose to manage data or display prototypes
/*
router.post('/display-or-manage-data', function (req, res) {
        console.log('new routes file')
    const whatToDo = req.session.data['what-do-you-want-to-do']
    if (whatToDo == "prototype") {
        console.log('new routes file')
        res.redirect('select-prototype')
    }
    else {
        res.redirect('manage-pensions')
    }
})
*/
module.exports = router
