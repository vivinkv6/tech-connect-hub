const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const adminlogin = require("../../models/admin/loginModel");
const usernameExtractor = require("../../utils/usernameExtractor");

//user all routes

//login routes
router.get("/login", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  const result = await adminlogin.count();

  if (result == 1) {
    res.render("../views/admin/login", {
      emailExist: true,
      passwordError: false,
      email: "",
      password: "",
    });
  } else {
    res.redirect("signup");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //find hashpassword of a particular email
    const hashPassword = await adminlogin.findOne({
      where: {
        email: email,
      },
    });

    //check if the hash password of the given email is find or not
    if (!hashPassword) {
      res.render("../views/admin/login", {
        emailExist: false,
        passwordError: false,
        email: email,
        password: password,
      });
    } else {
      /* The `bcrypt.compare()` function is used to compare a plain text password with a hashed
     password. */
      bycrypt.compare(
        password,
        hashPassword?.dataValues?.password,
        (err, data) => {
          if (err) {
            res.json({ err: err });
          }
          /* This code block is checking if the password entered by the user matches the hashed password
         stored in the database. */
          if (data) {
            res.redirect("dashboard");
          } else {
            res.render("../views/admin/login", {
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
router.get("/signup", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  const result = await adminlogin.count();
  if (result == 1) {
    res.redirect("login");
  } else {
    res.render("../views/admin/signup", {
      passwordError: false,
      email: "",
      password: "",
      confirm: "",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { email, password, confirm } = req.body;

  const username = usernameExtractor(email);

  /* This code block is handling the signup functionality. */
  if (password !== confirm) {
    res.render("../views/admin/signup", {
      emailExist: false,
      passwordError: true,
      email: email,
      password: password,
      confirm: confirm,
    });
  } else {
    /* bcrypt library is used to hash the password before storing it in the database. */
    bycrypt.hash(password, 12, async (err, hashedPassword) => {
      if (err) {
        res.json({ err: err.message });
      } else {
        const data = await adminlogin
          .create({
            username: username,
            email: email,
            password: hashedPassword,
          })
          .then((data) => {
            res.redirect("dashboard");
          });
      }
    });
  }
});

//user dashboard
router.get("/dashboard", (req, res) => {
  res.render('../views/admin/dashboard');
});

module.exports = router;
