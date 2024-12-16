var router = require("express").Router();

const {
  PUZZLES_INTEGRATION_COLLECTION,
  PUZZLES_PROD_COLLECTION,
} = require("../constants.cjs");

const assert = require("assert");
const dbClient = require('../database.cjs').default;





module.exports.router = router;
