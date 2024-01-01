const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");
const eventModel = require("./eventModel");
const communityModel = require("./communityRegistrationModel");
const verfierLogin = require("../verifier/loginModel");

const publisherRegistration = sequelizeConfig.define("publisherlogin", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  proof: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verifierId:{
    type: DataTypes.STRING,
    allowNull: false,
  }
});

publisherRegistration.associate = () => {
  publisherRegistration.hasMany(eventModel, { foreignKey: "publisherId" });
  publisherRegistration.hasMany(communityModel, { foreignKey: "publisherId" });
  publisherRegistration.belongsTo(verfierLogin,{foreignKey:"verifierId"})
};

module.exports = publisherRegistration;
