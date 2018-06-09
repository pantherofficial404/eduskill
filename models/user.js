const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt')
const saltRound = 10
var userSchema = new Schema({
  email : String,
  firstname : String,
  lastname : String,
  password : String,
  resetPasswordToken : String,
  resetPasswordExpires : Date,
  profile : String,
  googleId : String,
  username : String,
  isAdmin  : {type:Boolean,default:false}
})

userSchema.methods.encryptPassoword = function(password){
  return bcrypt.hashSync(password, saltRound,null)
}

userSchema.methods.comparePassword = function(password){
  return bcrypt.compareSync(password, this.password)
}
module.exports = mongoose.model('user',userSchema);
