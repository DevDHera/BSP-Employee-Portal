const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../helpers/auth');
const nodemailer = require('nodemailer');

//Load Customer Model
require('../models/Customer');
const Customer = mongoose.model('customers');

//Load Transaction Model
require('../models/Transaction');
const Transaction = mongoose.model('transactions');

//Load Keys
const keys = require('../config/keys');

//Add Customer Route
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('customers/add');
});

//Post Customer
router.post('/add', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (isNaN(req.body.accountId)) {
        errors.push({ text: 'Account ID must be numeric' });
    }

    if (isNaN(req.body.contact)) {
        errors.push({ text: 'Contact Number Must be numeric' });
    }

    if (isNaN(req.body.nic)) {
        errors.push({ text: 'NIC is in wrong format' });
    }

    if (req.body.accountId.length < 10) {
        errors.push({ text: 'Account ID is Short' });
    }

    if (errors.length > 0) {
        res.render('customers/add', {
            errors: errors,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            accountid: req.body.accountId,
            nic: req.body.nic,
            email: req.body.email,
            contact: req.body.contact,
        });
    } else {
        Customer.findOne({ accountid: req.body.accountId })
            .then(customer => {
                if (customer) {
                    req.flash('error_msg', 'Account already registred');
                    res.redirect('/customers/add');
                } else {
                    let handle = req.body.firstName + '1234';
                    let password = req.body.firstName + '112233';
                    const newCustomer = new Customer({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        accountid: req.body.accountId,
                        handle: handle,
                        nic: req.body.nic,
                        email: req.body.email,
                        contact: req.body.contact,
                        password: password,
                        user: req.user.id
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newCustomer.password, salt, (err, hash) => {
                            if (err) throw err;
                            newCustomer.password = hash;
                            newCustomer.save()
                                .then(user => {
                                    req.flash('success_msg', 'New Customer Registred :)');
                                    const output = `
                                                    <p>Thank You for Opening a account in <b>BSP</b></p>
                                                    <h3>Your Online Presence is as follows</h3>
                                                    <ul>
                                                        <li>Name: ${req.body.firstName} ${req.body.lastName}</li>
                                                        <li>Handle: ${handle}</li>
                                                        <li>Email: ${password}</li>
                                                    </ul>
                                                    <h3>Important</h3>
                                                    <p>Please make sure to use <b>Handle</b> when you log in...</p>`;

                                    // create reusable transporter object using the default SMTP transport
                                    let transporter = nodemailer.createTransport({
                                        host: keys.smtpHost,
                                        port: 587,
                                        secure: false, // true for 465, false for other ports
                                        auth: {
                                            user: keys.smtpUser, // generated ethereal user
                                            pass: keys.smtpPass // generated ethereal password
                                        },
                                        tls: {
                                            //ciphers: 'SSLv3',
                                            rejectUnauthorized: false
                                        }
                                    });

                                    // setup email data with unicode symbols
                                    let mailOptions = {
                                        from: '"BSP" <kudcsd171f002@student.nibm.lk>', // sender address
                                        to: `${req.body.email}`, // list of receivers
                                        subject: 'BSP BANKING', // Subject line
                                        text: 'Welcome to BSP', // plain text body
                                        html: output // html body
                                    };

                                    // send mail with defined transport object
                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent: %s', info.messageId);
                                        // Preview only available when sending through an Ethereal account
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                                        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                                        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

                                        
                                        res.redirect('/');
                                    });
                                    })
                                        .catch(err => {
                                            console.log(err);
                                            return;
                                        })
                                });

                        });
                    }
            });
    }
});

//Search Customer Route
router.get('/search', ensureAuthenticated, (req, res) => {
    res.render('customers/search');
});

