const fs = require('fs');
const path = require('path');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');
const User = require('./models/User');

const app = express();
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0-uegii.mongodb.net/${process.env.MONGODB_DEFAULT_DATABASE}`;

const store = new MongoDbStore({ 
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

// const privetKey = fs.readFileSync('server.key');
// const cerificate = fs.readFileSync('server.cert');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }  
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage, fileFilter }).single('image'));

app.use(express.static('public'));
app.use('/images', express.static('images'));

app.use(session({ secret: 'node-course', resave: false, saveUninitialized: false, store }));
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;  
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      
      req.user = user;
      next();
    })        
    .catch(err => {
      next(new Error(err));
    });
});

app.post('/create-order', isAuth, shopController.postOrders);

app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...)
  // res.redirect('/500');
  res.status(500).render("500", { 
    pageTitle: "Error", 
    path: "/500",
    isAuthenticated: true
  });
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);

mongoose.connect(MONGODB_URI)
  .then(result => {
    // https.createServer({ key: privetKey, cert: cerificate }, app).listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
    console.log('CONNECTED!');
  })
  .catch(err => {
    console.log(err);
  });