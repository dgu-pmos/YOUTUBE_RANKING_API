var express = require('express');
var router = express.Router({mergeParams: true});
const User = require('../../models/user');
const missParameters = require('../../module/missParameters');
const bcrypt = require('bcrypt');
const jwt = require('../../module/jwt');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// 로그인 라우트
router.post('/signup', async (req, res) => {
    // request body로부터 로그인 정보를 받는다.
    let json = {};
    json.id  = req.body.id;
    json.pw = req.body.pw;
    json.name = req.body.name;
    // miss parameter가 있는지 검사한다.
    const missParam = missParameters(json);
    if(missParam) {
        return res.status(404).send('miss parameters : ' + missParam);
    }
    const exUser = await User.find({id: json.id});
    if(exUser.length != 0) {
        return res.status(404).send('exist user info');
    }
    const salt = bcrypt.genSaltSync(10);
    json.pw = bcrypt.hashSync(json.pw, salt);
    let user = new User({
        id: json.id,
        pw: json.pw,
        name: json.name,
        type: 'admin',
        createdAt: moment()
    });
    await user.save();
    return res.status(200).send({
        message: "signup success"
    });
});

// 로그인 라우트
router.post('/signin', async (req, res) => {
    // request body로부터 로그인 정보를 받는다.
    let json = {};
    json.id = req.body.id;
    json.pw = req.body.pw; 
    // miss parameter가 있는지 검사한다.
    const missParam = missParameters(json);
    if(missParam) {
        res.status(404).send('miss parameters : ' + missParam);
    }
    // 존재하는 계정인지 확인한다.
    const exUser = await User.find({id: json.id, type: 'admin'});
    // 유저가 없을 때
    if(exUser.length == 0){
        return res.status(404).send('no exist user info');
    }
    // 유저가 있을 때
    else {
        // 패스워드가 일치하지 않는다면 에러 메세지 출력
        const match = bcrypt.compareSync(json.pw, exUser[0].pw);
        if(match) {
            const token = await jwt.sign(exUser[0]);
            return res.status(200).send({
                message: "signin success",
                token : token
            });
        } else {
            return res.status(404).send('incorrect user info');
        }
    }    
});

module.exports = router;
