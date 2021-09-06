/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()
})
// const express = require('express')
// const { MongoClient } = require('mongodb');

function deleteRow() {
	if (confirm('Do you want to delete this pension record?')) {
	} 
	else {
	   return false;
	}
}
function deleteProviderRow() {
	if (confirm('Do you want to delete this provider record?')) {
	} 
	else {
	   return false;
	}
}
function deleteAllPensions() {
	if (confirm('Do you want to delete ALL the pension records?')) {
	} 
	else {
	   return false;
	}
}