//Search Post 
router.post('/search', ensureAuthenticated, (req, res) => {
    let sum = 0;
    
    if(req.body.selectmethod == 'byname'){
        Customer.findOne({firstName: req.body.serachKey})
        .then(customer => {
            if(customer){                                
                Transaction.aggregate([
                    {$match:{
                        account: new mongoose.Types.ObjectId(customer.id),
                        type: 'deposit'
                    }
                    },                    
                    { $group: {
                        _id: null,
                        sum: { $sum: "$amount"  }
                    }}
                ], function (err, deposit) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    Transaction.aggregate([
                        {$match:{
                            account: new mongoose.Types.ObjectId(customer.id),
                            type: 'withdraw'
                        }
                        },
                        {$group: {
                            _id: null,
                            sum: {$sum: "$amount"}
                        }}                        
                    ], function(err, withdraw) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        Transaction.aggregate([
                            {$match:{
                                account: new mongoose.Types.ObjectId(customer.id),
                                type: 'transfer'
                            }
                            },
                            {$group: {
                                _id: null,
                                sum: {$sum: "$amount"}
                            }}                        
                        ], function(err, transfer) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            Transaction.aggregate([
                                {$match:{
                                    transferaccount: new mongoose.Types.ObjectId(customer.id),
                                    type: 'transfer'
                                }
                                },
                                {$group: {
                                    _id: null,
                                    sum: {$sum: "$amount"}
                                }}                        
                            ], function(err, trdepo) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                let depositSum = 0;
                                let transferSum = 0;
                                let withdrawSum = 0;
                                let trdepoSum = 0;
                                if(deposit.length>0){
                                    depositSum = deposit[sum].sum;
                                }
                                if(transfer.length>0){
                                    transferSum = transfer[sum].sum;
                                }
                                if(withdraw.length>0){
                                    withdrawSum = withdraw[sum].sum;
                                }
                                if(trdepo.length>0){
                                    trdepoSum = trdepo[sum].sum;
                                }
                                res.render('customers/search', {
                                    customer: customer,
                                    deposit: depositSum,
                                    transfer: transferSum,
                                    withdraw: withdrawSum,
                                    trdepo: trdepoSum,
                                    balance: depositSum - transferSum - withdrawSum + trdepoSum
                                })
                                /*if(deposit.length>0){
                                    if(withdraw.length>0){
                                        if(transfer.length>0){
                                            if(trdepo.length>0){
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: trdepo[sum].sum,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum + trdepo[sum].sum                                                     
                                                });
                                            }else{
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: 0,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum                                                     
                                                })
                                            }
                                        }else{
                                            res.render('customers/search', {
                                                customer: customer,
                                                deposit: deposit[sum].sum,
                                                withdraw: withdraw[sum].sum,
                                                transfer: 0,
                                                trdepo: 0,
                                                balance: deposit[sum].sum - withdraw[sum].sum                                                     
                                            })
                                        }
                                    }else{
                                        res.render('customers/search', {
                                            customer: customer,
                                            deposit: deposit[sum].sum,
                                            withdraw: 0,
                                            transfer: 0,
                                            trdepo: 0,
                                            balance: deposit[sum].sum
                                        })
                                    }
                                }else{
                                    res.render('customers/search', {
                                        customer: customer,
                                        deposit: 0,
                                        withdraw: 0,
                                        transfer: 0,
                                        trdepo: 0,
                                        balance: 0
                                    })
                                }*/

                            })
                        })
                    })
                })
                /*Transaction.find({account: customer.id})
                    .then(trans => {                        
                        trans.forEach((tran) => {
                            sum += tran.amount;
                            console.log(sum);
                            
                        },
                        res.render('customers/search', {
                            customer: customer,
                            sum: sum
                        }));
                });*/
            }else{
                req.flash('error_msg', 'No Customer Found');
                res.redirect('/customers/search');
            }
            
        });
    }
    if(req.body.selectmethod == 'byaccount'){
        Customer.findOne({accountid: req.body.serachKey})
        .then(customer => {
            if(customer){
                Transaction.aggregate([
                    {$match:{
                        account: new mongoose.Types.ObjectId(customer.id),
                        type: 'deposit'
                    }
                    },                    
                    { $group: {
                        _id: null,
                        sum: { $sum: "$amount"  }
                    }}
                ], function (err, deposit) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    Transaction.aggregate([
                        {$match:{
                            account: new mongoose.Types.ObjectId(customer.id),
                            type: 'withdraw'
                        }
                        },
                        {$group: {
                            _id: null,
                            sum: {$sum: "$amount"}
                        }}                        
                    ], function(err, withdraw) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        Transaction.aggregate([
                            {$match:{
                                account: new mongoose.Types.ObjectId(customer.id),
                                type: 'transfer'
                            }
                            },
                            {$group: {
                                _id: null,
                                sum: {$sum: "$amount"}
                            }}                        
                        ], function(err, transfer) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            Transaction.aggregate([
                                {$match:{
                                    transferaccount: new mongoose.Types.ObjectId(customer.id),
                                    type: 'transfer'
                                }
                                },
                                {$group: {
                                    _id: null,
                                    sum: {$sum: "$amount"}
                                }}                        
                            ], function(err, trdepo) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                let depositSum = 0;
                                let transferSum = 0;
                                let withdrawSum = 0;
                                let trdepoSum = 0;
                                if(deposit.length>0){
                                    depositSum = deposit[sum].sum;
                                }
                                if(transfer.length>0){
                                    transferSum = transfer[sum].sum;
                                }
                                if(withdraw.length>0){
                                    withdrawSum = withdraw[sum].sum;
                                }
                                if(trdepo.length>0){
                                    trdepoSum = trdepo[sum].sum;
                                }
                                res.render('customers/search', {
                                    customer: customer,
                                    deposit: depositSum,
                                    transfer: transferSum,
                                    withdraw: withdrawSum,
                                    trdepo: trdepoSum,
                                    balance: depositSum - transferSum - withdrawSum + trdepoSum
                                })
                                /*if(deposit.length>0){
                                    if(withdraw.length>0){
                                        if(transfer.length>0){
                                            if(trdepo.length>0){
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: trdepo[sum].sum,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum + trdepo[sum].sum                                                     
                                                });
                                            }else{
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: 0,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum                                                     
                                                })
                                            }
                                        }else{
                                            res.render('customers/search', {
                                                customer: customer,
                                                deposit: deposit[sum].sum,
                                                withdraw: withdraw[sum].sum,
                                                transfer: 0,
                                                trdepo: 0,
                                                balance: deposit[sum].sum - withdraw[sum].sum                                                     
                                            })
                                        }
                                    }else{
                                        res.render('customers/search', {
                                            customer: customer,
                                            deposit: deposit[sum].sum,
                                            withdraw: 0,
                                            transfer: 0,
                                            trdepo: 0,
                                            balance: deposit[sum].sum
                                        })
                                    }
                                }else{
                                    res.render('customers/search', {
                                        customer: customer,
                                        deposit: 0,
                                        withdraw: 0,
                                        transfer: 0,
                                        trdepo: 0,
                                        balance: 0
                                    })
                                }*/

                            })
                        })
                    })
                })
                /*Transaction.find({account: customer.id})
                    .then(trans => {                        
                        trans.forEach((tran) => {
                            sum += tran.amount;
                            console.log(sum);
                            
                        },
                        res.render('customers/search', {
                            customer: customer,
                            sum: sum
                        }));
                });*/
            }else{
                req.flash('error_msg', 'No Customer Found');
                res.redirect('/customers/search');
            }
            
        });
    }
    
    if(req.body.selectmethod == 'bynic'){
        Customer.findOne({nic: req.body.serachKey})
        .then(customer => {
            if(customer){   
                /*Transaction.find({account: customer.id})
                    .then(trans => {
                        trans.agge
                        Transaction.ag
                    }) */
                Transaction.aggregate([
                    {$match:{
                        account: new mongoose.Types.ObjectId(customer.id),
                        type: 'deposit'
                    }
                    },                    
                    { $group: {
                        _id: null,
                        sum: { $sum: "$amount"  }
                    }}
                ], function (err, deposit) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    Transaction.aggregate([
                        {$match:{
                            account: new mongoose.Types.ObjectId(customer.id),
                            type: 'withdraw'
                        }
                        },
                        {$group: {
                            _id: null,
                            sum: {$sum: "$amount"}
                        }}                        
                    ], function(err, withdraw) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        Transaction.aggregate([
                            {$match:{
                                account: new mongoose.Types.ObjectId(customer.id),
                                type: 'transfer'
                            }
                            },
                            {$group: {
                                _id: null,
                                sum: {$sum: "$amount"}
                            }}                        
                        ], function(err, transfer) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            Transaction.aggregate([
                                {$match:{
                                    transferaccount: new mongoose.Types.ObjectId(customer.id),
                                    type: 'transfer'
                                }
                                },
                                {$group: {
                                    _id: null,
                                    sum: {$sum: "$amount"}
                                }}                        
                            ], function(err, trdepo) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                let depositSum = 0;
                                let transferSum = 0;
                                let withdrawSum = 0;
                                let trdepoSum = 0;
                                if(deposit.length>0){
                                    depositSum = deposit[sum].sum;
                                }
                                if(transfer.length>0){
                                    transferSum = transfer[sum].sum;
                                }
                                if(withdraw.length>0){
                                    withdrawSum = withdraw[sum].sum;
                                }
                                if(trdepo.length>0){
                                    trdepoSum = trdepo[sum].sum;
                                }
                                res.render('customers/search', {
                                    customer: customer,
                                    deposit: depositSum,
                                    transfer: transferSum,
                                    withdraw: withdrawSum,
                                    trdepo: trdepoSum,
                                    balance: depositSum - transferSum - withdrawSum + trdepoSum
                                })

                                /*if(deposit.length>0){
                                    if(withdraw.length>0){
                                        if(transfer.length>0){
                                            if(trdepo.length>0){
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: trdepo[sum].sum,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum + trdepo[sum].sum                                                     
                                                });
                                            }else{
                                                res.render('customers/search', {
                                                    customer: customer,
                                                    deposit: deposit[sum].sum,
                                                    withdraw: withdraw[sum].sum,
                                                    transfer: transfer[sum].sum,
                                                    trdepo: 0,
                                                    balance: deposit[sum].sum - withdraw[sum].sum - transfer[sum].sum                                                     
                                                })
                                            }
                                        }else{
                                            res.render('customers/search', {
                                                customer: customer,
                                                deposit: deposit[sum].sum,
                                                withdraw: withdraw[sum].sum,
                                                transfer: 0,
                                                trdepo: 0,
                                                balance: deposit[sum].sum - withdraw[sum].sum                                                     
                                            })
                                        }
                                    }else{
                                        res.render('customers/search', {
                                            customer: customer,
                                            deposit: deposit[sum].sum,
                                            withdraw: 0,
                                            transfer: 0,
                                            trdepo: 0,
                                            balance: deposit[sum].sum
                                        })
                                    }
                                }else{
                                    res.render('customers/search', {
                                        customer: customer,
                                        deposit: 0,
                                        withdraw: 0,
                                        transfer: 0,
                                        trdepo: 0,
                                        balance: 0
                                    })
                                }*/

                            })
                        })
                    })
                })
                /*Transaction.find({account: customer.id})
                    .then(trans => {                        
                        trans.forEach((tran) => {
                            sum += tran.amount;
                            console.log(sum);
                            
                        },
                        res.render('customers/search', {
                            customer: customer,
                            sum: sum
                        }));
                });*/
            }else{
                req.flash('error_msg', 'No Customer Found');
                res.redirect('/customers/search');
            }
            
        });
    }

    
})

module.exports = router;
