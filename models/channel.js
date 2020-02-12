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
        required: false,
    },
    category: {
        type: String,
        required: false,
    },
    VF_index: {
        type: Number,
        required: false,
    },
    VE_index: {
        type: Number,
        required: false,
    },
    VC_index: {
        type: Number,
        required: false,
    },
    BC_index: {
        type: Number,
        required: false,
    },
    VF_rank: {
        type: Number,
        required: false,
    },
    VE_rank: {
        type: Number,
        required: false,
    },
    VC_rank: {
        type: Number,
        required: false,
    },
    BC_rank: {
        type: Number,
        required: false,
    },
});

module.exports = mongoose.model('Channel', channelSchema);
