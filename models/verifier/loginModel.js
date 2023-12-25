const {DataTypes} =require('sequelize');
const sequelizeConfig=require('../../config/sequelize.config');

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

module.exports=verfierLogin