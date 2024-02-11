const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const publisherlogin = require("./registrationModel");
const verfierLogin = require("../verifier/loginModel");
const eventModel = require("./eventModel");

const communityRegistration = sequelizeConfig.define("communityregistration", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  place: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  social: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  publisherId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  verifierId:{
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  postId:{
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  }
});

communityRegistration.associate = () => {
  communityRegistration.belongsTo(publisherlogin, {
    foreignKey: "publisherId",
  });
  communityRegistration.belongsTo(verfierLogin,{foreignKey:"verifierId"})
  communityRegistration.hasMany(eventModel,{foreignKey:"postId"})
  
};

module.exports = communityRegistration;