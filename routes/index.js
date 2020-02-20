var express = require('express');
var router = express.Router();
const Video = require('../models/video');
const Channel = require('../models/channel');
const User = require('../models/user');
const authUtil = require('../module/authUtil');
const missParameters = require('../module/missParameters');
const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
require("moment-duration-format");
require('dotenv').config();
router.use('/auth', require('./auth'));
const APP_KEY = process.env.APP_KEY;

/*
const cateCode = require('../module/cateCode');
router.get('/test', (req, res) => {
    console.log(cateCode[1]);
    return;
});
*/

router.get('/:sort/:category/:keyword/:page', async (req, res) => {
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
    const result = await Channel
    .find(condition)
    .sort(sort)
    .skip((10 * req.params.page) - 10)
    .limit(10);
    const maxPage = Math.ceil(await Channel.countDocuments(condition) / 10);
    return res.status(200).send({
        result,
        maxPage,
    });
});

router.get('/youtuber/:id', async (req, res) => {
    const result = await Channel
    .find({id: req.params.id})
    .sort([['createdAt', 'descending']]);
    const max_view = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {viewCount: -1 }})
    .select('viewCount');
    const max_like = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {likeCount: -1 }})
    .select('likeCount');
    const max_dislike = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {dislikeCount: -1 }})
    .select('dislikeCount');
    const max_comment = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {commentCount: -1 }})
    .select('commentCount');
    return res.status(200).send({
            result,
            max_view: max_view.viewCount,
            max_like: max_like.likeCount,
            max_dislike: max_dislike.dislikeCount,
            max_comment: max_comment.commentCount,
        });
});

router.get('/admin/:page', authUtil.validToken, async (req, res) => {
    const maxPage = Math.ceil(await User.countDocuments() / 10);
    const result = await User
    .find({})
    .sort([['createdAt', 'descending']])
    .skip((10 * req.params.page) - 10)
    .limit(10);
    return res.status(200).send({
        result,
        maxPage,
    });
});

router.post('/admin', authUtil.validToken, async (req, res) => {
    // request body로부터 로그인 정보를 받는다.
    let json = {};
    json.id  = req.body.id;
    json.name = req.body.name;
    // miss parameter가 있는지 검사한다.
    const missParam = missParameters(json);
    if(missParam) {
        return res.status(404).send('miss parameters : ' + missParam);
    }
    if(!req.body.category) {
        json.category = 'default';
    } else {
        json.category = req.body.category;
    }
    const exUser = await User.find({id: json.id, type: 'youtuber'});
    if(exUser.length != 0) {
        return res.status(404).send('exist youtuber info');
    }
    const checkId = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
            key : APP_KEY,
            part: "id",
            id: json.id,
        }
    });
    if(checkId.data.items.length == 0) {
        return res.status(404).send('isn\'t correct youtuber id');
    }
    let user = new User({
        id: json.id,
        name: json.name,
        type: 'youtuber',
        category: json.category,
        createdAt: moment()
    });
    await user.save();
    return res.status(200).send('youtuber register success');
});

router.put('/admin/:id', authUtil.validToken, async (req, res) => {
    let json = {};
    json.name = req.body.name;
    json.category = req.body.category;
    await User.updateOne({id: req.params.id}, json);
    return res.status(200).send('edit success');
});

router.delete('/admin/:id', authUtil.validToken, async (req, res) => {
    await User.deleteOne({id: req.params.id});
    return res.status(200).send('delete success');
});

module.exports = router;