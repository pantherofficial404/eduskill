var express = require('express');
var router = express.Router();
var User = require('../models/user')
var passport = require('passport')
var nodemailer = require('nodemailer')
var async = require('async')
var crypto = require('crypto')
var bcrypt = require('bcrypt')
var Course = require('../models/courses')
var multer = require('multer')
var path = require('path')
var fs = require('fs')
var url = require('url')
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
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyC_W2QaRiFEj4HU-F_uyAlN2oUXKcBoPZw'
});
/* GET home page. */
router.get('/',function(req, res, next) {
  if(req.isAuthenticated()){
  var i = 16
  var limit = i
  var number = req.params.id * i - i;
  Course.find({},(err,count)=>{
    if(err){
      res.render('error')
    }else{
      var array = []
      for(i=0;i<count.length;i++){
        array.push({name:count[i].instituteName})
      }
      Course.find({},(err,course)=>{
        if(err){
          res.render('error')
        }else{
          if(count.length-number<=0){
            res.render('error')
          }else{
            i = limit
            pageArray = []
            var page = Math.ceil(count.length/i)
            for(i=1;i<=page;i++){
              pageArray.push({number : i})
            }
            res.render('home',{course:course,array:array,page:pageArray})
          }
        }
      }).limit(limit).skip(number)
    }
  })
  }else{
      res.render('index');
  }
});

// Sign In Routes

router.get('/signup',notLoggedIn,(req,res,next)=>{
  var message = req.flash('error')
  res.render('user/signup',{messages:message})
})

router.post('/signup',notLoggedIn,passport.authenticate('local-signup',{
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true,
}))

router.get('/signin',notLoggedIn,(req,res,next)=>{
  let message = req.flash('error')
  res.render('user/login',{messages:message})
})

router.post('/signin',notLoggedIn,passport.authenticate('local-signin',{
  failureRedirect: '/signin',
  failureFlash: true,
}),function(req,res,next){
  var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pantherofficial404@gmail.com',
    pass: 'Panther@143'
  }
});

var mailOptions = {
  from: 'pantherofficial404@gmail.com',
  to: req.user.email,
  subject: 'Login In Student Academy',
  text: 'Hello We Are From Student Academy.You have Recently Logged with your account in Student Academy'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent');
  }
});
  res.redirect('/')
})

// Forgot Route

router.get('/forgot',notLoggedIn,(req,res,next)=>{
  var message = req.flash('error')
  res.render('user/forgot',{messages:message})
})

router.post('/forgot',notLoggedIn,(req,res,next)=>{
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 10*60*1000; // 10 minutes

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'pantherofficial404@gmail.com',
          pass: 'Panther@143'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'pantherofficial404@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    req.flash('error','Please Check Your Register Email For Further Info!!')
    res.redirect('/signin');
  });
});

router.get('/reset/:token',notLoggedIn,function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('user/reset', {token: req.params.token});
  });
});

router.post('/reset/:token',notLoggedIn,function(req, res,next) {
  async.waterfall([
    function(done){
      User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
        if(err){
          console.log(err)
        }
        if(!user){
          req.flash('error',"Your Token is Expired")
          res.redirect('back')
        }
        if(user){
          var password = req.body.password
          user.password = user.encryptPassoword(password)
          resetPasswordToken = undefined;
          resetPasswordExpires = undefined;
          user.save((err)=>{
            if(err) console.log(err)
            done(err,user)
          })
        }
      })
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'pantherofficial404@gmail.com',
          pass: 'Panther@143'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'pantherofficial404@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You Have Successfully Changed Your Password'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ],function(err){
    if(err) return next(err)
    req.flash('error','Congo!! Your Password Has been Changed')
    res.redirect('/signin')
  })
})

router.get('/google',passport.authenticate('google',{
  scope : ['https://www.googleapis.com/auth/userinfo.profile']
}))

router.get('/google/callback',passport.authenticate('google'),function(req,res,next){
  res.redirect('/')
})


router.get('/logout',(req,res,next)=>{
  req.logout();
  res.redirect('/')
})

