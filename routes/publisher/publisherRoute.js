const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const publisherLogin = require("../../models/publisher/registrationModel");
const verificationModel = require("../../models/verifier/verification");
const usernameExtractor = require("../../utils/usernameExtractor");

//user all routes

//login routes
router.get("/login", (req, res) => {
  res.render("../views/publisher/login", {
    emailExist: true,
    passwordError: false,
    email: "",
    password: "",
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashPassword = await publisherLogin.findOne({
      where: {
        email: email,
      },
    });

    if (!hashPassword) {
      res.render("../views/publisher/login", {
        emailExist: false,
        passwordError: false,
        email: email,
        password: password,
      });
    } else {
      bycrypt.compare(
        password,
        hashPassword?.dataValues?.password,
        (err, data) => {
          if (err) {
            res.json({ err: err });
          }
          if (data) {
            res.redirect("dashboard");
          } else {
            res.render("../views/publisher/login", {
              emailExist: true,
              passwordError: true,
              email: email,
              password: password,
            });
          }
        }
      );
    }
  } catch (err) {
    res.json({ err: err.message });
  }
});

//signup routes
router.get("/register", (req, res) => {
  res.render("../views/publisher/register", {
    emailExist: false,
    passwordError: false,
    email: "",
    password: "",
    confirm: "",
  });
});

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    confirm,
    role,
    community,
    social,
    place,
    mobile,
    file,
  } = req.body;

  // File uploading logic

  if (password !== confirm) {
    res.render("../views/publisher/register", {
      emailExist: false,
      passwordError: true,
      email: email,
      password: password,
      confirm: confirm,
    });
  } else {
    const result = await publisherLogin.findOne({
      where: {
        email: email,
      },
    });

    const result2 = await verificationModel.findOne({
      where: {
        email: email,
      },
    });

    if (result) {
      res.render("../views/publisher/register", {
        emailExist: true,
        passwordError: false,
        email: email,
        password: password,
        confirm: confirm,
      });
    } else if (result2) {
      res.render("../views/publisher/register", {
        emailExist: true,
        passwordError: false,
        email: email,
        password: password,
        confirm: confirm,
      });
    } else {
      bycrypt.hash(password, 12, async (err, hashedPassword) => {
        if (err) {
          res.json({ err: err.message });
        } else {
          const data = await verificationModel
            .create({
              name: name,
              email: email,
              password: password,
              role: role,
              community: community,
              socialmedia: social,
              place: place,
              mobile: mobile,
              //Add cloudinary url here
              //  proof:file
            })
            .then((data) => {
              res.redirect("dashboard");
            });
        }
      });
    }
  }
});

//user dashboard
router.get("/dashboard", (req, res) => {
  res.json({ msg: "Publisher Dashboard" });
});

module.exports = router;
