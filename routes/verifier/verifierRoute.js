require("dotenv").config();
const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const verfierLogin = require("../../models/verifier/loginModel");
const publisherRegistration = require("../../models/publisher/registrationModel");
const communityRegistration = require("../../models/publisher/communityRegistrationModel");
const verification = require("../../models/verifier/verification");

const usernameExtractor = require("../../utils/usernameExtractor");
const cookieAuth = require("../../utils/auth");
const { where } = require("sequelize");

//user all routes

//login routes
router.get("/login", async (req, res) => {
  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);
    if (!checkId) {
      res.clearCookie("verifier");
      res.render("../views/verifier/login", {
        emailExist: true,
        passwordError: false,
        email: "",
        password: "",
      });
    } else {
      res.redirect(`/verifier/${verify}/dashboard`);
    }
  } else {
    res.render("../views/verifier/login", {
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
            const token = cookieAuth(hashPassword.dataValues.id);
            res.cookie("verifier", token, {
              expires: new Date(Date.now() + 172800 * 1000),
              secure: true,
              httpOnly: true,
            });
            res.redirect(`/verifier/${hashPassword?.dataValues?.id}/dashboard`);
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
    res.render("../views/admin/verifierSignup", {
      emailExist: false,
      passwordError: true,
      email: email,
      password: password,
      confirm: confirm,
    });
    // res.json({ msg: "Wrong Password" });
  } else {
    const result = await verfierLogin.findOne({
      where: {
        email: email,
      },
    });

    if (result) {
      res.render("../views/admin/verifierSignup", {
        emailExist: true,
        passwordError: false,
        email: email,
        password: password,
        confirm: confirm,
      });
      // res.json({ msg: "Email Already Exists" });
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
              res.redirect("/admin/dashboard/verifier");
              // res.json({ msg: "Dashboard" });
            });
        }
      });
    }
  }
});

router.use(async (req, res, next) => {
  console.log("MiddleWare work");
  if (req.cookies.verifier) {
    const token = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const findId = await verfierLogin.findByPk(token);
    if (!findId) {
      res.clearCookie("verifier");
      res.redirect(`/verifier/login`);
    } else {
      next();
    }
    console.log("Authenticated");
  } else {
    res.redirect("/verifier/login");
  }
});

//user dashboard
router.get("/:id/dashboard", async (req, res) => {
  const { id } = req.params;

  const verificationDetails = await verification.findAll({
    where: {
      verifierId: id,
    },
  });
  const verificationCount = await verification.count({
    where: {
      verifierId: id,
    },
  });

  const communityCount = await communityRegistration.count({
    where: {
      verifierId: id,
      verify: "false",
    },
  });

  res.render("../views/verifier/dashboard", {
    profileCount: verificationCount,
    profileDetails: verificationDetails,
    communityCount: communityCount,
    id: id,
  });
});

router.get("/:verifier/dashboard/profile/:id", async (req, res) => {
  const { id, verifier } = req.params;

  const profile = await verification.findOne({
    where: {
      id: id,
    },
  });

  res.render("../views/verifier/modal", { profile: profile, id: verifier });
});

router.get("/:verifier/dashboard/profile/:id/accept", async (req, res) => {
  const { id, verifier } = req.params;

  const moveData = await verification.findByPk(id).then((data) => {
    publisherRegistration.create({
      id: data.dataValues.id,
      name: data.dataValues.name,
      email: data.dataValues.email,
      password: data.dataValues.password,
      community: data.dataValues.community,
      role: data.dataValues.role,
      mobile: data.dataValues.mobile,
      place: data.dataValues.place,
      socialmedia: data.dataValues.socialmedia,
      proof: data.dataValues.proof,
      verifierId: data.dataValues.verifierId,
    });

    data.destroy();
  });

  res.redirect(`/verifier/${verifier}/dashboard`);
});

router.get("/:verifier/dashboard/profile/:id/reject", async (req, res) => {
  const { id, verifier } = req.params;

  const moveData = await verification.findByPk(id);

  if (moveData) {
    moveData.destroy();
  }
  res.redirect(`/verifier/${verifier}/dashboard`);
});

router.get("/:verifier/dashboard/community", async (req, res) => {
  const { verifier } = req.params;

  const verificationCount = await verification.count();
  const communityDetails = await communityRegistration.findAll({
    where: {
      verify: "false",
    },
  });
  const communityCount = await communityRegistration.count({
    where: {
      verify: "false",
    },
  });
  const findVerifier = await verfierLogin.findByPk(verifier);

  if (!findVerifier) {
    res.clearCookie("verifier");
    res.redirect("/verifier/login");
  } else {
    res.render("../views/verifier/community", {
      profileCount: verificationCount,
      community: communityDetails,
      communityCount: communityCount,
      id: verifier,
    });
  }
});

router.get("/:verifier/dashboard/community/:id", async (req, res) => {
  const { id, verifier } = req.params;

  const community = await communityRegistration.findOne({
    where: {
      id: id,
    },
  });
  console.log(community);
  res.render("../views/verifier/communityModal", {
    community: community,
    id: verifier,
  });
});

router.get("/:verifier/dashboard/community/:id/accept", async (req, res) => {
  const { id, verifier } = req.params;

  const acceptCommunity = await communityRegistration
    .update(
      {
        verify: "true",
      },
      {
        where: {
          id: id,
        },
      }
    )
    .then((data) => {
      console.log(data);
      res.redirect(`/verifier/${verifier}/dashboard/community`);
    });
});

router.get("/:verifier/dashboard/community/:id/reject", async (req, res) => {
  const { id, verifier } = req.params;

  const moveData = await communityRegistration.findByPk(id);

  if (moveData) {
    moveData.destroy();
  }
  res.redirect(`/verifier/${verifier}/dashboard/community`);
});

router.get("/:verifier/dashboard/logout", (req, res) => {
  res.clearCookie("verifier");
  res.redirect("/verifier/login");
});

module.exports = router;
