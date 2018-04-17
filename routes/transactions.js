const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

//Load Approval Model
require('../models/Transaction');
const Transaction = mongoose.model('transactions');

require('../models/Customer');
const Customer = mongoose.model('customers');


//Add Transaction Route
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('transactions/add');
});

//Past Transaction Route
router.get('/past', ensureAuthenticated, (req, res) => {
    Transaction.find()
        .sort({date: 'desc'})
        .populate('user')
        .then(transactions => {
            if(transactions){
                res.render('transactions/past', {
                    transactions: transactions
                });
            }
        })
    
});

//Add Post Transaction
router.post('/add', ensureAuthenticated, (req, res) => {
    let errors = [];
    let sum = 0;

    if(!req.body.accountid){
        errors.push({text: 'Please add a Account ID'});
    }
    
    if(!req.body.amount){
        errors.push({text: 'Please add a Amount'});
    }

    if(isNaN(req.body.accountid)){
        errors.push({text: 'Account ID must be Numeric'});
    }

    if(isNaN(req.body.amount)){
        errors.push({text: 'Amount format is wrong'});
    }

    if(req.body.tranMethod == 'transfer'){
        if(!req.body.transaccount){
            errors.push({text: 'Please Add a Transfer Account'});
        }

        if(isNaN(req.body.transaccount)){
            errors.push({text: 'Transfer Account ID must be Numeric'});
        }
    }

    if(errors.length>0){
        res.render('transactions/add', {
            errors: errors,
            accountid: req.body.accountid,
            tranMethod: req.body.tranMethod,
            amount: req.body.amount,
            transaccount: req.body.transaccount            
        });
    }else if(req.body.tranMethod == 'withdraw'){
        Customer.findOne({accountid: req.body.accountid})
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
                                    let balance = 0;
                                    
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

                                    balance = depositSum-transferSum-withdrawSum+trdepoSum
                                    if(balance-req.body.amount>500){
                                        const  newTransaction= {
                                            account: customer.id,
                                            type: req.body.tranMethod,
                                            amount: req.body.amount,
                                            user: req.user.id                        
                                        }
                                        new Transaction(newTransaction)
                                            .save()
                                            .then(transaction => {
                                                //Customer.update({accountid: req.body.accountid},{$set:{transaction: transaction.id}});
                                                req.flash('success_msg', 'Transaction Completed :)');
                                                res.redirect('/');
                                        });
                                    }else{
                                        req.flash('error_msg', 'No Money.. Duka Tma.... :(');
                                        res.redirect('add','/transactions/add', {
                                            accountid: req.body.accountid,
                                            tranMethod: req.body.tranMethod,
                                            amount: req.body.amount,
                                            transaccount: req.body.transaccount                
                                        });
                                    }
                                })
                            })
                        })
                    })
                    
                }else{
                    req.flash('error_msg', 'Account ID Mismatch :(');
                    res.redirect('add','/transactions/add', {
                        accountid: req.body.accountid,
                        tranMethod: req.body.tranMethod,
                        amount: req.body.amount,
                        transaccount: req.body.transaccount                
                    });
                }
            });        
    }else if(req.body.tranMethod == 'transfer'){
        Customer.findOne({accountid: req.body.accountid})
            .then(customer => {
                if(customer){
                    Customer.findOne({accountid: req.body.transaccount})
                        .then(transcustomer => {
                            if(transcustomer){
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
                                                let balance = 0;
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
            
                                                balance = depositSum-transferSum-withdrawSum+trdepoSum
                                                if(balance-req.body.amount>500){
                                                    const  newTransaction= {
                                                        account: customer.id,
                                                        transferaccount: transcustomer.id,
                                                        type: req.body.tranMethod,
                                                        amount: req.body.amount,
                                                        user: req.user.id                        
                                                    }
                                                    new Transaction(newTransaction)
                                                        .save()
                                                        .then(transaction => {
                                                            //Customer.update({accountid: req.body.accountid},{$set:{transaction: transaction.id}});
                                                            req.flash('success_msg', 'Transaction Completed :)');
                                                            res.redirect('/');
                                                    });
                                                }else{
                                                    req.flash('error_msg', 'No Money.. Duka Tma.... :(');
                                                    res.redirect('add','/transactions/add', {
                                                        accountid: req.body.accountid,
                                                        tranMethod: req.body.tranMethod,
                                                        amount: req.body.amount,
                                                        transaccount: req.body.transaccount                
                                                    });
                                                }
                                            })
                                        })
                                    })
                                })
                            }else{
                                req.flash('error_msg', 'Transfer Account ID Mismatch :(');
                                res.redirect('add','/transactions/add', {
                                    accountid: req.body.accountid,
                                    tranMethod: req.body.tranMethod,
                                    amount: req.body.amount,
                                    transaccount: req.body.transaccount                
                                });
                            }
                        })
                }else{
                    req.flash('error_msg', 'Account ID Mismatch :(');
                    res.redirect('add','/transactions/add', {
                        accountid: req.body.accountid,
                        tranMethod: req.body.tranMethod,
                        amount: req.body.amount,
                        transaccount: req.body.transaccount                
                    });
                }
            });
    }else{
        Customer.findOne({accountid: req.body.accountid})
            .then(customer => {
                if(customer){
                    const  newTransaction= {
                        account: customer.id,
                        type: req.body.tranMethod,
                        amount: req.body.amount,
                        user: req.user.id                        
                    }
                    new Transaction(newTransaction)
                        .save()
                        .then(transaction => {
                            //Customer.update({accountid: req.body.accountid},{$set:{transaction: transaction.id}});
                            req.flash('success_msg', 'Transaction Completed :)');
                            res.redirect('/');
                    });
                }else{
                    req.flash('error_msg', 'Account ID Mismatch :(');
                    res.redirect('add','/transactions/add', {
                        accountid: req.body.accountid,
                        tranMethod: req.body.tranMethod,
                        amount: req.body.amount,
                        transaccount: req.body.transaccount                
                    });
                }
            });        
    }
});

module.exports = router;