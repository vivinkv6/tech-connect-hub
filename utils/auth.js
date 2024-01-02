const jwt=require('jsonwebtoken');
require('dotenv').config();

function cookieAuth(id) {
    const token=jwt.sign(id,process.env.JWT_SECRET_TOKEN);
    
    return token
}

module.exports=cookieAuth;