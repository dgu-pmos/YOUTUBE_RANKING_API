var express = require('express');
var router = express.Router();
const Channel = require('../models/channel');
const User = require('../models/user');
const authUtil = require('../module/authUtil');
const missParameters = require('../module/missParameters');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use('/auth', require('./auth'));

router.get('/:sort/:category/:keyword/:page', async (req, res) => {
    const maxPage = Math.ceil(await Channel.countDocuments({ createdAt: {$gte: moment().format('YYYY-MM-DD')}}) / 10);
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
    .skip((10 * req.params.page) - 10)
    .limit(10);
    result.push({maxPage : maxPage});

    return res.status(200).send(result);
});

router.get('/youtuber/:id', async (req, res) => {
    let result = await Channel
    .find({id: req.params.id})
    .sort([['createdAt', 'descending']]);
    return res.status(200).send(result);
});

router.get('/admin', authUtil.validToken, async (req, res) => {
    const result = await User
    .find({})
    .sort([['createdAt', 'descending']]);
    return res.status(200).send(result);
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
    if(json.pw) {
        const salt = bcrypt.genSaltSync(10);
        json.pw = bcrypt.hashSync(json.pw, salt);
    }
    await User.updateOne({id: req.params.id}, json);
    return res.status(200).send('edit success');
});

router.delete('/admin/:id', authUtil.validToken, async (req, res) => {
    await User.deleteOne({id: req.params.id});
    return res.status(200).send('delete success');
});

module.exports = router;