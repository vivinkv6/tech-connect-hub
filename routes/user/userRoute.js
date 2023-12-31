const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const userlogin = require("../../models/user/loginModel");
const eventModel = require("../../models/publisher/eventModel");
const usernameExtractor = require("../../utils/usernameExtractor");
const getGreeting = require("../../utils/greetings");
const notificationModel = require("../../models/user/notificationModel");
const { Sequelize, where } = require("sequelize");

//user all routes

//login routes
router.get("/login", (req, res) => {
  res.render("../views/user/login", {
    emailExist: true,
    passwordError: false,
    email: "",
    password: "",
  });
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
    name:"",
    role:"",
    email: "",
    password: "",
    confirm: "",
  });
});

router.post("/signup", async (req, res) => {
  const { email, password, confirm,name,role } = req.body;
  const username = usernameExtractor(email);

  if (password !== confirm) {
    res.render("../views/user/signup", {
      emailExist: false,
      passwordError: true,
      email: email,
      password: password,
      confirm: confirm,
      name:name,
      role:role
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
        name:name,
        role:role
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
              name:name,
              role:role
            })
            .then((data) => {
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

  const findProfile = await userlogin.findByPk(id);

  if (!findProfile) {
    res.redirect("/user/login");
  } else {
    const greeting = getGreeting();
    const post = await eventModel.findAll({});
    res.render("../views/user/dashboard", {
      greeting: greeting,
      profile: findProfile.dataValues,
      post: post,
    });
  }
});

router.get("/:id/dashboard/notification", async (req, res) => {
  const { id } = req.params;
  const findId = await userlogin.findByPk(id);

  if (!findId) {
    res.redirect("/user/login");
  } else {
    const notification = await notificationModel.findAll({});
    res.render("../views/user/notification", {
      notification: notification,
      id: id,
    });
  }
});

router.get("/:id/dashboard/post/:post", async (req, res) => {
  const { id, post } = req.params;

  const checkId = await userlogin.findByPk(id);

  if (!checkId) {
    res.redirect("/user/login");
  } else {
    const findPost = await eventModel.findByPk(post);

    if (!findPost) {
      res.redirect("/user/login");
    } else {
      res.render("../views/user/viewPost", {
        post: findPost.dataValues,
        id: id,
      });
    }
  }
});

router.get("/:id/dashboard/filter?", async (req, res) => {
  try {
    const { id } = req.params;

    const findId = await userlogin.findByPk(id);
    if (!findId) {
      res.redirect("/user/login");
    } else {
      if (
        req.query.type == undefined ||
        req.query.mode == undefined ||
        req.query.fee == undefined
      ) {
        console.log("start");
        const filterPost = await eventModel.findAll({});
        console.log(filterPost);
        res.render("../views/user/filter", { post: filterPost, id: id });
      } else {
        console.log("next");
        const filterPost = await eventModel.findAll({
          where: {
            type: req.query.type,
            mode: req.query.mode,
            fee: req.query.fee,
          },
        });

        res.render("../views/user/filter", { post: filterPost, id: id });
      }
    }
  } catch (err) {
    res.json({ err: err.message });
  }
});

router.get("/:id/dashboard/profile", async (req, res) => {
  const { id } = req.params;
  const profile = await userlogin.findByPk(id);

  //check if the user id is valid or not
  if (!profile) {
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
});

router.get("/:id/dashboard/saved/:post", async (req, res) => {
  const { id, post } = req.params;
  const findUser = await userlogin.findByPk(id);
  let savedPost = [];

  if (!findUser) {
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

router.get("/:id/dashboard/remove/:post", async (req, res) => {
  const { id, post } = req.params;
  const findId = await userlogin.findByPk(id);

  if (!findId) {
    res.redirect("/user/login");
  } else {
    const deletePost = await userlogin.update(
      {
        saved: Sequelize.fn("array_remove", Sequelize.col("saved"), post),
      },
      {
        where: {},
        returning: true,
      }
    ).then(()=>{
      res.redirect(`/user/${id}/dashboard/profile`);
    }).catch((err)=>{
      res.json({err:err.message})
    })
  }
});

router.get("/:id/dashboard/logout", async (req, res) => {
  const { id } = req.params;
  const validId = await userlogin.findByPk(id);

  if (!validId) {
    res.redirect("/user/signup");
  } else {
    res.redirect("/user/login");
  }
});

module.exports = router;
