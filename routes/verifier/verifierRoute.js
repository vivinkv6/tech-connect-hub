const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const verfierLogin = require("../../models/verifier/loginModel");
const publisherRegistration = require("../../models/publisher/registrationModel");
const communityRegistration = require("../../models/publisher/communityRegistrationModel");
const verification = require("../../models/verifier/verification");

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
    res.json({ msg: "Wrong Password" });
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
      res.json({ msg: "Email Already Exists" });
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
              res.json({ msg: "Dashboard" });
            });
        }
      });
    }
  }
});

//user dashboard
router.get("/dashboard", async (req, res) => {
  const verificationDetails = await verification.findAll({});
  const verificationCount = await verification.count();

  const communityCount = await communityRegistration.count();

  res.render("../views/verifier/dashboard", {
    profileCount: verificationCount,
    profileDetails: verificationDetails,
    communityCount: communityCount,
  });
});

router.get("/dashboard/profile/:id", async (req, res) => {
  const { id } = req.params;

  const profile = await verification.findOne({
    where: {
      id: id,
    },
  });

  res.render("../views/verifier/modal", { profile: profile });
});

router.get("/dashboard/profile/:id/accept", async (req, res) => {
  const { id } = req.params;
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
    });

    data.destroy();
  });

  res.redirect("/verifier/dashboard");
});

router.get("/dashboard/profile/:id/reject", async (req, res) => {
  const { id } = req.params;
  const moveData = await verification.findByPk(id);

  if (moveData) {
    moveData.destroy();
  }
  res.redirect("/verifier/dashboard");
});

router.get("/dashboard/community", async (req, res) => {
  const verificationCount = await verification.count();
  const communityDetails = await communityRegistration.findAll({});
  const communityCount = await communityRegistration.count();

  res.render("../views/verifier/community", {
    profileCount: verificationCount,
    community: communityDetails,
    communityCount: communityCount,
  });
});

router.get("/dashboard/community/:id", async (req, res) => {
  const { id } = req.params;

  const community = await communityRegistration.findOne({
    where: {
      id: id,
    },
  });
  console.log(community);
  res.render("../views/verifier/communityModal", { community: community });
});

router.get("/dashboard/logout", (req, res) => {
  res.redirect("/verifier/login");
});

module.exports = router;
