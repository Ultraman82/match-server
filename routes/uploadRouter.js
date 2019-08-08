const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
var User = require('../models/user');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

/* uploadRouter.use(bodyParser.json({limit: '10mb', extended: true}))
uploadRouter.use(bodyParser.urlencoded({limit: '10mb', extended: true})) */
uploadRouter.use(bodyParser.json());


const cpUpload = upload.fields([{ name: 'profile', maxCount: 1 }, { name: 'gallery', maxCount: 4 }])

  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any


uploadRouter.route('/')
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})
.post(cpUpload, (req, res, next) => {
    //console.log(req.body.username);
    User.findOneAndUpdate({username:req.body.username},
     {gallery:req.files.gallery.map(a => a.path.replace('public/', '')), profile:req.files.profile[0].path.replace('public/', '')},      
    {new: true})
  .then((user) => {    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
}, (err) => next(err))
.catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;