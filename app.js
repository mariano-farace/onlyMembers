var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
var User = require('./models/user');
const session = require("express-session");
const mongoose = require("mongoose");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const bcrypt = require("bcryptjs");
var flash = require('connect-flash');


//TODO Cambiar la base de datos a una que sirva para produccion
//TODO confirmPasspord field
//TODO sanitaze data: en el sign up, pedir un mail valido, desde el fron o back????
//TODO add validation to the models, ver en onenote "validation"
//TODO cambiar la date a un formato que corresponda
const mongoDb = "mongodb+srv://testmariano:testmarianol@cluster0.kyzvi.mongodb.net/onlyMembers?retryWrites=true";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

var app = express();

// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({ secret: "cats", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());

//Function one : setting up the LocalStrategy
passport.use(
    new LocalStrategy((username, password, done) => {


        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            };
            if (!user) {
                console.log("Incorrect username");
                return done(null, false, { message: "Incorrect username" });

            }

            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    // passwords match! log user in
                    console.log("Si pudiste logearte!!");
                    return done(null, user)
                } else {
                    // passwords do not match!
                    console.log("Incorrect password");
                    return done(null, false, { message: "Incorrect password" })
                }
            })
        });
    })
);


//Serialization
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});






module.exports = app;