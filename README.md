# BSP - Employee Portal

>Banking System Prototype aka BSP is a initiative to make a change in Sri Lankas current banking facilities.

### System Overview

Employee Portal is a Feature Rich Alternative for existing Banking Portals. A good UI is hard to find in the current Bank System and this promises to change it.

### Technologies Used

* Node.js      
* Express.js
* Passport.js
* Pusher
* CanvasJS
* Nodemailer
* Bcrypt

### Steps To Run

1. Install the modules.
```bash
npm install
```
2. Simply Run the App.
```bash
npm start
```

### Sample Codings

When creating a project in MEAN lot of us get lost not knowing how to achive a task.

This is my good will of show casing places we can all improve.

#### Mail Sending Through Node Apps

```javascript
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
                                        port: keys.smtpPort,
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
                                        from: `"BSP" <${keys.smtpUser}>`, // sender address
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
``` 

### Tasks To Achive

* [x] Protect Routes
* [x] Optimized Local Strategy
* [x] Pusher Intergration
* [ ] Pusher problem solve
