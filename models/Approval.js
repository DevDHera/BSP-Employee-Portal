const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema
const ApprovalSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    date: {
        type: Date,
        default: Date.now
    }    
});

mongoose.model('approvals', ApprovalSchema, 'approvals');