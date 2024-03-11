var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const rateLimit = require('express-rate-limit');

//router files
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var userRouter = require("./routes/user/userRoute");
var adminRouter=require('./routes/admin/adminRoute');
var verifierRouter=require('./routes/verifier/verifierRoute');
var publisherRouter=require('./routes/publisher/publisherRoute');

//config file
const sequelizeConfig = require("./config/sequelize.config");


var app = express();

// view engine setup
app.set('views', '/opt/render/project/src/views');
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Configure the rate limiter for all routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute in milliseconds
  max: 100, // Allow 100 requests per minute
  message: 'Too many requests, please try again later', // Customize error message
});

app.use(limiter);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//route middleware
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/user", userRouter);
app.use("/admin",adminRouter);
app.use("/verifier",verifierRouter);
app.use("/publisher",publisherRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

(async () => {
  try {
    await sequelizeConfig.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );

    // Sync the model with the database
    sequelizeConfig
      .sync({
        alter:true
      })
      .then(() => {
        console.log("All Tables created successfully");
      })
      .catch((error) => {
        console.error("Error creating table:", error);
      });

    console.log("Model synchronized with the database.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();


module.exports = app;
