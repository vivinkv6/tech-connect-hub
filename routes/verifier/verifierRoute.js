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

//user dashboard
router.get("/:id/dashboard", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
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
        },
      });

      res.render("../views/verifier/dashboard", {
        profileCount: verificationCount,
        profileDetails: verificationDetails,
        communityCount: communityCount,
        id: id,
      });
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/profile/:id", async (req, res) => {
  const { id, verifier } = req.params;

  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const profile = await verification.findOne({
        where: {
          id: id,
        },
      });

      res.render("../views/verifier/modal", { profile: profile, id: verifier });
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/profile/:id/accept", async (req, res) => {
  const { id, verifier } = req.params;

  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const findVerifier = await verfierLogin.findByPk(verifier);
      if (!findVerifier) {
        res.clearCookie("verifier");
        res.redirect("/verifier/login");
      } else {
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
      }
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/profile/:id/reject", async (req, res) => {
  const { id, verifier } = req.params;

  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const findVerifier = await verfierLogin.findByPk(verifier);

      if (!findVerifier) {
        res.clearCookie("verifier");
        res.redirect("/verifier/login");
      } else {
        const moveData = await verification.findByPk(id);

        if (moveData) {
          moveData.destroy();
        }
        res.redirect(`/verifier/${verifier}/dashboard`);
      }
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/community", async (req, res) => {
  const { verifier } = req.params;

  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const verificationCount = await verification.count();
      const communityDetails = await communityRegistration.findAll({});
      const communityCount = await communityRegistration.count();
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
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/community/:id", async (req, res) => {
  const { id, verifier } = req.params;
  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const findVerifier = await verfierLogin.findByPk(verifier);

      if (!findVerifier) {
        res.clearCookie("verifier");
        res.redirect("/verifier/login");
      } else {
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
      }
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/community/:id/reject", async (req, res) => {
  const { id, verifier } = req.params;
  if (req.cookies.verifier) {
    const verify = jwt.verify(
      req.cookies.verifier,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await verfierLogin.findByPk(verify);

    if (!checkId) {
      res.clearCookie("verifier");
      res.redirect("/verifier/login");
    } else {
      const findVerifier = await verfierLogin.findByPk(verifier);

      if (!findVerifier) {
        res.clearCookie("verifier");
        res.redirect("/verifier/login");
      } else {
        const moveData = await communityRegistration.findByPk(id);

        if (moveData) {
          moveData.destroy();
        }
        res.redirect(`/verifier/${verifier}/dashboard/community`);
      }
    }
  } else {
    res.redirect("/verifier/login");
  }
});

router.get("/:verifier/dashboard/logout", (req, res) => {
  if (req.cookies.verifier) {
    res.clearCookie("verifier");
    res.redirect("/verifier/login");
  } else {
    res.redirect("/verifier/login");
  }
});

module.exports = router;
