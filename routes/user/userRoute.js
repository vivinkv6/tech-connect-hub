const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const userlogin = require("../../models/user/loginModel");
const usernameExtractor = require("../../utils/usernameExtractor");

//user all routes

//login routes
router.get("/login", (req, res) => {
  res.render("../views/user/login");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);

    const hashPassword = await userlogin
      .findOne({
        where: {
          email: email,
        },
      })
      .then((user) => {
        if (user) {
          return user?.dataValues?.password;
        } else {
          console.log("Result not found");
        }
      })
      .catch((err) => {
        res.json({ err: err.message });
      });

    bycrypt.compare(password, hashPassword, (err, data) => {
      if (err) {
        res.json({ err: err.message });
      } else {
        res.redirect("/");
      }
    });
  } catch (err) {
    res.json({ err: err.message });
  }
});

//signup routes
router.get("/signup", (req, res) => {
  res.render("../views/user/signup");
});

router.post("/signup", async (req, res) => {
  const { email, password, confirm } = req.body;
  const username = usernameExtractor(email);
  const userDetails = { email, password, confirm, alert: "Wrong Password" };

  if (!password == confirm) {
    res.render("../../views/user/signup", userDetails);
  } else {
    const result = await userlogin.findOne({
      where: {
        email: email,
      },
    });

    if (result) {
      res.json({ msg: "Email already exist" });
    } else {
      bycrypt.hash(password, 12, async (err, hashedPassword) => {
        if (err) {
          res.json({ err: err.message });
        } else {
          const data = userlogin
            .create({
              username: username,
              email: email,
              password: hashedPassword,
            })
            .then((res) => res.json())
            .then((data) => {
              res.json({ data: data });
            });
        }
      });
    }
  }
});

//user dashboard
router.get("/dashboard", (req, res) => {
  res.json({ msg: "User Dashboard" });
});

module.exports = router;
