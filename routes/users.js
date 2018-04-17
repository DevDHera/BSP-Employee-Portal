const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../helpers/auth');

//Load User Model
require('../models/User');
const User = mongoose.model('users');

//User Log Route
router.get('/userlog', ensureAuthenticated, (req, res) => {
    res.render('users/userlog');
});

//UserLog Add Login time
router.post('/userlog/time', (req, res) => {
    res.send('Ok');
})

//Login Route
router.get('/login', (req, res) => {
    res.render('users/login');
});

//Login Post Route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//Register User Route
router.get('/register', ensureAuthenticated, (req, res) => {
    if(req.user.role == 'superadmin' || req.user.role == 'admin'){
        res.render('users/register');
    }else{        
        req.flash('error_msg', 'You have no Privilages');
        res.redirect('/');
    }
    
});

//Register Form Post
router.post('/register', ensureAuthenticated, (req, res) => {
    let errors = [];   

    if(req.body.password.length<4){
        errors.push({text: 'Password must be at least 4 characters'});
    }

    if(errors.length>0){
        res.render('users/register', {
            errors: errors,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            role: req.body.role,
            contact: req.body.contact,
            password: req.body.password,            
        });
    }else{
        User.findOne({email: req.body.email})
            .then(user => {
                if(user){
                    req.flash('error_msg', 'Email already registred');
                    res.redirect('/users/register');
                }else{
                    const newUser = new User({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        role: req.body.role,
                        contact: req.body.contact,
                        password: req.body.password,            
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'New User Registred :)');
                                    res.redirect('/');
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

//Logout User
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'User Logout Successfully');
    res.redirect('/users/login');
});

//Add Todo
router.post('/todo', ensureAuthenticated, (req, res) => {
    User.findOne({
        _id: req.user.id
    })
    .then(user => {
        const newToDo = {
            todoBody: req.body.todoBody
        }

        //Push to Todo Array
        user.todos.unshift(newToDo);
        user.save()
            .then(user => {
                res.redirect('/');
            });
    });
});

//Delete Todo
router.delete('/todo/:id', (req, res) => {    
    User.update({},{$pull:{todos:{_id: req.params.id}}},{multi:true})
        .then(() => {
            res.redirect('/');
        });
});

module.exports = router;
