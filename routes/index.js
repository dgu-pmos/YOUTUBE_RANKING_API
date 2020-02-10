var express = require('express');
var router = express.Router();
const Channel = require('../models/channel');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/:sort/:category/:keyword/:page', async (req, res) => {
    const maxPage = Math.ceil(await Channel.countDocuments({ createdAt: {$gte: moment().format('YYYY-MM-DD')}}) / 30);
    let condition = {
        createdAt: {"$gte": moment().format('YYYY-MM-DD')}
    };
    let sort;
    
    if(req.params.category !== '0'){
        condition.category = req.params.category;
    }
    if(req.params.keyword !== '0')
    {
        condition.channel_name = { $regex: '.*' + req.params.keyword + '.*' };
    }
    if(req.params.sort !== '0')
    {
        sort = [[req.params.sort, 'descending']];
    }
    let result = await Channel
    .find(condition)
    .sort(sort)
    .skip((30 * req.params.page) - 30)
    .limit(30);
    result.push({maxPage : maxPage});

    res.status(200).send(result);
});

router.get('/youtuber/:id', async (req, res) => {
    let result = await Channel
    .find({id: req.params.id})
    .sort([['createdAt', 'descending']]);

    res.status(200).send(result);
});

module.exports = router;