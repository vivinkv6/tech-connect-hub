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
const path = require("path");

const ExcelJS = require("exceljs");
const { Sequelize } = require("sequelize");

//GET Admin login route
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

//POST Admin login route
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


//Admin Authentication Middleware
router.use(async (req, res, next) => {
  console.log("MiddleWare work");
  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);
    if (!findId) {
      res.clearCookie("admin");
      res.redirect(`/admin/login`);
    } else {
      next();
    }
    console.log("Authenticated");
  } else {
    res.redirect("/admin/login");
  }
});

//GET Admin Dashboard -> get all users list
router.get("/dashboard", async (req, res) => {
  const users = await userLogin.findAll({
    order: [["createdAt", "DESC"]],
  });
  res.render("../views/admin/dashboard", { users: users });
});

//GET Admin Dashboard -> delete specific user
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

//GET Admin Dashboard -> get all publisher list
router.get("/dashboard/publisher", async (req, res) => {
  const publishers = await publisherLogin.findAll({
    order: [["createdAt", "DESC"]],
  });
  res.render("../views/admin/publisher", { publishers: publishers });
});

//GET Admin Dashboard -> delete specific publisher
router.get("/dashboard/publisher/delete/:id", async (req, res) => {
  const { id } = req.params;

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
});

//GET Admin Dashboard -> get all verifier list
router.get("/dashboard/verifier", async (req, res) => {
  const verifierList = await verifierLogin.findAll({
    order: [["createdAt", "DESC"]],
  });
  res.render("../views/admin/verifier", { verifier: verifierList });
});

//GET Admin Dashboard ->  delete specific verifier
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

//GET Admin Dashboard -> create new verifier account
router.get("/dashboard/verifier/create", (req, res) => {
  res.render("../views/admin/verifierSignup", {
    emailExist: false,
    passwordError: false,
    email: "",
    password: "",
    confirm: "",
  });
});

//GET Admin Dashboard -> get all community list
router.get("/dashboard/community", async (req, res) => {
  const communityList = await communityRegistration.findAll({
    order: [["createdAt", "DESC"]],
  });

  res.render("../views/admin/community", { community: communityList });
});

//GET Admin Dashboard -> get details about specific community
router.get("/dashboard/community/view/:id", async (req, res) => {
  const { id } = req.params;

  const viewCommunity = await communityRegistration.findByPk(id);

  if (!viewCommunity) {
    res.redirect(`/admin/dashboard/community`);
  } else {
    res.render("admin/viewcommunity", {
      profile: viewCommunity.dataValues,
    });
  }
});

//GET Admin Dashboard -> delete specific community
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

//GET Admin Dashboard ->  all event post list
router.get("/dashboard/post", async (req, res) => {
  try {
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
  } catch (err) {
    res.json({ err: err.message });
  }

  // res.render("../views/admin/post",{post:postList});
});

//GET Admin Dashboard ->  View specific event post
router.get("/dashboard/post/view/:id", async (req, res) => {
  const { id } = req.params;

  const viewPost = await eventModel.findByPk(id);

  if (!viewPost) {
    res.redirect(`/admin/dashboard`);
  } else {
    res.render("admin/viewpost", {
      profile: viewPost.dataValues,
    });
  }
});

//GET Admin Dashboard -> delete specific post
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

