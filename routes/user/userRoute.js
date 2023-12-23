const express=require('express');
const router=express.Router();

//user all routes

//login routes
router.get('/login',(req,res)=>{
    res.render('../views/user/login')
})
router.post('/login',(req,res)=>{
    res.json({msg:"POST LOGIN"});
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