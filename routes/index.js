var express = require('express');
var router = express.Router();
const Channel = require('../models/channel');

router.get('/:filter', async (req, res) => {
    // viewCount, SubCount, index 4개
    const result = await Channel.find({}).sort([[req.params.filter, 'descending']]);
    res.status(200).send(result);
});

module.exports = router;