const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema
const TransactionSchema = new Schema({
    account: {
        type: Schema.Types.ObjectId,
        ref: 'customers'
    },
    transferaccount: {
        type: Schema.Types.ObjectId,
        ref: 'customers'
    },    
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
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

mongoose.model('transactions', TransactionSchema, 'transactions');