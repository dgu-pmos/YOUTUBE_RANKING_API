var express = require('express');
var router = express.Router();
const Channel = require('../models/channel');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/:filter', async (req, res) => {
    // viewCount, SubCount, index 4개
    const result = await Channel.find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}}).sort([[req.params.filter, 'descending']]);
    res.status(200).send(result);
});

module.exports = router;