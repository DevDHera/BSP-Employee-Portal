const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    logontime: {
        type: Date,
        default: Date.now
    }    
});

mongoose.model('userlogs', UserLogSchema, 'userlogs');