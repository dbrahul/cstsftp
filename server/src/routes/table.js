const callLogs = require('../controller/callLogs');
const { syncCallLog } = require('../controller/syncLog');
const { syncLatestData, syncTaxInvestigation } = require('../controller/syncTaxInvestigationData');
const teams = require('../controller/teams');
const teaxInvestigation = require('../controller/teaxInvestigation');

const router = require('express').Router();

router.get('/team', teams)
router.get("/call-log", callLogs)
router.get("/tax-investigation",teaxInvestigation)
router.get('/sync-data/taxInvestigation', syncTaxInvestigation)
router.get('/sync-data/callLog', syncCallLog)
// router.get('/sync-data/', syncTaxInvestigation)

module.exports = router;