require("dotenv").config();
const express = require("express");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//models
const publisherLogin = require("../../models/publisher/registrationModel");
const verificationModel = require("../../models/verifier/verification");
const communityModel = require("../../models/publisher/communityRegistrationModel");
const eventModel = require("../../models/publisher/eventModel");
const verifiers = require("../../models/verifier/loginModel");
const notificationModel = require("../../models/user/notificationModel");
const randomGenerator = require("../../utils/random");

const cloudinaryConfig = require("../../config/cloudinary.config");
const multer = require("multer");
const verfierLogin = require("../../models/verifier/loginModel");
const cookieAuth = require("../../utils/auth");
/* The line `const storage = multer.memoryStorage();` is creating an instance of the `multer`
middleware's `MemoryStorage` class. */
const storage = multer.memoryStorage();
/* The line `const upload = multer({ storage: storage });` is creating an instance of the `multer`
middleware and configuring it to use the `storage` object for file storage. */
const upload = multer({ storage: storage });

//publisher all routes

//login routes
router.get("/login", async (req, res) => {
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);
    if (checkId) {
      res.redirect(`/publisher/${checkId.dataValues.id}/dashboard`);
    } else {
      res.render("../views/publisher/login", {
        emailExist: true,
        passwordError: false,
        email: "",
        password: "",
      });
    }
  } else {
    res.render("../views/publisher/login", {
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
            const token = cookieAuth(hashPassword.dataValues.id);
            res.cookie("publisher", token, {
              expires: new Date(Date.now() + 172800 * 1000),
              secure: true,
              httpOnly: true,
            });
            res.redirect(`${hashPassword?.dataValues?.id}/dashboard`);
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
    const verifierCount = await verifiers.count();
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
            const randomVerifier = randomGenerator(verifierCount);
            const allVerifiers = await verfierLogin.findAll({});

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
                verifierId: allVerifiers[randomVerifier].dataValues.id,
              })
              .then((data) => {
                res.render("../views/publisher/message");
              });
          }
        });
      }
    }
  } catch (error) {
    res.json({ err: error.message });
  }
});

