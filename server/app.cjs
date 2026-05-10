var path = require("path");
var express = require("express");
var session = require("express-session");
var MongoDBStore = require('connect-mongodb-session')(session);
var bodyParser = require("body-parser");
var puzzleApi = require("./api/puzzle.cjs");
var upload = require("./api/upload.cjs");
var createAccount = require("./api/create-account.cjs");
var users = require("./api/users.cjs");
var login = require("./api/login.cjs");
var uploadPuzzleSprite = require("./api/uploadPuzzleSprite.cjs");
var makePuzzleImage = require("./api/makePuzzleImage.cjs");
var generatorTest = require("./api/generator-test.cjs");
var bcrypt = require("bcrypt");
const { dbUrl } = require('./database.cjs');
const cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());

console.log("dbUrl", dbUrl)
const store = new MongoDBStore({
  uri: dbUrl,
  databaseName: 'puzzly',
  collection: 'sessions',
}, function(error) {
  console.error(error);
});

store.on('error', function(error) {
  console.log(error);
});

app.use(session({
  secret: 'Elizas secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true },
  store,
}));

app.use(
  "/",
  express.static(process?.ENV?.mode === "production" ? "./dist" : "./client")
);
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
app.use("/api/login", login);
app.use("/api/uploadPuzzleSprite", uploadPuzzleSprite);
app.use("/api/makePuzzleImage", makePuzzleImage);
app.use("/api/generator-test", generatorTest);
app.use("/api/toggleVisibility", require("./api/pieceFiltering.cjs"));

// Configure base URL for home page
app.get("/", function (req, res) {
  if(!req.session.isAuth){
    res.redirect("/login");
  } else {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  }
});

app.get("/create-account", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/routes/create-account/create-account.html"));
});

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/routes/login/login.html"));
});

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

module.exports = app;
