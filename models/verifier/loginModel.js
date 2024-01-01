const {DataTypes} =require('sequelize');
const sequelizeConfig=require('../../config/sequelize.config');
const verification=require('./verification');
const publisherRegistration = require('../publisher/registrationModel');
const communityRegistration = require('../publisher/communityRegistrationModel');

const verfierLogin=sequelizeConfig.define("verifierlogin",{
    id:{
        type:DataTypes.STRING,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4,
        allowNull:false
    },
    username:{
        type:DataTypes.STRING,
        allowNull:false
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false
    }
});

verfierLogin.associate=()=>{
    verfierLogin.hasMany(verification,{foreignKey:"verifierId"})
    verfierLogin.hasMany(publisherRegistration,{foreignKey:"verifierId"})
    verfierLogin.hasMany(communityRegistration,{foreignKey:"verifierId"})
}

module.exports=verfierLogin