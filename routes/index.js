var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const userModel = require("../models/user/loginModel");
require("dotenv").config();
/* GET home page. */
router.get("/", async function (req, res, next) {
  if (req?.cookies?.user) {
    const id = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findUser = await userModel.findByPk(id);
    if (findUser) {
      console.log(`Authenticated User: ${findUser.dataValues.name}`);
    }
  } else {
    console.log("UnAuthenticated User");
  }
  res.render("index");
});

module.exports = router;
