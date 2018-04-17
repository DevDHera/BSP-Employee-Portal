const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

//Load Approval Model
require('../models/Approval');
const Approval = mongoose.model('approvals');


//Approval Inedx Route
router.get('/', ensureAuthenticated, (req, res) => {
    Approval.find({})
        .sort({date: 'desc'})
        .populate('user')
        .then(approvals => {
            res.render('approvals/index', {
                approvals: approvals
            });
        })
    
});


//Add Approval Route
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('approvals/add');
});

//Approvals Modal Post
router.post('/add', ensureAuthenticated, (req, res) => {
    let errors = [];

    if(!req.body.approvalTitle){
        errors.push({text: 'Please add a title'});
    }
    if(!req.body.body){
        errors.push({text: 'Please add content'});
    }

    if(errors.length>0){
        res.render('/', {
            errors: errors,            
        });
    }else{
        const newApproval = {
            title: req.body.approvalTitle,
            category: req.body.approvalCategory,
            details: req.body.body,
            user: req.user.id
        }
        new Approval(newApproval)
            .save()
            .then(approval => {
                req.flash('success_msg', 'Approval Added :)');
                res.redirect('/');
            })
    }

    
});

module.exports = router;