const express = require('express')
const router = express.Router()
const index = require('../controllers/index')

router.get('/test', index.init, index.login, index.getDailyGain, index.logout, index.sendData)
router.get('/get', index.init, index.getGraph, index.sendData)
router.get('/test2', index.init, index.getDataDaily2, index.sendData)

module.exports = router