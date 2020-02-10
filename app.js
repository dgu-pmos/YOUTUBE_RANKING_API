'use strict';

const express = require('express');
const app = express();
const Channel = require('./models/channel');
const Video = require('./models/video');
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

let response, i, j, res_id, res_data, k, video_ids, sub_video_ids, video_id_params, video_params;
let dummy_ids = "UCwx6n_4OcLgzAGdty0RWCoA,UC7Krez5EI8pXKHnYWsE-zUw,UCIG4gr_wIy5CIlcFciUbIQw";
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
app.use(express.urlencoded({ extended: false }));
app.use('/', route);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

cron.schedule('0 0 * * *', async function(){
    /*
    // 이전 데이터 tar로 백업, for backup
    backup({
        uri: `mongodb://${BACKUP_ID}:${BACKUP_PASSWORD}@211.63.192.209:27017/youtube`,
        root: __dirname,
        tar: moment().format('YYYY-MM-DD hh:mm:ss')+'.tar'
    });
    // 현재 데이터들을 다 비움
    await Channel.remove({});
    await Video.remove({});
    */

    // 채널 정보 저장
    response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: {
        key : "AIzaSyAqLZxZPmuOd1iuAMf_GsiV1zzQvcW5zqY",
        part: "id,snippet,statistics",
        id: dummy_ids,
    }
    });

    for(i = 0 ; i < response.data.items.length ; i++) {
        let channel = new Channel({
            id: response.data.items[i].id,
            channel_name: response.data.items[i].snippet.title,
            img: response.data.items[i].snippet.thumbnails.default.url,
            viewCount: response.data.items[i].statistics.viewCount,
            subCount: response.data.items[i].statistics.subscriberCount,
            videoCount: response.data.items[i].statistics.videoCount,
            publishedAt: response.data.items[i].snippet.publishedAt,
            createdAt: moment(),
            country: response.data.items[i].snippet.country,
            category: 'default',
        });
        await channel.save();
    }
    // 각 채널에 해당하는 동영상 정보 조회 및 저장
    channel_list = await Channel.find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
    // 동영상 id 조회
    for(i = 0 ; i < channel_list.length ; i++) {
        video_ids = [];
        video_id_params = {
            key : "AIzaSyAqLZxZPmuOd1iuAMf_GsiV1zzQvcW5zqY",
            part: "id",
            channelId: channel_list[i].id,
            publishedAfter: "2019-10-01T00:00:00.000Z",
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
        // 동영상 상세 정보 조회
        j = 0;
        do
        {
            sub_video_ids = video_ids.slice((50 * j), (50 * (j+1)));
            j++;
            res_data = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key : "AIzaSyAqLZxZPmuOd1iuAMf_GsiV1zzQvcW5zqY",
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
        }while(Math.ceil(video_ids.length / 50) > j)
    }
    for(i = 0 ; i < channel_list.length ; i++) {
        video_list = await Video.find({channel: channel_list[i]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
        video_list.sort((a,b) => (a.viewCount > b.viewCount) ? -1 : ( (b.viewCount > a.viewCount) ? 1 : 0));
        for(j = 0 ; j < video_list.length ; j++) {
            weekly_viewCount += video_list[i].viewCount;
            weekly_likeCount += video_list[i].likeCount;
            weekly_dislikeCount += video_list[i].dislikeCount;
            weekly_commentCount += video_list[i].commentCount;
        }
        VF_index = weekly_viewCount / video_list.length + video_list[0].viewCount;
        VE_index = (weekly_likeCount / (weekly_likeCount + weekly_dislikeCount)) * 100;
        VC_index = (weekly_commentCount / channel_list[i].subCount) * 100;
        BC_index = VF_index + ((0.04 * weekly_viewCount) * VE_index / 100)+((0.005 * weekly_viewCount) * VC_index / 100);

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