//publisher dashboard
router.get("/:id/dashboard", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const dashboard = await publisherLogin.findByPk(id);
      const community = await communityModel.count({
        where: {
          publisherId: id,
        },
      });

      const events = await eventModel.findAll({
        where: {
          publisherId: id,
        },
      });
      console.log(events);

      if (!dashboard) {
        res.redirect("/publisher/login");
      } else {
        res.render("../views/publisher/dashboard", {
          dashboard: dashboard,
          events: events,
          community: community,
        });
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//view profile
router.get("/:id/dashboard/profile", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const profile = await publisherLogin.findByPk(id);

      if (!profile) {
        res.redirect("/publisher/login");
      } else {
        res.render("../views/publisher/profile", {
          profile: profile.dataValues,
        });
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//create post
router.get("/:id/dashboard/post/create", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const profile = await publisherLogin.findByPk(id);
      const community=await communityModel.findAll({
        where:{
          publisherId:checkId.dataValues.id
        }
      })

      if (!profile) {
        res.redirect("/publisher/login");
      } else {
        res.render("../views/publisher/post", { id: id,community:community });
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//upload post
router.post(
  "/:id/dashboard/post/create",
  upload.single("banner"),
  async (req, res) => {
    const { id } = req.params;

    const {
      name,
      description,
      type,
      mode,
      date,
      time,
      link,
      fee,
      state,
      guest,
      contact,
      community
    } = req.body;
    if (req.cookies.publisher) {
      const verify = jwt.verify(
        req.cookies.publisher,
        process.env.JWT_SECRET_TOKEN
      );
      const checkId = await publisherLogin.findByPk(verify);

      if (!checkId) {
        res.redirect("/publisher/login");
      } else {
        const findId = await publisherLogin.findByPk(id);

        if (!findId) {
          res.redirect("/publisher/login");
        } else {
          const fileBuffer = req.file.buffer.toString("base64");
          const fileUpload = await cloudinaryConfig.uploader.upload(
            `data:image/png;base64,${fileBuffer}`,
            {
              folder: "/events",
              public_id: Date.now() + "-" + req.file.originalname,
              encoding: "base64",
            }
          );

          const postEvent = await eventModel
            .create({
              name: name,
              description: description,
              type: type,
              mode: mode,
              date: date,
              time: time,
              banner: fileUpload.secure_url,
              link: link,
              fee: fee,
              state: state,
              guest: guest,
              contact: contact,
              publisherId: id,
              community:community
            })
            .then(async (data) => {
              const sendNotification = await notificationModel
                .create({
                  pic: fileUpload.secure_url,
                  user: findId.dataValues.name,
                  message: `<i>${findId.dataValues.name}</i> has uploaded new event <b>" ${name} "</b>. Check out the details for the latest updates on upcoming events and plan your schedule accordingly`,
                  eventId: data.dataValues.id,
                })
                .then(() => {
                  res.redirect(`/publisher/${id}/dashboard`);
                })
                .catch((err) => {
                  res.json({ err: err });
                });
            })
            .catch((err) => {
              res.json({ err: err });
            });
        }
      }
    } else {
      res.redirect("/publisher/login");
    }
  }
);

router.get("/:id1/dashboard/post/:id2/update", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const validPublisher = await publisherLogin.findByPk(id1);
      if (!validPublisher) {
        res.redirect(`/publisher/${id1}/dasboard`);
      } else {
        const findPost = await eventModel.findByPk(id2);
        const community=await communityModel.findAll({
          where:{
            publisherId:id1
          }
        })

        if (!findPost) {
          res.redirect(`/publisher/${id1}/dasboard`);
        } else {
          res.render("../views/publisher/updatePost", {
            post: findPost.dataValues,
            id1: id1,
            community:community
          });
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

router.post(
  "/:id1/dashboard/post/:id2/update",
  upload.single("banner"),
  async (req, res) => {
    const { id1, id2 } = req.params;
    const {
      name,
      description,
      type,
      mode,
      date,
      time,
      link,
      fee,
      state,
      guest,
      contact,
    } = req.body;
    if (req.cookies.publisher) {
      const verify = jwt.verify(
        req.cookies.publisher,
        process.env.JWT_SECRET_TOKEN
      );
      const checkId = await publisherLogin.findByPk(verify);

      if (!checkId) {
        res.redirect("/publisher/login");
      } else {
        const findPublisher = await publisherLogin.findByPk(id1);
        if (!findPublisher) {
          res.redirect(`/publisher/${id1}/dasboard`);
        } else {
          const findPost = await eventModel.findByPk(id2);
          if (!findPost) {
            res.redirect(`/publisher/${id1}/dasboard`);
          } else {
            //Chcek if the image is not update
            if (!req.file) {
              findPost
                .update(req.body)
                .then(() => {
                  res.redirect(`/publisher/${id1}/dashboard`);
                })
                .catch((err) => {
                  res.json({ err: err });
                });
            } else {
              const fileBuffer = req.file.buffer.toString("base64");
              const fileUpload = await cloudinaryConfig.uploader.upload(
                `data:image/png;base64,${fileBuffer}`,
                {
                  folder: "/events",
                  public_id: Date.now() + "-" + req.file.originalname,
                  encoding: "base64",
                }
              );
              findPost
                .update({
                  name: name,
                  description: description,
                  type: type,
                  mode: mode,
                  date: date,
                  time: time,
                  link: link,
                  fee: fee,
                  state: state,
                  guest: guest,
                  contact: contact,
                  banner: fileUpload.secure_url,
                })
                .then(() => {
                  res.redirect(`/publisher/${id1}/dashboard`);
                })
                .catch((err) => {
                  res.json({ err: err });
                });
            }
          }
        }
      }
    } else {
      res.redirect("/publisher/login");
    }
  }
);

//View publisher specific post
router.get("/:id1/dashboard/post/:id2", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const profile = await publisherLogin.findByPk(id1);

      if (!profile) {
        res.redirect("/publisher/login");
      } else {
        const viewPost = await eventModel.findByPk(id2);

        if (!viewPost) {
          res.redirect(`/publisher/${id1}/dashboard`);
        } else {
          res.render("../views/publisher/viewPost", {
            id1: id1,
            profile: viewPost.dataValues,
          });
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//Delete publisher specific post

router.get("/:id1/dashboard/post/:id2/delete", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const publisher = await publisherLogin.findByPk(id1);

      if (!publisher) {
        res.redirect(`/publisher/${id1}/dashboard`);
      } else {
        const deletePost = await eventModel.findByPk(id2);
        if (!deletePost) {
          res.redirect(`/publisher/${id1}/dashboard`);
        } else {
          deletePost.destroy();
          res.redirect(`/publisher/${id1}/dashboard`);
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//GET community Dashboard

router.get("/:id/dashboard/community", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const checkId = await publisherLogin.findByPk(id);
      const post = await eventModel.count({
        where: {
          publisherId: id,
        },
      });
      //check if the ID is valid or not
      if (!checkId) {
        res.redirect(`/publisher/${id}/dashboard`);
      } else {
        const fetchCommunity = await communityModel.findAll({
          where: {
            publisherId: id,
          },
        });

        res.render(`../views/publisher/communityDashboard`, {
          community: fetchCommunity,
          id: id,
          post: post,
        });
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//Get community form

router.get("/:id/dashboard/community/create", async (req, res) => {
  const { id } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const validId = await publisherLogin.findByPk(id);

      if (!validId) {
        res.redirect("/publisher/login");
      } else {
        res.render("../views/publisher/community", {
          id: id,
          emailExist: false,
          name: "",
          email: "",
          description: "",
          place: "",
          location: "",
          social: "",
          mobile: "",
        });
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

//upload community details
router.post(
  "/:id/dashboard/community/create",
  upload.single("logo"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, email, place, location, mobile, social } =
      req.body;

    try {
      //check if the community already registered or not

      if (req.cookies.publisher) {
        const verify = jwt.verify(
          req.cookies.publisher,
          process.env.JWT_SECRET_TOKEN
        );
        const checkId = await publisherLogin.findByPk(verify);

        if (!checkId) {
          res.redirect("/publisher/login");
        } else {
          const checkId = await publisherLogin.findByPk(id);

          if (!checkId) {
            res.redirect(`/publisher/$${id}/dashboard/community`);
          } else {
            const result = await communityModel.findOne({
              where: {
                email: email,
              },
            });

            if (result) {
              res.render("../views/publisher/community", {
                id: id,
                emailExist: true,
                name: name,
                email: email,
                description: description,
                place: place,
                location: location,
                social: social,
                mobile: mobile,
              });
            } else {
              const logoBuffer = req.file.buffer.toString("base64");
              const fileUpload = await cloudinaryConfig.uploader.upload(
                `data:image/png;base64,${logoBuffer}`,
                {
                  folder: "community",
                  public_id: Date.now() + "-" + req.file.originalname,
                  encoding: "base64",
                }
              );

              //store data to the community table

              const storeData = await communityModel
                .create({
                  name: name,
                  description: description,
                  email: email,
                  location: location,
                  place: place,
                  mobile: mobile,
                  social: social,
                  logo: fileUpload.secure_url,
                  publisherId: id,
                  verifierId: checkId.dataValues.verifierId,
                })
                .then((data) => {
                  //after data store to the table naviagate to dashboard
                  res.redirect(`/publisher/${id}/dashboard/community`);
                });
            }
          }
        }
      } else {
        res.redirect("/publisher/login");
      }
    } catch (error) {
      res.json({ err: error.message });
    }
  }
);

router.get("/:id1/dashboard/community/:id2", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const profile = await publisherLogin.findByPk(id1);

      if (!profile) {
        res.redirect("/publisher/login");
      } else {
        const viewCommunity = await communityModel.findByPk(id2);

        if (!viewCommunity) {
          res.redirect(`/publisher/${id1}/dashboard`);
        } else {
          res.render("../views/publisher/viewCommunity", {
            id1: id1,
            profile: viewCommunity.dataValues,
          });
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

router.get("/:id1/dashboard/community/:id2/delete", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const publisher = await publisherLogin.findByPk(id1);

      if (!publisher) {
        res.redirect(`/publisher/${id1}/dashboard/community`);
      } else {
        const deletePost = await communityModel.findByPk(id2);
        if (!deletePost) {
          res.redirect(`/publisher/${id1}/dashboard`);
        } else {
          deletePost.destroy();
          res.redirect(`/publisher/${id1}/dashboard`);
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});


router.get("/:id1/dashboard/community/:id2/update", async (req, res) => {
  const { id1, id2 } = req.params;
  if (req.cookies.publisher) {
    const verify = jwt.verify(
      req.cookies.publisher,
      process.env.JWT_SECRET_TOKEN
    );
    const checkId = await publisherLogin.findByPk(verify);

    if (!checkId) {
      res.redirect("/publisher/login");
    } else {
      const validPublisher = await publisherLogin.findByPk(id1);
      if (!validPublisher) {
        res.redirect(`/publisher/${id1}/dasboard`);
      } else {
        const findCommunity = await communityModel.findByPk(id2);

        if (!findCommunity) {
          res.redirect(`/publisher/${id1}/dasboard/community`);
        } else {
          res.render("../views/publisher/updateCommunity", {
            post: findCommunity.dataValues,
            id1: id1,
          });
        }
      }
    }
  } else {
    res.redirect("/publisher/login");
  }
});

router.post(
  "/:id1/dashboard/community/:id2/update",
  upload.single("logo"),
  async (req, res) => {
    const { id1, id2 } = req.params;
    const {
      name,
      description,
     mobile,location,place,email,social
    } = req.body;
    if (req.cookies.publisher) {
      const verify = jwt.verify(
        req.cookies.publisher,
        process.env.JWT_SECRET_TOKEN
      );
      const checkId = await publisherLogin.findByPk(verify);

      if (!checkId) {
        res.redirect("/publisher/login");
      } else {
        const findPublisher = await publisherLogin.findByPk(id1);
        if (!findPublisher) {
          res.redirect(`/publisher/${id1}/dasboard`);
        } else {
          const findCommunity = await communityModel.findByPk(id2);
          if (!findCommunity) {
            res.redirect(`/publisher/${id1}/dasboard/community`);
          } else {
            //Chcek if the image is not update
            if (!req.file) {
              communityModel
                .update(req.body)
                .then(() => {
                  res.redirect(`/publisher/${id1}/dashboard/community`);
                })
                .catch((err) => {
                  res.json({ err: err });
                });
            } else {
              const fileBuffer = req.file.buffer.toString("base64");
              const fileUpload = await cloudinaryConfig.uploader.upload(
                `data:image/png;base64,${fileBuffer}`,
                {
                  folder: "/events",
                  public_id: Date.now() + "-" + req.file.originalname,
                  encoding: "base64",
                }
              );
              findCommunity
                .update({
                  name: name,
                  description: description,
                  mobile:mobile,
                  social:social,
                  email:email,
                  place:place,
                  location:location,
                  logo: fileUpload.secure_url,
                })
                .then(() => {
                  res.redirect(`/publisher/${id1}/dashboard/community`);
                })
                .catch((err) => {
                  res.json({ err: err });
                });
            }
          }
        }
      }
    } else {
      res.redirect("/publisher/login");
    }
  }
);





//logout route
router.get("/:id/dashboard/logout", async (req, res) => {
  const { id } = req.params;
  const checkId = await publisherLogin.findByPk(id);

  if (!checkId) {
    res.redirect("/publisher/login");
  } else {
    res.clearCookie("publisher");
    res.redirect("/publisher/login");
  }
});

module.exports = router;
