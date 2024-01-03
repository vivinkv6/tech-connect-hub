const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");
const publisherModel = require("./registrationModel");

const eventModel = sequelizeConfig.define("eventpost", {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fee: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guest: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  community:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  publisherId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
});

eventModel.associate = () => {
  eventModel.belongsTo(publisherModel, { foreignKey: "publisherId" });
};

module.exports = eventModel;
