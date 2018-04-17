const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
//const User = mongoose.model('users');
const { ensureAuthenticated } = require('./helpers/auth');

const app = express();

//Load Routes
const users = require('./routes/users');
const approvals = require('./routes/approvals');
const customers = require('./routes/customers');
const transactions = require('./routes/transactions');

//Load User Model
require('./models/User');
const User = mongoose.model('users');

require('./models/Approval');
const Approval = mongoose.model('approvals');

require('./models/UserLog');
const UserLog = mongoose.model('userlogs');

require('./models/Customer');
const Customer = mongoose.model('customers');

require('./models/Transaction');
const Transaction = mongoose.model('transactions');

//Passport Config
require('./config/passport')(passport);

//Load Keys
const keys = require('./config/keys');

//Handlebars Helpers
const {
    editNavEmployee, 
    editSideEmployee,
    editJobRole,
    formatDate,
    transferAcc
} = require('./helpers/hbs');


//Map Global Promises
mongoose.Promise = global.Promise;

//Connect To Mongoose
mongoose.connect(keys.mongoURI, {

})
    .then(() => console.log('MogoDB Connected'))
    .catch(err => console.log(err));

//Handlebars Middleware
app.engine('handlebars', exphbs({
    helpers: {
        editNavEmployee: editNavEmployee,
        editSideEmployee: editSideEmployee,
        editJobRole: editJobRole,
        formatDate: formatDate,
        transferAcc: transferAcc
    },
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//Body Parser Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Method Override Middleware
app.use(methodOverride('_method'));

//Express Session Middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,    
}));

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect-Flash Middleware
app.use(flash());

//Global Variables
app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;    
    next();
})

//Static Folder
app.use(express.static(path.join(__dirname, 'public')));



//Index Route
app.get('/', ensureAuthenticated, (req, res) => {
    //const userCount = '';

    User.find().count()
        .then(userCount => {
            Approval.find().count()
                .then(approvalCount => {
                    Approval.find({})
                        .populate('user')
                        .then(approval => {
                            Customer.find().count()
                                .then(customerCount => {
                                    Transaction.find().count()
                                        .then(tranCount => {
                                            Transaction.find()
                                                .sort({date: 'desc'})
                                                .limit(3)
                                                .then(transactionGrid => {
                                                    res.render('index', {
                                                        approval: approval,
                                                        userCount: userCount,
                                                        approvalCount: approvalCount,
                                                        customerCount: customerCount,
                                                        tranCount: tranCount,
                                                        transactionGrid: transactionGrid
                                                    });
                                                })                                            
                                        })
                                    
                                });
                        });                    
                });          
    });
});

//Use Routes
app.use('/users', users);
app.use('/approvals', approvals);
app.use('/customers', customers);
app.use('/transactions', transactions);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);     
});