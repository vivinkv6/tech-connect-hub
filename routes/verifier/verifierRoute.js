const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const verfierLogin = require("../../models/verifier/loginModel");
const usernameExtractor = require("../../utils/usernameExtractor");

//user all routes

//login routes
router.get("/login", (req, res) => {
  res.render("../views/verifier/login", {
    emailExist: true,
    passwordError: false,
    email: "",
    password: "",
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashPassword = await verfierLogin.findOne({
      where: {
        email: email,
      },
    });

    if (!hashPassword) {
      res.render("../views/verifier/login", {
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
            res.render("../views/verifier/login", {
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
// router.get("/signup", (req, res) => {
//   res.render("../views/verifier/signup", {
//     emailExist: false,
//     passwordError: false,
//     email: "",
//     password: "",
//     confirm: "",
//   });
// });

router.post("/signup", async (req, res) => {
  const { email, password, confirm } = req.body;
  const username = usernameExtractor(email);

  if (password !== confirm) {
    // res.render("../views/verifier/signup", {
    //   emailExist: false,
    //   passwordError: true,
    //   email: email,
    //   password: password,
    //   confirm: confirm,
    // });
    res.json({msg:"Wrong Password"});
  } else {
    const result = await verfierLogin.findOne({
      where: {
        email: email,
      },
    });

    if (result) {
      // res.render("../views/verifier/signup", {
      //   emailExist: true,
      //   passwordError: false,
      //   email: email,
      //   password: password,
      //   confirm: confirm,
      // });
      res.json({msg:"Email Already Exists"});
    } else {
      bycrypt.hash(password, 12, async (err, hashedPassword) => {
        if (err) {
          res.json({ err: err.message });
        } else {
          const data = await verfierLogin
            .create({
              username: username,
              email: email,
              password: hashedPassword,
            })
            .then((data) => {
              // res.redirect("dashboard");
              res.json({msg:"Dashboard"})
            });
        }
      });
    }
  }
});

//user dashboard
router.get("/dashboard", (req, res) => {
  res.json({ msg: "Verifier Dashboard" });
});

module.exports = router;
