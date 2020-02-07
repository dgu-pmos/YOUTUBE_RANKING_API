const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const channelSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    channel_name: {
        type: String,
        required: true,
    },
    img : {
        type: String,
        required: true,
    },
    viewCount : {
        type: Number,
        required: true,
    },
    subCount : {
        type: Number,
        required: true,
    },
    videoCount : {
        type: Number,
        required: true,
    },
    publishedAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    first_index: {
        type: Number,
        required: false,
    },
    second_index: {
        type: Number,
        required: false,
    },
    third_index: {
        type: Number,
        required: false,
    },
    fourth_index: {
        type: Number,
        required: false,
    },
});

module.exports = mongoose.model('Channel', channelSchema);
