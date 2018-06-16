const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user')
const GoogleStrategy = require('passport-google-oauth20')
passport.serializeUser((user,done)=>{
  done(null,user.id)
})

passport.deserializeUser((id,done)=>{
  User.findById(id,function(err,user){
    done(err,user)
  })
})

passport.use('local-signup',new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true,
},function(req,email,password,done){
  User.findOne({'email':email},function(err,user){
    if(err){
      return done(err)
    }
    if(user){
      return done(null,false,{message:'User is Already Exists'})
    }
    password = req.body.password
    confirmPassword = req.body.confirmPassword
    if(password!=confirmPassword){
      return done(null,false,{message:'Please Enter Same Password'})
    }
    var user = User();
    user.email = email
    user.firstname = req.body.firstname
    user.lastname = req.body.lastname
    user.password = user.encryptPassoword(password)
    user.save(function(err,result){
      if(err){
        return done(err)
      }else{
        return done(null,user)
      }
    })
  })
}))

passport.use('local-signin',new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true,
},function(req,email,password,done){
  User.findOne({'email':email},function(err,user){
    if(err){
      return done(err)
    }
    if(!user){
      return done(null,false,{message:'User Does Not Exists'})
    }
    if(!user.comparePassword(password)){
      return done(null,false,{message:'You have Entered Wrong Password'})
    }
    if(req.header == '/web/login'){
      if(user.isAdmin){
        return done(null,user)
      }else{
        return done(null,false,{message:'You Are Not Admin'})
      }
    }else{
    return done(null,user)
    }
  })
}))


passport.use(new GoogleStrategy({
    clientID: '190417956574-70a2ig0neeefpqip50svmtv169pa7aaa.apps.googleusercontent.com',
    clientSecret: 'vhBw_j_IuoKUcK2X2dB0V9fU',
    callbackURL: "/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      User.findOne({'googleId':profile.id},function(err,user){
        if(user){
          done(null,user)
        }else{
          console.log(profile)
          var user = new User()
          user.username = profile.displayName
          user.googleId = profile.id
          user.save(function(err){
            if(err){
              console.log(err)
            }
            done(null,user)
          })
        }
      })
  }
));


