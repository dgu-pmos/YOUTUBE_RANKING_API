const mongoose = require('mongoose');
require('dotenv').config();

// 접근할 몽고디비의 정보들을 .env로부터 갖고온다.
const {
    MONGO_ID,
    MONGO_PASSWORD,
    NODE_ENV
} = process.env;
// 접근할 몽고디비 URL
const MONGO_URL = `mongodb+srv://${MONGO_ID}:${MONGO_PASSWORD}@youtube-cluster-zmd4o.gcp.mongodb.net/test?retryWrites=true&w=majority`;

module.exports = () => {
    // connect 함수는 데이터베이스(youtube_test)와 연결한다.
    const connect = () => {
        if (NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }
        mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'youtube',
        }, (error) => {
            if (error) {
                console.log('몽고디비 연결 에러', error);
            } else {
                console.log('몽고디비 연결 성공');
            }
        });
    };

    connect();

    mongoose.connection.on('error', (error) => {
        console.error('몽고디비 연결 에러', error);
    });
    mongoose.connection.on('disconnected', () => {
        console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
        // connect();
    });

    require('./channel');
    require('./video');
};
