const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema
const CustomerSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },    
    accountid: {
        type: Number,
        required: true
    },
    handle: {
        type: String,
        required: true
    },
    nic: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },    
    contact: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    card: [{
        cardType: {
            type: String,
            required: true
        },
        cardBrand: {
            type: String,
            required: true
        },
        cardNumber: {
            type: String,
            required: true
        }
    }],        
    transaction: {
        type: Schema.Types.ObjectId,
        ref: 'transactions'
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

mongoose.model('customers', CustomerSchema, 'customers');