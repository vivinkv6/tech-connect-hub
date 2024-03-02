require("dotenv").config();
const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminlogin = require("../../models/admin/loginModel");
const userLogin = require("../../models/user/loginModel");
const publisherLogin = require("../../models/publisher/registrationModel");
const verifierLogin = require("../../models/verifier/loginModel");

const usernameExtractor = require("../../utils/usernameExtractor");
const eventModel = require("../../models/publisher/eventModel");
const communityRegistration = require("../../models/publisher/communityRegistrationModel");
const cookieAuth = require("../../utils/auth");

//user all routes

//login routes
router.get("/login", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (findId) {
      res.redirect(`/admin/dashboard`);
    } else {
      res.redirect(`/admin/login`);
    }
  } else {
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
            const token = cookieAuth(hashPassword.dataValues.id);
            res.cookie("admin", token, {
              expires: new Date(Date.now() + 172800 * 1000),
              secure: true,
              httpOnly: true,
            });
            res.redirect("/admin/dashboard");
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

//GET admin signup
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

//POST admin signup
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
            const token = cookieAuth(data.dataValues.id);

            res.cookie("admin", token, {
              expires: new Date(Date.now() + 172800 * 1000),
              secure: true,
              httpOnly: true,
            });
            res.redirect("/admin/dashboard");
          });
      }
    });
  }
});

//GET all user details
router.get("/dashboard", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const users = await userLogin.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("../views/admin/dashboard", { users: users });
    }
  } else {
    res.redirect("/admin/login");
  }
});

//delete specific user 
router.get("/dashboard/user/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
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
    }
  } else {
    res.redirect("/admin/login");
  }
});

//GET all publisher details
router.get("/dashboard/publisher", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const publishers = await publisherLogin.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("../views/admin/publisher", { publishers: publishers });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

//delete specific publisher
router.get("/dashboard/publisher/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const findPublisher = await publisherLogin.findByPk(id);

      if (!findPublisher) {
        res.redirect("/admin/dashboard");
      } else {
        await findPublisher
          .destroy()
          .then(() => {
            res.redirect("/admin/dashboard/publisher");
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    }
  } else {
    res.redirect("/admin/login");
  }
});

//GET all verifier details
router.get("/dashboard/verifier", async (req, res) => {
  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const verifierList = await verifierLogin.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("../views/admin/verifier", { verifier: verifierList });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

// router.get("/dashboard/verifier/edit/:id", (req, res) => {});


//delete specific verifier
router.get("/dashboard/verifier/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
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
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

//create new verifier account
router.get("/dashboard/verifier/create", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      res.render("../views/admin/verifierSignup", {
        emailExist: false,
        passwordError: false,
        email: "",
        password: "",
        confirm: "",
      });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

//GET all community details
router.get("/dashboard/community", async (req, res) => {
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
      const communityList = await communityRegistration.findAll({
        order: [["createdAt", "DESC"]],
      });

      res.render("../views/admin/community", { community: communityList });
    }
  } else {
    res.redirect(`/admin/login`);
  }
});


//GET details about specific community
router.get("/dashboard/community/view/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    const verify = jwt.verify(
      req.cookies.admin,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await adminlogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("admin");
      res.redirect("/admin/login");
    } else {
     
        const viewCommunity = await communityRegistration.findByPk(id);

        if (!viewCommunity) {
          res.redirect(`/admin/dashboard/community`);
        } else {
          res.render("admin/viewCommunity", {
            profile: viewCommunity.dataValues,
          });
        }
      
    }
  } else {
    res.redirect("/admin/login");
  }
});



//delete specific community
router.get("/dashboard/community/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
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
    }
  } else {
    res.redirect(`/admin/login`);
  }
});


//GET all post details
router.get("/dashboard/post", async (req, res) => {
  // const postList=await eventModel.findAll({});
  // const postCount=await eventModel.count();
  // const communityCount=await communityRegistration.count();

  try {
    if (req.cookies.admin) {
      console.log("correct");
      const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
      const findId = await adminlogin.findByPk(token);

      if (!findId) {
        res.redirect(`/admin/login`);
      } else {
        if (
          req.query.type == undefined ||
          req.query.mode == undefined ||
          req.query.fee == undefined ||
          req.query.district == undefined
        ) {
          const filterPost = await eventModel.findAll({
            order: [["createdAt", "DESC"]],
          });

          res.render("../views/admin/post", {
            post: filterPost,
            type: "All",
            mode: "All",
            fee: "All",
            district: "All",
          });
        } else if (
          req.query.type == "" &&
          req.query.mode == "" &&
          req.query.fee == "" &&
          req.query.district == ""
        ) {
          const filterPost = await eventModel.findAll({});

          res.render("../views/admin/post", {
            post: filterPost,
            type: req.query.type,
            mode: req.query.mode,
            fee: req.query.fee,
            district: req.query.district,
          });
        } else {
          const filterPost = await eventModel.findAll({
            where: {
              type: req.query.type,
              mode: req.query.mode,
              fee: req.query.fee,
              district: req.query.district,
            },
          });

          res.render("../views/admin/post", {
            post: filterPost,
            type: req.query.type,
            mode: req.query.mode,
            fee: req.query.fee,
            district: req.query.district,
          });
        }
      }
    } else {
      res.redirect(`/admin/login`);
    }
  } catch (err) {
    res.json({ err: err.message });
  }

  // res.render("../views/admin/post",{post:postList});
});


//View specific post
router.get("/dashboard/post/view/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    const verify = jwt.verify(
      req.cookies.admin,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await adminlogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("admin");
      res.redirect("/admin/login");
    } else {
      
        const viewPost = await eventModel.findByPk(id);

        if (!viewPost) {
          res.redirect(`/admin/dashboard`);
        } else {
          res.render("admin/viewpost", {
            profile: viewPost.dataValues,
          });
        }
    }
  } else {
    res.redirect("/publisher/login");
  }
});



//delete post
router.get("/dashboard/post/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.admin) {
    console.log("correct");
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (!findId) {
      res.redirect(`/admin/login`);
    } else {
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
    }
  } else {
    res.redirect(`/admin/login`);
  }
});


//admin logout
router.get("/dashboard/logout", (req, res) => {
  if (req.cookies.admin) {
    res.clearCookie("admin");
    res.redirect("/admin/login");
  } else {
    res.redirect("/admin/login");
  }
});
module.exports = router;
