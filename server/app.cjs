var path = require("path");
var express = require("express");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var bcrypt = require("bcrypt");
var bodyParser = require("body-parser");
var puzzleApi = require("./api/puzzle.cjs");
var upload = require("./api/upload.cjs");
var createAccount = require("./api/create-account.cjs");
var users = require("./api/users.cjs");
const ObjectID = require("mongodb").ObjectID;
var sessionController = require("./api/session.cjs");
var uploadPuzzleSprite = require("./api/uploadPuzzleSprite.cjs");
var makePuzzleImage = require("./api/makePuzzleImage.cjs");
var generatorTest = require("./api/generator-test.cjs");
// const { connUrl, dbName } = require("./database.cjs");
var app = express();
// var MongoDBStore = require('connect-mongodb-session')(session);
const dbClient = require('./database.cjs').default;

require("dotenv").config();

app.use(
  bodyParser.urlencoded({
    uploadDir: path.join(__dirname, "uploads"),
    keepExtensions: true,
    extended: true,
    limit: "50mb",
  })
);

app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {},
}));

passport.serializeUser((user, done) => {
  return done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
  try {
    const conn = await dbClient.connect();
    const db = conn.db("puzzly");
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (user) {
      return done(null, user);
    }

    return done(null, false)
  } catch (err) {
    return done(err);
  }
});

passport.use(new LocalStrategy(async function verify(username, password, next) {
  try {
    const conn = await dbClient.connect();
    const db = conn.db("puzzly");
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) return next(null, user);
    } else {
      return next(null, false);
    }
  } catch (err) {
    return next(err);
  }
}));

app.use(passport.session());

app.use("/uploads", express.static("./uploads"));
app.use("/uploads_integration", express.static("./uploads_integration"));
app.use("/common", express.static("./common"));

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

app.post('/login',
  function (req, res, next) {
    passport.authenticate('local', { successRedirect: "/user", failureRedirect: "/sdfsdf" })(req, res, next)
  });

app.get("/create-account", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/routes/create-account/create-account.html"));
});

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/routes/login/login.html"));
});

app.get("/user", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/index.html"));
})

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
