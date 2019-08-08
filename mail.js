var nodemailer = require('nodemailer');

verifyMail = (email) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'exelcior99@gmail.com',
      pass: 'bau0099@'
    }
  });
  
  var mailOptions = {
    from: 'Match42@gmail.com',
    to: email,
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

verifyMail("zugugaselu@rmailcloud.com");