//GET Admin Dashboard -> Generate report of all users in current month
router.get("/report/user", async (req, res) => {
  let report = [];

  const fetchUsers = await userLogin.findAll({});

  fetchUsers.filter((item) => {
    const itemMonth = new Date(item.dataValues.createdAt).getMonth() + 1;
    console.log(itemMonth);
    console.log(new Date().getMonth() + 1);
    if (itemMonth == new Date().getMonth() + 1) {
      report.push(item.dataValues);
    }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`User${new Date().getMonth() + 1}`);
  const column = (worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Role", key: "role", width: 15 },
    { header: "Place", key: "place", width: 15 },
    { header: "Username", key: "username", width: 15 },
    { header: "Email", key: "email", width: 30 },
  ]);

  report.forEach((data) => {
    const rowData = {
      id: data.id,
      name: data.name,
      role: data.role,
      place: data.place,
      username: data.username,
      email: data.email,
    };
    worksheet.addRow(Object.values(rowData));
  });

  console.log(__dirname);
  workbook.xlsx
    .writeFile(path.join(__dirname, "excel", "UserReport.xlsx"))
    .then(() => {
      res.sendFile(
        path.join(__dirname, "excel", "UserReport.xlsx"),
        "UserReport.xlsx",
        (err) => {
          if (err) {
            res.status(500).json({ error: "Error sending the file" });
          } else {
            console.log("File sent successfully");
          }
        }
      );
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

//GET Admin Dashboard -> Generate report of all publishers in current month
router.get("/report/publisher", async (req, res) => {
  let report = [];

  const fetchPublisher = await publisherLogin.findAll({});

  fetchPublisher.filter((item) => {
    const itemMonth = new Date(item.dataValues.createdAt).getMonth() + 1;
    console.log(itemMonth);
    console.log(new Date().getMonth() + 1);
    if (itemMonth == new Date().getMonth() + 1) {
      report.push(item.dataValues);
    }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `Publisher${new Date().getMonth() + 1}`
  );
  const column = (worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Role", key: "role", width: 15 },
    { header: "Place", key: "place", width: 15 },
    { header: "Community", key: "community", width: 15 },
    { header: "Mobile", key: "mobile", width: 15 },
    { header: "Socialmedia", key: "socialmedia", width: 30 },
  ]);

  report.forEach((data) => {
    const rowData = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      place: data.place,
      community: data.community,
      mobile: data.mobile,
      socialmedia: data.socialmedia,
    };
    worksheet.addRow(Object.values(rowData));
  });

  console.log(__dirname);
  workbook.xlsx
    .writeFile(path.join(__dirname, "excel", "PublisherReport.xlsx"))
    .then(() => {
      res.sendFile(
        path.join(__dirname, "excel", "PublisherReport.xlsx"),
        "PublisherReport.xlsx",
        (err) => {
          if (err) {
            res.status(500).json({ error: "Error sending the file" });
          } else {
            console.log("File sent successfully");
          }
        }
      );
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

//GET Admin Dashboard -> Generate report of all communities in current month

router.get("/report/community", async (req, res) => {
  let report = [];

  const fetchCommunity = await communityRegistration.findAll({});

  fetchCommunity.filter((item) => {
    const itemMonth = new Date(item.dataValues.createdAt).getMonth() + 1;
    console.log(itemMonth);
    console.log(new Date().getMonth() + 1);
    if (itemMonth == new Date().getMonth() + 1) {
      report.push(item.dataValues);
    }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `Community${new Date().getMonth() + 1}`
  );
  const column = (worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Email", key: "email", width: 30 },
    { header: "Place", key: "place", width: 15 },
    { header: "Location", key: "location", width: 15 },
    { header: "Social", key: "social", width: 30 },
    { header: "Mobile", key: "mobile", width: 15 },
  ]);

  report.forEach((data) => {
    const rowData = {
      id: data.id,
      name: data.name,
      description: data.description,
      email: data.email,
      place: data.place,
      location: data.location,
      social: data.social,
      mobile: data.mobile,
    };
    worksheet.addRow(Object.values(rowData));
  });

  console.log(__dirname);
  workbook.xlsx
    .writeFile(path.join(__dirname, "excel", "CommunityReport.xlsx"))
    .then(() => {
      res.sendFile(
        path.join(__dirname, "excel", "CommunityReport.xlsx"),
        "CommunityReport.xlsx",
        (err) => {
          if (err) {
            res.status(500).json({ error: "Error sending the file" });
          } else {
            console.log("File sent successfully");
          }
        }
      );
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

//GET Admin Dashboard -> Generate report of all event post in current month
router.get("/report/post", async (req, res) => {
  let report = [];

  const fetchEvent = await eventModel.findAll({});

  fetchEvent.filter((item) => {
    const itemMonth = new Date(item.dataValues.createdAt).getMonth() + 1;
    console.log(itemMonth);
    console.log(new Date().getMonth() + 1);
    if (itemMonth == new Date().getMonth() + 1) {
      report.push(item.dataValues);
    }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `EventPost${new Date().getMonth() + 1}`
  );
  const column = (worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Type", key: "type", width: 30 },
    { header: "Mode", key: "Mode", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 15 },
    { header: "Link", key: "link", width: 15 },
    { header: "Fee", key: "fee", width: 15 },
    { header: "District", key: "district", width: 15 },
    { header: "Banner", key: "banner", width: 15 },
    { header: "Contact", key: "contact", width: 15 },
    { header: "Guest", key: "guest", width: 15 },
    { header: "Community", key: "community", width: 15 },
  ]);

  report.forEach((data) => {
    const rowData = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      mode: data.mode,
      date: data.date,
      time: data.time,
      link: data.link,
      fee: data.link,
      district: data.district,
      banner: data.banner,
      contact: data.contact,
      guest: data.guest,
      community: data.community,
    };
    worksheet.addRow(Object.values(rowData));
  });

  console.log(__dirname);
  workbook.xlsx
    .writeFile(path.join(__dirname, "excel", "EventReport.xlsx"))
    .then(() => {
      res.sendFile(
        path.join(__dirname, "excel", "EventReport.xlsx"),
        "EventReport.xlsx",
        (err) => {
          if (err) {
            res.status(500).json({ error: "Error sending the file" });
          } else {
            console.log("File sent successfully");
          }
        }
      );
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

//GET Admin Dashboard ->  admin logout
router.get("/dashboard/logout", (req, res) => {
  res.clearCookie("admin");
  res.redirect("/admin/login");
});
module.exports = router;
