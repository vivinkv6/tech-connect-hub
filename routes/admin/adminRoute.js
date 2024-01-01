const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const adminlogin = require("../../models/admin/loginModel");
const userLogin = require("../../models/user/loginModel");
const publisherLogin = require("../../models/publisher/registrationModel");
const verifierLogin = require("../../models/verifier/loginModel");
const post = require("../../models/publisher/eventModel");
const community = require("../../models/publisher/communityRegistrationModel");

const usernameExtractor = require("../../utils/usernameExtractor");
const eventModel = require("../../models/publisher/eventModel");
const communityRegistration = require("../../models/publisher/communityRegistrationModel");

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
router.get("/dashboard", async (req, res) => {
  const users = await userLogin.findAll({});

  res.render("../views/admin/dashboard", { users: users });
});

router.get("/dashboard/user/delete/:id", async (req, res) => {
  const { id } = req.params;
  const findUser = await userLogin.findByPk(id);

  if (!findUser) {
    res.redirect("/admin/dashboard");
  } else {
    findUser
      .destroy()
      .then(() => {
        res.redirect("/admin/dashboard");
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});

router.get("/dashboard/publisher", async (req, res) => {
  const publishers = await publisherLogin.findAll({});
  res.render("../views/admin/publisher", { publishers: publishers });
});

router.get("/dashboard/publisher/delete/:id", async (req, res) => {
  const { id } = req.params;
  const findPublisher = await publisherLogin.findByPk(id);

  if (!findPublisher) {
    res.redirect("/admin/dashboard");
  } else {
    findPublisher
      .destroy()
      .then(() => {
        res.redirect("/admin/dashboard/publisher");
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});

router.get("/dashboard/verifier", async (req, res) => {
  const verifierList = await verifierLogin.findAll({});

  res.render("../views/admin/verifier", { verifier: verifierList });
});

// router.get("/dashboard/verifier/edit/:id", (req, res) => {});

router.get("/dashboard/verifier/delete/:id", async (req, res) => {
  const { id } = req.params;
  const checkId = await verifierLogin.findByPk(id);
  if (!checkId) {
    res.redirect("/admin/dashboard/verifier");
  } else {
    checkId
      .destroy()
      .then(() => {
        res.redirect("/admin/dashboard/verifier");
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});
router.get("/dashboard/verifier/create", (req, res) => {
  res.render("../views/admin/verifierSignup", {
    emailExist: false,
    passwordError: false,
    email: "",
    password: "",
    confirm: "",
  });
});

router.get("/dashboard/community", async (req, res) => {
  const communityList = await communityRegistration.findAll({});

  res.render("../views/admin/community", { community: communityList });
});

router.get("/dashboard/community/delete/:id", async (req, res) => {
  const { id } = req.params;

  const checkId = await communityRegistration.findByPk(id);

  if (!checkId) {
    res.redirect("/admin/dashboard/community");
  } else {
    checkId
      .destroy()
      .then(() => {
        res.redirect("/admin/dashboard/community");
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});

router.get("/dashboard/post", async (req, res) => {
  // const postList=await eventModel.findAll({});
  // const postCount=await eventModel.count();
  // const communityCount=await communityRegistration.count();

  try {
    if (
      req.query.type == undefined ||
      req.query.mode == undefined ||
      req.query.fee == undefined ||
      req.query.state == undefined
    ) {
      const filterPost = await eventModel.findAll({});

      res.render("../views/admin/post", {
        post: filterPost,
        type: "All",
        mode: "All",
        fee: "All",
        state: "All",
      });
    } else if (
      req.query.type == "" &&
      req.query.mode == "" &&
      req.query.fee == "" &&
      req.query.state == ""
    ) {
      const filterPost = await eventModel.findAll({});

      res.render("../views/admin/post", {
        post: filterPost,
        type: req.query.type,
        mode: req.query.mode,
        fee: req.query.fee,
        state: req.query.state,
      });
    } else {
      const filterPost = await eventModel.findAll({
        where: {
          type: req.query.type,
          mode: req.query.mode,
          fee: req.query.fee,
          state: req.query.state,
        },
      });

      res.render("../views/admin/post", {
        post: filterPost,
        type: req.query.type,
        mode: req.query.mode,
        fee: req.query.fee,
        state: req.query.state,
      });
    }
  } catch (err) {
    res.json({ err: err.message });
  }

  // res.render("../views/admin/post",{post:postList});
});

router.get("/dashboard/post/delete/:id", async (req, res) => {
  const { id } = req.params;

  const checkId = await eventModel.findByPk(id);

  if (!checkId) {
    res.redirect("/admin/dashboard/post");
  } else {
    checkId
      .destroy()
      .then(() => {
        res.redirect("/admin/dashboard/post");
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});

router.get("/dashboard/logout", (req, res) => {
  res.redirect("/admin/login");
});
module.exports = router;
