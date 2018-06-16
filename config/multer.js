const mongoose = require('mongoose');
var multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const crypto  = require('crypto');

// Databse Setup

const MONGO = "mongodb://root:abc123@ds259210.mlab.com:59210/panther404"
// Databse Setup 
const conn = mongoose.createConnection(MONGO);

// GridFs
let gfs;
conn.once("open",()=>{
    gfs = Grid(conn.db,mongoose.mongo);
    gfs.collection('uploads');
})

// Create Storage Engine
const storage = new GridFsStorage({
    url: MONGO,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
      
    }
  });
  const upload = multer({
      storage:storage,
      limits : {fileSize : 100000},
      fileFilter : function(req,file,cb){
        checkFileType(file,cb)
      }
    }).single('file')
    
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
