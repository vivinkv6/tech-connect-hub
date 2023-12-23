const express=require('express');
const router=express.Router();
const bycrypt=require('bcrypt');

const userlogin=require('../../models/user/loginModel');


//user all routes

//login routes
router.get('/login',(req,res)=>{
    res.render('../views/user/login')
})

router.post('/login',async(req,res)=>{

    console.log("start");
   
try{

    const {email,password}=req.body;
    
   const result= await userlogin.findOne({
        where:{
            email:email
        }
    })

    if(!result){
        res.redirect('/user/login')
    }
    else{
       bycrypt.compare(password,result.password,(err,data)=>{
        if(err){
            res.json({err:err.message})
        }
        else{
            if(data){
                res.redirect('/')
            }
            else{
                res.redirect('/user/login')
            }
        }
       })
    }

}catch(err){
    res.json({err:err.message})
}

})

//signup routes
router.get('/signup',(req,res)=>{
    res.json({msg:"GET SIGNUP"});
})
router.post('/signup',(req,res)=>{
    res.json({msg:"POST SIGNUP"});
})

//user dashboard
router.get('/dashboard',(req,res)=>{
    res.json({msg:"User Dashboard"})
})

module.exports=router