router.get('/profile',isLoggedIn,(req,res,next)=>{
  var message = req.flash('success')
  res.render('user/profile',{profile:req.user,message:message})
})
router.post('/profile',isLoggedIn,(req,res,next)=>{
  upload(req,res,(err)=>{
    if(err){
      res.render('user/profile',{error:'Image should be less than 1MB',profile:req.user})
    }
    else{
        User.findOne({_id :  req.user},function(err,user){
          if(err){
            res.render('user/profile',{error:"Something Went Wrong",profile:req.user})
          }else{
            if(user.comparePassword(req.body.currentPassword)){
              user.firstname = req.body.firstname
              user.lastname = req.body.lasttname
              user.email = req.body.email
              user.password = user.encryptPassoword(req.body.currentPassword)
              if(req.file!=undefined){
                  var image = './'+user.profile
                  image = image.replace('upload','public\\upload')
                  fs.unlink(image,function(err){
                  if(err) return console.log(err);
             }); 
                var path = req.file.path
                path = path.replace('public\\','/')
                user.profile = path
              }
              user.save((err)=>{
                if(err){
                  res.render('user/profile',{error:"Something Went Wrong.. Please Try Again",profile:req.user})
                }
              })
              req.flash('success','Profile Updated Successfully')
              res.redirect('/profile')
            }else{
            res.render('user/profile',{error:'Please Enter Your Current Password',profile:req.user})
            }
          }
        })
    }
  })
})
router.get('/course/:id',isLoggedIn,(req,res,next)=>{
  Course.findOne({_id : req.params.id},function(err,course){
    if(err){
      res.render('error')
    }
    if(course==null){
      res.render('error')
    }else{
      var message = req.flash('success')
      res.render('user/course',{message:message,course:course,list:course.available_course,comment:course.comment,url:req.headers.host+url.parse(req.url).pathname})
      }
  })
})

router.post('/comment/:id',isLoggedIn,(req,res,next)=>{
  Course.findOne({_id : req.params.id},function(err,course){
    if(err){
      req.flash('success','Something Went Wrong.. Please Try Again');
      res.redirect('/course/'+req.params.id)
    }else{
      var name;
      if(req.user.firstname){
        name = req.user.firstname
      }else{
        name = req.user.username
      }
      var time = new Date().toLocaleString();
      var comment  = req.body.comment
      course.comment.push({user:name,time:time,comment:comment})
      course.save((err)=>{
        if(err){
          req.flash('success','Something Went Wrong.. Please Try Again');
          res.redirect('/course/'+req.params.id)
        }else{
          req.flash('success','Comment Added Successfully')
          res.redirect('/course/'+req.params.id)
        }
      })
    }
  })
})

router.get('/page/:id',isLoggedIn,(req,res,next)=>{
  var i = 16
  var limit = i
  var number = req.params.id * i - i;
  Course.find({},(err,count)=>{
    if(err){
      res.render('error')
    }else{
      var array = []
      for(i=0;i<count.length;i++){
        array.push({name:count[i].instituteName})
      }
      Course.find({},(err,course)=>{
        if(err){
          res.render('error')
        }else{
          if(count.length-number<=0){
            res.render('error')
          }else{
            i = limit
            pageArray = []
            var page = Math.ceil(count.length/i)
            for(i=1;i<=page;i++){
              pageArray.push({number : i})
            }
            res.render('home',{course:course,array:array,page:pageArray})
          }
        }
      }).limit(limit).skip(number)
    }
  })
})

router.post('/search',isLoggedIn,(req,res,next)=>{
  var search = req.body.query
  console.log(search)
  Course.find({},function(err,count){
    if(err){
      res.render('error')
    }else{
      Course.find({$or:[{instituteName:new RegExp(search)},{courseType:new RegExp(search)}]},function(err,course){
        if(err){
          res.render('error')
        }else{
          var array = []
          for(i=0;i<count.length;i++){
            array.push({name:count[i].instituteName})
          }
          res.render('home',{course:course,array:array})
        }
      })
    }
  })
})
module.exports = router;

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/')
}

function notLoggedIn(req,res,next){
    if(!req.isAuthenticated()){
        return next()
    }
    res.redirect('/')
}
