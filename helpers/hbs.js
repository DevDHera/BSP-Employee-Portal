const mongoose = require('mongoose');
const moment = require('moment');

//Load User Model
require('../models/User');
const User = mongoose.model('users');

module.exports = {
    editNavEmployee: function(role){
        if(role == 'superadmin' || role == 'admin'){
            return `<li>
                    <a class="dropdown-trigger" href="#!" data-activates="employees">Employees
                    <i class="material-icons right">arrow_drop_down</i>
                    </a>
                    </li>`
        }else{
            return '';
        }
    },
    editSideEmployee: function(role){
        if(role == 'superadmin' || role == 'admin'){
            return `<li>
                    <a href="/users/register">Employees</a>
                    </li>`
        }else{
            return '';
        }
    },
    editJobRole: function(role){
        if(role == 'superadmin'){
            return `<option value="superadmin" selected>Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="executiveofficer">Executive Officer</option>`
        }else{
            return `<option value="manager">Manager</option>
                    <option value="executiveofficer">Executive Officer</option>`
        }
    },
    formatDate: function(date, format){
        return  moment(date).format(format);
    },
    transferAcc: function(tMethod){
        if(tMethod == 'transfer'){
            return `<div class="input-field">
                        <input type="text" name="tranaccountid" required>
                        <label for="accountid">Transfer Account</label>
                    </div>`
        }else{
            return '';
        }
        
    }
}