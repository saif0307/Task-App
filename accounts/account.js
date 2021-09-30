const sgMail = require('@sendgrid/mail')
const sgApiKey = process.env.SEND_GRID_API_KEY
sgMail.setApiKey(sgApiKey)


const sendWelcomeMail = (email, name) => {
    sgMail.send( {
        to:email,
        from:'saifocama9@gmail.com',
        subject:'Thanks for Joining in!',
        text:`Hello ${name} welcome to Task App, let me know if you have any questions`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send( {
        to: email,
        from:'saifocama9@gmail.com',
        subject:'Sad to hear you go!',
        text:`We re sad to see you leave ${name}. Can you please take some time to tell us why you left?`
    })
}


module.exports = {
    sendWelcomeMail,
    sendCancelationEmail
}