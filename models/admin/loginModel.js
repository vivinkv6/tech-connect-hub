const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const adminLogin = sequelizeConfig.define(
  "adminlogin",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }
);

module.exports = adminLogin;
