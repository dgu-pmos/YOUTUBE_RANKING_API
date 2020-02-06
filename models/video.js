const mongoose = require('mongoose');

const {
    Schema
} = mongoose;
const {
    Types: {
        ObjectId
    }
} = Schema;

const videoSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    channel: {
        type: ObjectId,
        required: true,
        ref: 'Channel',
    },
    video_name: {
        type: String,
        required: true,
    },
    viewCount: {
        type: Number,
        required: true,
    },
    likeCount: {
        type: Number,
        required: true,
    },
    dislikeCount: {
        type: Number,
        required: true,
    },
    commentCount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('Video', videoSchema);
