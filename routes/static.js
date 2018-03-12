var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();

function send_file(file,res,next){
    // var file = `${__dirname}\\..\\public\\${req.params.file}`
    console.log(file);
    fs.exists(file, (exists) => {
        if(exists){
            var read = fs.createReadStream(file);
            read.pipe(res);
        }else{
            console.log("File Not Found!");
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        }
    });
}

router.get('/:file', function(req, res, next) {
    console.log(req.session.passport);
    if(!req.session.passport && process.env.DB_CONFIG == 'real'){
        // login page
        req.flash('loginMessage', '정상적으로 접속해주세요.');
        res.redirect("/");
    }else{
        // var file = `${__dirname}\\..\\public\\${req.params.file}`;
        var file = path.join(__dirname,'..','public',req.params.file);
        send_file(file,res,next);
    }
});
router.get('/:file_path/:file', function(req, res, next) {
    //var file = `${__dirname}\\..\\public\\${req.params.file_path}\\${req.params.file}`;
    var file = path.join(__dirname,'..','public',req.params.file_path,req.params.file);
    send_file(file,res,next);
});
module.exports = router;