const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const publisherRegistration = sequelizeConfig.define("publisherdetails", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  community: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  socialmedia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  place: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mob: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  proof: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = publisherRegistration;
