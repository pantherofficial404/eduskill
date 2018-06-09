var router = require('express').Router();
var passport = require('passport')
var nodemailer = require('nodemailer')
var User = require('../models/user')
var Course = require('../models/courses')
var multer = require('multer');
var path = require('path')
var Course = require('../models/courses')
var fs = require('fs')
const storage = multer.diskStorage({
  destination : './public/upload',
  filename : function(req,file,cb){
    cb(null,req.user.email+'-'+Date.now()+path.extname(file.originalname))
  }
})

const upload = multer({
  storage : storage,
  limits : {fileSize:1000000},
  fileFilter : function(req,file,cb){
    checkFileType(file,cb)
  }
}).single('image')

function checkFileType(file,cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLocaleLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if(mimetype && extname){
    return cb(null,true)
  }else{
    cb('Error : Please Upload Images Only')
  }
}

router.get('/admin',isLoggedIn,(req,res,next)=>{
  Course.find({},(err,course)=>{
    if(err){
      res.redirect('error')
    }
    else{
    var message = req.flash('success')
    res.render('admin/index',{course:course,message:message})
    }
  })
  
});

router.post('/admin',isLoggedIn,(req,res,next)=>{
  upload(req,res,(err)=>{
    if(err){
      res.render('admin/index',{image:err})
    }else{
      if(req.file === undefined){
        res.render('admin/index',{image:'Please Upload Image'})
      }
      else{
        var json = ''
        json = JSON.stringify(req.body);
        json = json.split('"')
        var available_course = []
        var temp = 31;
        for(var i =1;i<=req.body.numberOfCourses;i++){
          available_course.push({subject : json[temp],fee : json[temp+4],time:json[temp+8]})
          temp+=12
        }
        var course = new Course()
        var path = req.file.path
        path = path.replace('public\\','/')
        course.instituteName = req.body.institute_name
        course.address = req.body.institute_address
        course.contact = req.body.institute_phone
        course.email = req.body.institute_email
        course.instituteDescription = req.body.institute_description
        course.available_course = available_course
        course.logo = path
        course.courseType = req.body.type
        course.save((err)=>{
          if(err)
          {
            console.log(err)
          }
          else{
            req.flash('success','Data Uploaded Successfully')
            res.redirect('/web/admin')
          }
        })
        
      }
    }
  })
})

router.get('/login',notLoggedIn,(req,res,next)=>{

  var message = req.flash('error')
  res.render('admin/login',{messages: message})
})

router.post('/login',notLoggedIn,passport.authenticate('local-signin',{
  successRedirect  : '/web/admin',
  failureRedirect : '/web/login',
  failureFlash : true,
}))

router.get('/image',(req,res,next)=>{
  res.render('admin/upload')
})
router.post('/image',(req,res,next)=>{
  upload(req,res,(err)=>{
    if(err){
      res.render('admin/upload',{message:err})
    }else{
      console.log(req.file);
      if(req.file == 'undefined'){
        res.render('admin/upload',{message:'Please Upload File'})
      }
      else{
        res.render('admin/upload',{message:'image Uploaded',img:req.file.filename})
      }
    }
  })
})

router.get('/delete/:id',isLoggedIn,(req,res,next)=>{
  id = req.params.id;
  Course.findOne({_id : id},(err,course)=>{
    if(err){
      res.render('error')
    }else{
      var image = './'+course.logo
      image = image.replace('upload','public/upload')
      if(course.logo!=null && fs.existsSync(image)){
        fs.unlink(image,(err)=>{
          if(err){
            req.flash('success','something went wrong')
            res.redirect('/web/admin')
          }
        })
      }
      Course.remove({_id : id},(err)=>{
        if(err){
          req.flash('success','something went wrong')
          res.redirect('/web/admin')
        }else{
          req.flash('success','Classes Deleted Successfully')
          res.redirect('/web/admin')
        }
      })
        } 
      })
  })
module.exports = router;

function isLoggedIn(req,res,next){
  if(req.isAuthenticated() && req.user.isAdmin){
    return next();
  }
  else{
    res.redirect('/web/login');
  }
}

function notLoggedIn(req,res,next){
  if(!req.isAuthenticated()){
    return next()
  }
  if(req.user.isAdmin === false){
    res.redirect('/')
  }
  res.redirect('/web/admin')
}