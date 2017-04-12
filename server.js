require('dotenv-safe').load();

const bodyParser = require('body-parser');
const connectEnsureLogin = require('connect-ensure-login');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressSession = require('express-session');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');
const Strategy = require('passport-auth0');

passport.use(new Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL
}, (accessToken, refreshToken, extraParams, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'jade');

app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressSession({
    secret: 'super-secret',
    resave: true,
    saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        env: {
            AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
            AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
            AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL
        }
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/callback', passport.authenticate('auth0'), (req, res) => {
    res.redirect(req.session.returnTo || '/user');
});

app.get('/user', connectEnsureLogin.ensureLoggedIn('/'), (req, res) => {
    res.render('user', {
        user: req.user
    });
});

app.listen(3000);
console.log('Listening on http://localhost:3000');