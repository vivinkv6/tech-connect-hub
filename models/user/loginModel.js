const { DataTypes } = require("sequelize");

const sequelize = require("../../config/sequelize.config");

const user = sequelize.define("userlogins", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  role:{
    type: DataTypes.STRING,
    allowNull: false,
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
  saved:{
    type:DataTypes.ARRAY(DataTypes.STRING),
    allowNull:true
  }
});

module.exports = user;
