const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const formatDate = function(inputDate) { 
	console.log('inputDate ' + inputDate)
	let stringDateArr = inputDate.split('-')
	console.log('stringDateArr ' + JSON.stringify(stringDateArr))
	let monthPosition = Number(stringDateArr[1]) -1
	let stringDate = ""
	stringDate = stringDateArr[2] + ' ' + monthNames[monthPosition] + ' ' + stringDateArr[0]

	console.log('stringDate ' + stringDate)
	return stringDate
    }
module.exports = formatDate;
