var path = require("path");
var express = require("express");
var session = require("express-session");
var passport = require("passport");
var Auth0Strategy = require("passport-auth0");
var bodyParser = require("body-parser");
var puzzleApi = require("./api/puzzle.cjs");
var upload = require("./api/upload.cjs");
var createAccount = require("./api/create-account.cjs");
var users = require("./api/users.cjs");
var sessionController = require("./api/session.cjs");
var uploadPuzzleSprite = require("./api/uploadPuzzleSprite.cjs");
var makePuzzleImage = require("./api/makePuzzleImage.cjs");
var generatorTest = require("./api/generator-test.cjs");
// const { connUrl, dbName } = require("./database.cjs");
var app = express();
// var MongoDBStore = require('connect-mongodb-session')(session);
const dbClient = require('./database.cjs').default;

require("dotenv").config();

const authRouter = require("./api/auth.cjs")

// const store = new MongoDBStore({
//   uri: connUrl,
//   databaseName: dbName,
//   collection: "sessions"
// });

if (app.get("env") === "production") {
  session.cookie.secure = true;
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {},
}));

const strategy = new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: process.env.AUTH0_CALLBACK_URL,
}, async function (accessToken, refreshToken, extraParams, profile, done) {
  console.log("Auth0 callback", profile);

  return dbClient.connect().then(async (client, err) => {
    const db = client.db("puzzly");
    const usersCollection = db.collection("users");
    let user;

    const existingUser = await usersCollection.findOne({ id: profile.id });
    console.log("existing user result", user);

    if (!existingUser) {
      user = { id: profile.id, username: profile.displayName }
      await usersCollection.insertOne(user);
    } else {
      user = existingUser;
    }

    return done(null, user);
  }).catch(err => {
    console.log(err)
  });

});

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  dbClient.connect().then(async (client, err) => {
    const db = client.db("puzzly");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ id: id });

    if (user) {
      done(null, user);
    }
  }).catch(err => {
    console.log(err)
  });
});

app.use("/", authRouter);

app.use("/uploads", express.static("./uploads"));
app.use("/uploads_integration", express.static("./uploads_integration"));
app.use("/common", express.static("./common"));

app.use(
  bodyParser.urlencoded({
    uploadDir: path.join(__dirname, "uploads"),
    keepExtensions: true,
    extended: true,
    limit: "50mb",
  })
);

app.use(bodyParser.json({ limit: "50mb" }));

// Configure API endpoints
app.use("/api/puzzle", puzzleApi.router);
app.use("/api/upload", upload);
app.use("/api/users", users);
app.use("/api/create-account", createAccount);
app.use("/api/session", sessionController);
app.use("/api/uploadPuzzleSprite", uploadPuzzleSprite);
app.use("/api/makePuzzleImage", makePuzzleImage);
app.use("/api/generator-test", generatorTest);
app.use("/api/toggleVisibility", require("./api/pieceFiltering.cjs"));

const secured = (req, res, next) => {
  if (req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/login");
};

app.get("/user", secured, (req, res) => {
  console.log("request user object", req.user)
});

// Configure base URL for home page
// app.get("/", function (req, res) {
//   console.info("GET request: '/'");
//   if (req.session) {
//     res.sendFile(path.join(__dirname, "../client/index.html"));
//   } else {
//     res.sendFile(path.join(__dirname, "../client/routes/login/login.html"));
//   }
// });

// app.get("/create-account", function (req, res) {
//   res.sendFile(path.join(__dirname, "../client/routes/create-account/create-account.html"));
// });

app.get("/gallery", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/puzzleGallery.html"));
});

app.get("/exp", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/experiment.html"));
});

app.get("/removeAll", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/removeAll.html"));
});

app.get("/unsolvePiece", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/unsolvePiece.html"));
});

app.get("/new", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/new.html"));
});

app.get("/puzzle-piece", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/puzzle-piece.html"));
});

app.get("/generator", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/generator-test.html"));
});

app.get("/test", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/path-test.html"));
});

app.use(
  express.static(process?.ENV?.mode === "production" ? "./dist" : "./client")
);

module.exports = app;
