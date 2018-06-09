const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var courseSchema = new Schema({
  courseType : String,
  instituteName : String,
  logo : String,
  address : String,
  contact : String,
  email  : String,
  instituteDescription : String,
  available_course : [],
  comment : [],
})

module.exports = mongoose.model('courses',courseSchema)
