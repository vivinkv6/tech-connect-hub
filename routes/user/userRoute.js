const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userlogin = require("../../models/user/loginModel");
const eventModel = require("../../models/publisher/eventModel");
const usernameExtractor = require("../../utils/usernameExtractor");
const getGreeting = require("../../utils/greetings");
const notificationModel = require("../../models/user/notificationModel");
const { Sequelize, where, Op } = require("sequelize");
const cookieAuth = require("../../utils/auth");
const communityRegistration = require("../../models/publisher/communityRegistrationModel");

//user all routes

//GET user  - login routes
router.get("/login", async (req, res) => {
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (findId) {
      res.redirect(`/user/${token}/dashboard`);
    } else {
      res.clearCookie("user");
      res.render("../views/user/login", {
        emailExist: true,
        passwordError: false,
        email: "",
        password: "",
      });
    }
  } else {
    res.render("../views/user/login", {
      emailExist: true,
      passwordError: false,
      email: "",
      password: "",
    });
  }
});

//POST user - login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashPassword = await userlogin.findOne({
      where: {
        email: email,
      },
    });

    if (!hashPassword) {
      res.render("../views/user/login", {
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
            const jwtToken = cookieAuth(hashPassword?.dataValues?.id);
            res.cookie("user", jwtToken, {
              expires: new Date(Date.now() + 172800 * 1000),
              secure: true,
              httpOnly: true,
            });
            res.redirect(`/user/${hashPassword?.dataValues?.id}/dashboard`);
          } else {
            res.render("../views/user/login", {
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

//GET user - signup routes
router.get("/signup", async (req, res) => {
  if (req.cookies.user) {
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (findId) {
      res.redirect(`/user/${token}/dashboard`);
    } else {
      res.clearCookie("user");
      res.render("../views/user/signup", {
        emailExist: false,
        passwordError: false,
        name: "",
        role: "",
        place: "",
        email: "",
        password: "",
        confirm: "",
      });
    }
  } else {
    res.render("../views/user/signup", {
      emailExist: false,
      passwordError: false,
      name: "",
      role: "",
      place: "",
      email: "",
      password: "",
      confirm: "",
    });
  }
});

//POST user - Signup route
router.post("/signup", async (req, res) => {
  const { email, password, confirm, name, role, place } = req.body;
  const username = usernameExtractor(email);

  if (password !== confirm) {
    res.render("../views/user/signup", {
      emailExist: false,
      passwordError: true,
      email: email,
      place: place,
      password: password,
      confirm: confirm,
      name: name,
      role: role,
    });
  } else {
    const result = await userlogin.findOne({
      where: {
        email: email,
      },
    });

    if (result) {
      res.render("../views/user/signup", {
        emailExist: true,
        passwordError: false,
        email: email,
        place: place,
        password: password,
        confirm: confirm,
        name: name,
        role: role,
      });
    } else {
      bycrypt.hash(password, 12, async (err, hashedPassword) => {
        if (err) {
          res.json({ err: err.message });
        } else {
          const data = await userlogin
            .create({
              username: username,
              email: email,
              password: hashedPassword,
              name: name,
              role: role,
              place: place,
            })
            .then((data) => {
              const jwtToken = cookieAuth(data.dataValues.id);
              res.cookie("user", jwtToken, {
                expires: new Date(Date.now() + 172800 * 1000),
                secure: true,
                httpOnly: true,
              });

              res.redirect(`/user/${data.dataValues.id}/dashboard`);
            });
        }
      });
    }
  }
});

// User - Authentication Middleware
router.use(async (req, res, next) => {
  console.log("MiddleWare work");
  if (req.cookies.user) {
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);
    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
      next();
    }
    console.log("Authenticated");
  } else {
    res.redirect("/user/login");
  }
});

//GET user Dashboard - Home page
router.get("/:id/dashboard", async (req, res) => {
  const { id } = req.params;

  const findProfile = await userlogin.findByPk(id);

  const greeting = getGreeting();
  const post = await eventModel.findAll({
    where: {
      district: findProfile.dataValues.place,
    },
    order: [["createdAt", "DESC"]],
  });
  res.render("../views/user/dashboard", {
    greeting: greeting,
    profile: findProfile.dataValues,
    post: post,
  });
});

//GET user Dashboard - communities dashboard
router.get("/:id/dashboard/communities", async (req, res) => {
  const { id } = req.params;

  const findProfile = await userlogin.findByPk(id);

  const greeting = getGreeting();
  const community = await communityRegistration.findAll({
    where: {
      verify: "true",
    },
  });
  res.render("../views/user/communities", {
    greeting: greeting,
    profile: findProfile.dataValues,
    communities: community,
  });
});

//GET user Dashboard -  community specific events
router.get("/:id/dashboard/communities/:id2", async (req, res) => {
  const { id, id2 } = req.params;

  console.log("correct");
  const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
  const findId = await userlogin.findByPk(token);

  if (!findId) {
    res.clearCookie("user");
    res.redirect(`/user/login`);
  } else {
    const findProfile = await userlogin.findByPk(id);

    if (!findProfile) {
      res.clearCookie("user");
      res.redirect("/user/login");
    } else {
      const greeting = getGreeting();
      const communityPost = await eventModel.findAll({
        where: {
          communityId: id2,
        },
      });
      res.render("../views/user/communityevents", {
        greeting: greeting,
        profile: findProfile.dataValues,
        post: communityPost,
      });
    }
  }
});

//GET user Dashboard - event notification
router.get("/:id/dashboard/notification", async (req, res) => {
  const { id } = req.params;

  const findId = await userlogin.findByPk(id);

  const notification = await notificationModel.findAll({
    where: {
      place: findId.dataValues.place,
    },
    order: [["createdAt", "DESC"]],
  });
  res.render("../views/user/notification", {
    notification: notification,
    id: id,
  });
});

//GET user Dashboard - event specific details
router.get("/:id/dashboard/post/:post", async (req, res) => {
  const { id, post } = req.params;

  const findId = await userlogin.findByPk(id);

  if (!findId) {
    res.clearCookie("user");
    res.redirect(`/user/login`);
  } else {
    const findPost = await eventModel.findByPk(post);
    const similarPost = await eventModel.findAll({
      where: {
        id: {
          [Op.ne]: findPost.dataValues.id,
        },
        type: findPost.dataValues.type,
        mode: findPost.dataValues.mode,
        fee: findPost.dataValues.fee,
      },
    });

    if (!findPost) {
      res.redirect(`/user/${id}/dashboard`);
    } else {
      res.render("../views/user/viewPost", {
        profile: findId.dataValues,
        post: findPost.dataValues,
        id: id,
        similar: similarPost,
      });
    }
  }
});

//GET user Dashboard - filter event post
router.get("/:id/dashboard/filter?", async (req, res) => {
  try {
    const { id } = req.params;

    const greeting = getGreeting();

    const findId = await userlogin.findByPk(id);
    if (!findId) {
      res.clearCookie("user");
      res.redirect("/user/login");
    } else {
      if (
        (req.query.type == undefined) | null ||
        (req.query.mode == undefined) | null ||
        (req.query.fee == undefined) | null ||
        (req.query.district == undefined) | null
      ) {
        const filterPost = await eventModel.findAll({
          order: [["createdAt", "DESC"]],
        });

        res.render("../views/user/filter", {
          profile: findId.dataValues,
          greeting: greeting,
          post: filterPost,
          id: id,
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
        const filterPost = await eventModel.findAll({
          order: [["createdAt", "DESC"]],
        });

        res.render("../views/user/filter", {
          profile: findId.dataValues,
          greeting: greeting,
          post: filterPost,
          id: id,
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

        res.render("../views/user/filter", {
          profile: findId.dataValues,
          greeting: greeting,
          post: filterPost,
          id: id,
          type: req.query.type,
          mode: req.query.mode,
          fee: req.query.fee,
          district: req.query.district,
        });
      }
    }
  } catch (err) {
    res.json({ err: err.message });
  }
});

//GET user Dashboard - profile
router.get("/:id/dashboard/profile", async (req, res) => {
  const { id } = req.params;

  const profile = await userlogin.findByPk(id);

  //check if the user id is valid or not

  const savedPost = await eventModel.findAll({
    where: {
      id: profile.dataValues.saved,
    },
  });
  // res.json({msg:"success"})
  res.render("../views/user/profile", {
    profile: profile.dataValues,
    post: savedPost,
  });
});

//POST user Dashboard - update profile
router.post("/:id/dashboard/profile", async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const { email, name, role, place } = req.body;
  const profile = await userlogin.findByPk(id);
  const savedPost = await eventModel.findAll({
    where: {
      id: profile.dataValues.saved,
    },
  });
  const findEmail = await userlogin.findAll({
    where: {
      email: email,
    },
  });

  if (findEmail.length > 1) {
    res.render("../views/user/profile", {
      profile: profile.dataValues,
      post: savedPost,
    });
  } else {
    const updateProfile = await userlogin
      .update(req.body, {
        where: {
          id: id,
        },
      })
      .then(() => {
        res.redirect(`/user/${id}/dashboard/profile`);
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  }
});

//GET user Dashboard - save post
router.get("/:id/dashboard/saved/:post", async (req, res) => {
  const { id, post } = req.params;

  const findUser = await userlogin.findByPk(id);
  let savedPost = [];

  if (!findUser) {
    res.clearCookie("user");
    res.redirect("/user/login");
  } else {
    if (findUser.dataValues.saved == null) {
      const updatedUser = await userlogin
        .update(
          {
            saved: [post],
          },
          {
            where: {
              id: id,
            },
          }
        )
        .then(() => {
          res.redirect(`/user/${id}/dashboard`);
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      savedPost = [...findUser.dataValues.saved];
      if (savedPost.includes(post)) {
        res.redirect(`/user/${id}/dashboard`);
      } else {
        const updatedUser = await userlogin
          .update(
            {
              saved: [...findUser.dataValues.saved, post],
            },
            {
              where: {
                id: id,
              },
            }
          )
          .then(() => {
            res.redirect(`/user/${id}/dashboard`);
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    }
  }
});

//GET user Dashboard - delete saved post
router.get("/:id/dashboard/remove/:post", async (req, res) => {
  const { id, post } = req.params;

  const deletePost = await userlogin
    .update(
      {
        saved: Sequelize.fn("array_remove", Sequelize.col("saved"), post),
      },
      {
        where: {},
        returning: true,
      }
    )
    .then(() => {
      res.redirect(`/user/${id}/dashboard/profile`);
    })
    .catch((err) => {
      res.json({ err: err.message });
    });
});

//GET user Dashboard - user logout
router.get("/:id/dashboard/logout", (req, res) => {
  const { id } = req.params;

  res.clearCookie("user");
  res.redirect("/user/login");
});

module.exports = router;
