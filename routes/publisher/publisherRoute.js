const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");

const publisherLogin = require("../../models/publisher/registrationModel");
const verificationModel = require("../../models/verifier/verification");

const cloudinaryConfig = require("../../config/cloudinary.config");
const multer = require("multer");
/* The line `const storage = multer.memoryStorage();` is creating an instance of the `multer`
middleware's `MemoryStorage` class. */
const storage = multer.memoryStorage();
/* The line `const upload = multer({ storage: storage });` is creating an instance of the `multer`
middleware and configuring it to use the `storage` object for file storage. */
const upload = multer({ storage: storage });

//publisher all routes

//login routes
router.get("/login", (req, res) => {
  res.render("../views/publisher/login", {
    emailExist: true,
    passwordError: false,
    email: "",
    password: "",
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashPassword = await publisherLogin.findOne({
      where: {
        email: email,
      },
    });

    /* This code block is handling the login functionality. */
    /* This code block is checking if the `hashPassword` variable is falsy. If it is falsy, it means that
  there is no matching email in the database, so the user is redirected to the login page with the
  `emailExist` flag set to `false`. This will display an error message indicating that the email
  does not exist. The `passwordError` flag is also set to `false` to prevent displaying any
  password-related error messages. The `email` and `password` values are passed back to the login
  page so that the user does not have to re-enter them. */

    if (!hashPassword) {
      res.render("../views/publisher/login", {
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
          if (data) {
            res.redirect("dashboard");
          } else {
            res.render("../views/publisher/login", {
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
router.get("/register", (req, res) => {
  res.render("../views/publisher/register", {
    emailExist: false,
    passwordError: false,
    email: "",
    password: "",
    confirm: "",
    name: "",
    community: "",
    role: "",
    social: "",
    place: "",
    mobile: "",
  });
});

router.post("/register", upload.single("file"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirm,
      role,
      community,
      social,
      place,
      mobile,
    } = req.body;

    // File uploading logic

    /* This code block is checking if the `password` and `confirm` values are not equal. If they are
    not equal, it means that the user has entered different passwords in the registration form. In
    this case, the code renders the "../views/publisher/register" view with the `passwordError` flag
    set to `true`. This will display an error message indicating that the passwords do not match.
    The other form field values (`email`, `name`, `community`, `role`, `social`, `place`, `mobile`)
    are also passed back to the register page so that the user does not have to re-enter them. */
    if (password !== confirm) {
      res.render("../views/publisher/register", {
        emailExist: false,
        passwordError: true,
        email: email,
        password: password,
        confirm: confirm,
        name: name,
        community: community,
        role: role,
        social: social,
        place: place,
        mobile: mobile,
      });
    } else {
      /* The code `const result = await publisherLogin.findOne({ where: { email: email } })` is querying
     the `publisherLogin` model to find a record where the `email` field matches the `email`
     variable value. */
      const result = await publisherLogin.findOne({
        where: {
          email: email,
        },
      });

      /* The code `const result2 = await verificationModel.findOne({ where: { email: email } })` is
     querying the `verificationModel` to find a record where the `email` field matches the `email`
     variable value. It is used to check if there is already a record in the `verificationModel`
     with the same email as the one provided in the registration form. If a record is found, it
     means that the email has already been registered and the user is redirected back to the
     registration page with the `emailExist` flag set to `true`. This will display an error message
     indicating that the email already exists. */
      const result2 = await verificationModel.findOne({
        where: {
          email: email,
        },
      });

      if (result) {
        res.render("../views/publisher/register", {
          emailExist: true,
          passwordError: false,
          email: email,
          password: password,
          confirm: confirm,
          name: name,
          community: community,
          role: role,
          social: social,
          place: place,
          mobile: mobile,
        });
      } else if (result2) {
        res.render("../views/publisher/register", {
          emailExist: true,
          passwordError: false,
          email: email,
          password: password,
          confirm: confirm,
          name: name,
          community: community,
          role: role,
          social: social,
          place: place,
          mobile: mobile,
        });
      } else {
        /* The line `const fileBuffer = req.file.buffer.toString("base64");` is converting the file
       buffer of the uploaded file into a base64 encoded string. */
        const fileBuffer = req.file.buffer.toString("base64");

        /* The code `const fileUpload = await cloudinaryConfig.uploader.upload(...)` is uploading an image
     file to the Cloudinary service. */
        const fileUpload = await cloudinaryConfig.uploader.upload(
          `data:image/png;base64,${fileBuffer}`,
          {
            folder: "/upload",
            public_id: Date.now() + "-" + req.file.originalname,
            encoding: "base64",
          }
        );

        //hash the password
        bycrypt.hash(password, 12, async (err, hashedPassword) => {
          if (err) {
            res.json({ err: err.message });
          } else {
            const data = await verificationModel
              .create({
                name: name,
                email: email,
                password: hashedPassword,
                role: role,
                community: community,
                socialmedia: social,
                place: place,
                mobile: mobile,
                proof: fileUpload.secure_url,
              })
              .then((data) => {
                res.redirect("dashboard");
              });
          }
        });
      }
    }
  } catch (error) {
    res.json({ err: error.message });
  }
});

//user dashboard
router.get("/dashboard", (req, res) => {
  res.json({ msg: "Publisher Dashboard" });
});

module.exports = router;
