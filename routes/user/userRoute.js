const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userlogin = require("../../models/user/loginModel");
const eventModel = require("../../models/publisher/eventModel");
const usernameExtractor = require("../../utils/usernameExtractor");
const getGreeting = require("../../utils/greetings");
const notificationModel = require("../../models/user/notificationModel");
const { Sequelize, where } = require("sequelize");
const cookieAuth = require("../../utils/auth");

//user all routes

//login routes
router.get("/login", async (req, res) => {
  console.log(req.cookies.user);
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (findId) {
      res.redirect(`/user/${token}/dashboard`);
    }
  } else {
    res.clearCookie("user");
    res.render("../views/user/login", {
      emailExist: true,
      passwordError: false,
      email: "",
      password: "",
    });
  }
});

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

//signup routes
router.get("/signup", (req, res) => {
  res.render("../views/user/signup", {
    emailExist: false,
    passwordError: false,
    name: "",
    role: "",
    email: "",
    password: "",
    confirm: "",
  });
});

router.post("/signup", async (req, res) => {
  const { email, password, confirm, name, role } = req.body;
  const username = usernameExtractor(email);

  if (password !== confirm) {
    res.render("../views/user/signup", {
      emailExist: false,
      passwordError: true,
      email: email,
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

//user dashboard
router.get("/:id/dashboard", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.user) {
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
        const post = await eventModel.findAll({
          order: [["createdAt", "DESC"]],
        });
        res.render("../views/user/dashboard", {
          greeting: greeting,
          profile: findProfile.dataValues,
          post: post,
        });
      }
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/notification", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
      const findId = await userlogin.findByPk(id);

      if (!findId) {
        res.clearCookie("user");
        res.redirect("/user/login");
      } else {
        const notification = await notificationModel.findAll({
          order: [["createdAt", "DESC"]],
        });
        res.render("../views/user/notification", {
          notification: notification,
          id: id,
        });
      }
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/post/:post", async (req, res) => {
  const { id, post } = req.params;
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
      const checkId = await userlogin.findByPk(id);

      if (!checkId) {
        res.clearCookie("user");
        res.redirect("/user/login");
      } else {
        const findPost = await eventModel.findByPk(post);

        if (!findPost) {
          res.clearCookie("user");
          res.redirect("/user/login");
        } else {
          res.render("../views/user/viewPost", {
            post: findPost.dataValues,
            id: id,
          });
        }
      }
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/filter?", async (req, res) => {
  try {
    const { id } = req.params;

    if (req.cookies.user) {
      console.log("correct");
      const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
      const findId = await userlogin.findByPk(token);

      if (!findId) {
        res.clearCookie("user");
        res.redirect(`/user/login`);
      } else {
        const findId = await userlogin.findByPk(id);
        if (!findId) {
          res.clearCookie("user");
          res.redirect("/user/login");
        } else {
          if (
            req.query.type == undefined ||
            req.query.mode == undefined ||
            req.query.fee == undefined ||
            req.query.state == undefined
          ) {
            console.log("start");
            const filterPost = await eventModel.findAll({
              order: [["createdAt", "DESC"]],
            });
            console.log(filterPost);
            res.render("../views/user/filter", {
              post: filterPost,
              id: id,
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
            const filterPost = await eventModel.findAll({
              order: [["createdAt", "DESC"]],
            });

            res.render("../views/user/filter", {
              post: filterPost,
              id: id,
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

            res.render("../views/user/filter", {
              post: filterPost,
              id: id,
              type: req.query.type,
              mode: req.query.mode,
              fee: req.query.fee,
              state: req.query.state,
            });
          }
        }
      }
    } else {
      res.redirect("/user/login");
    }
  } catch (err) {
    res.json({ err: err.message });
  }
});

router.get("/:id/dashboard/profile", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
      const profile = await userlogin.findByPk(id);

      //check if the user id is valid or not
      if (!profile) {
        res.clearCookie("user");
        res.redirect("/user/login");
      } else {
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
      }
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/saved/:post", async (req, res) => {
  const { id, post } = req.params;
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
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
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/remove/:post", async (req, res) => {
  const { id, post } = req.params;
  if (req.cookies.user) {
    console.log("correct");
    const token = jwt.verify(req.cookies.user, process.env.JWT_SECRET_TOKEN);
    const findId = await userlogin.findByPk(token);

    if (!findId) {
      res.clearCookie("user");
      res.redirect(`/user/login`);
    } else {
      const findId = await userlogin.findByPk(id);

      if (!findId) {
        res.clearCookie("user");
        res.redirect("/user/login");
      } else {
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
      }
    }
  } else {
    res.redirect("/user/login");
  }
});

router.get("/:id/dashboard/logout",(req, res) => {
  const { id } = req.params;

  if (!req.cookies.user) {
    res.redirect("/user/login");
  } else {
    res.clearCookie("user");
    res.redirect("/user/login");
  }

 
});

module.exports = router;
