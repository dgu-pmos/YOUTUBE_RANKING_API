const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const userSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    pw: {
        type: String,
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('User', userSchema);
