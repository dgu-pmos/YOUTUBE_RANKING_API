'use strict';

const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
const Channel = require('./models/channel');
const Video = require('./models/video');
const User = require('./models/user');
const axios = require('axios');
const connect = require('./models');
const cron = require('node-cron');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
require('dotenv').config();
// const backup = require('mongodb-backup-fixed'); // for backup
connect();
const route = require('./routes');
const APP_KEY = process.env.APP_KEY;

let channel_id_params, channel_ids, res_channel_ids, i, j, res_id, res_data, k, video_ids, sub_video_ids, video_id_params;
let channel_arr = [];
let channel_list = [];
let weekly_viewCount = 0;
let weekly_likeCount = 0;
let weekly_dislikeCount = 0;
let weekly_commentCount = 0;
let VF_index = 0;
let VE_index = 0;
let VC_index = 0;
let BC_index = 0;
let video_list = [];
let nextToken = undefined;
let channel_list_VF, channel_list_VE, channel_list_VC, channel_list_BC;

/*
for backup
const {
    BACKUP_ID,
    BACKUP_PASSWORD,
} = process.env;
*/

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', route);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

cron.schedule('0 0 * * *', async function(){
    channel_ids = await User.find({type: 'youtuber'});
    for(i = 0 ; i < channel_ids.length ; i++)
        channel_arr[i] = channel_ids[i].id;
    channel_ids = channel_arr.join(',');

    // 채널 정보 저장
    channel_id_params = {
        key : APP_KEY,
        part: "id,snippet,statistics",
        id: channel_ids,
        maxResults: "50",
    };
    do {
        if(nextToken)
            channel_id_params.pageToken = nextToken;
        res_channel_ids = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: channel_id_params
        });
        nextToken = res_channel_ids.data.nextPageToken;
        for(i = 0 ; i < res_channel_ids.data.items.length ; i++) {
            let category = await User.findOne({id: res_channel_ids.data.items[i].id})
            let channel = new Channel({
                id: res_channel_ids.data.items[i].id,
                channel_name: res_channel_ids.data.items[i].snippet.title,
                img: res_channel_ids.data.items[i].snippet.thumbnails.default.url,
                viewCount: res_channel_ids.data.items[i].statistics.viewCount,
                subCount: res_channel_ids.data.items[i].statistics.subscriberCount,
                videoCount: res_channel_ids.data.items[i].statistics.videoCount,
                publishedAt: res_channel_ids.data.items[i].snippet.publishedAt,
                createdAt: moment(),
                country: res_channel_ids.data.items[i].snippet.country,
                category: category.category,
            });
            await channel.save();
        }
    } while(nextToken)
    nextToken = undefined;
    
    // 각 채널에 해당하는 동영상 정보 조회 및 저장
    channel_list = await Channel.find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
    // 동영상 id 조회
    for(i = 0 ; i < channel_list.length ; i++) {
        video_ids = [];
        video_id_params = {
            key : APP_KEY,
            part: "id",
            channelId: channel_list[i].id,
            publishedAfter: moment().add("-7","d")._d,
            type: "video",
            order: "date",
            maxResults: "50",
        };
        do {
            if(nextToken)
                video_id_params.pageToken = nextToken;
            res_id = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: video_id_params
            });
            nextToken = res_id.data.nextPageToken;
            for(j = 0 ; j < res_id.data.items.length ; j++)
                video_ids.push(res_id.data.items[j].id.videoId);
        } while(nextToken)
        nextToken = undefined;
        j = 0;
        // 동영상 상세 정보 조회
        do {
            sub_video_ids = video_ids.slice((50 * j), (50 * (j+1)));
            j++;
            res_data = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key : APP_KEY,
                    part: "id,snippet,statistics",
                    id: sub_video_ids.join(','),
                }
            });
            // 동영상 상세 정보 저장
            for(k = 0 ; k < res_data.data.items.length ; k++) {
                let video = new Video({
                    id: res_data.data.items[k].id,
                    channel: channel_list[i]._id,
                    video_name: res_data.data.items[k].snippet.title,
                    img: res_data.data.items[k].snippet.thumbnails.default.url,
                    viewCount: res_data.data.items[k].statistics.viewCount,
                    likeCount: res_data.data.items[k].statistics.likeCount,
                    dislikeCount: res_data.data.items[k].statistics.dislikeCount,
                    commentCount: res_data.data.items[k].statistics.commentCount,
                    publishedAt: res_data.data.items[k].snippet.publishedAt,
                    createdAt: moment(),
                });
                await video.save();
            }
        } while(Math.ceil(video_ids.length / 50) > j)
    }

    for(i = 0 ; i < channel_list.length ; i++) {
        video_list = await Video.find({channel: channel_list[i]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
        if(video_list.length === 0) {
            weekly_viewCount = 0;
            weekly_likeCount = 0;
            weekly_dislikeCount = 0;
            weekly_commentCount = 0;
        } else {
            video_list.sort((a,b) => (a.viewCount > b.viewCount) ? -1 : ( (b.viewCount > a.viewCount) ? 1 : 0));
            for(j = 0 ; j < video_list.length ; j++) {
                weekly_viewCount += video_list[j].viewCount;
                weekly_likeCount += video_list[j].likeCount;
                weekly_dislikeCount += video_list[j].dislikeCount;
                weekly_commentCount += video_list[j].commentCount;
            }
        }
        if(video_list.length === 0)
        {
            VF_index = 0;
            VE_index = 0;
            VC_index = 0;
            BC_index = 0;
        }
        else
        {
            VF_index = weekly_viewCount / video_list.length + video_list[0].viewCount;
            VE_index = (weekly_likeCount / (weekly_likeCount + weekly_dislikeCount)) * 100;
            VC_index = (weekly_commentCount / channel_list[i].subCount) * 100;
            BC_index = VF_index + ((0.04 * weekly_viewCount) * VE_index / 100)+((0.005 * weekly_viewCount) * VC_index / 100);
        }
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VF_index: VF_index,
            VE_index: VE_index,
            VC_index: VC_index,
            BC_index: BC_index
        });
        weekly_viewCount = 0;
        weekly_likeCount = 0;
        weekly_dislikeCount = 0;
        weekly_commentCount = 0;
    }
    channel_list_VF = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VF_index', 'descending']]);
    for(i = 0 ; i < channel_list_VF.length ; i++) {
        await Channel.updateOne({ id: channel_list_VF[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VF_rank: i+1,
        });
    }
    channel_list_VE = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VE_index', 'descending']]);
    for(i = 0 ; i < channel_list_VE.length ; i++) {
        await Channel.updateOne({ id: channel_list_VE[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VE_rank: i+1,
        });
    }
    channel_list_VC = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VC_index', 'descending']]);
    for(i = 0 ; i < channel_list_VC.length ; i++) {
        await Channel.updateOne({ id: channel_list_VC[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VC_rank: i+1,
        });
    }
    channel_list_BC = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['BC_index', 'descending']]);
    for(i = 0 ; i < channel_list_BC.length ; i++) {
        await Channel.updateOne({ id: channel_list_BC[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            BC_rank: i+1,
        });
    }
});

module.exports = app;