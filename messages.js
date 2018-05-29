const config = require('./config')

var messages = {
    email: {
        registration: {
            plain: "Welcome to " + config.app.title + "!\n\nPlease copy the link below and past it on your browser location bar to verify your account.\n\n||URL||\n\nThank you!",
            html: "Welcome to " + config.app.title + "!\n<br/><br/>Please click the link below to verify your account.\n<br/>\n<br/><a href='||URL||'>Click here to verify your account</a>\n<br/>\n<br/>Thank you!",
        },
        forgotpassword: {
            plain: "You have requested to reset your password.\n\nPlease copy the link below and past it on your browser location bar to change your password.\n\n||URL||\n\nIf you did not make this request, please disregard this message. Thank you!",
            html: "You have requested to reset your password.\n<br/><br/>Please click the link below to change your password.\n<br/>\n<br/><a href='||URL||'>Click here to change your password</a>\n<br/>\n<br/>If you did not make this request, please disregard this message. Thank you!",
		},
		subscription: {
			subject: "Subscription successful",
			plain: "Thank you ||Name|| from " + config.app.title + "!\n\nWe have recieved your payment for your subscription.\n\n\nThank you!",
            html: "Thank you ||Name|| from " + config.app.title + "!\n<br/><br/>We have recieved your payment for your subscription.\n<br/>\n<br/>\n<br/>Thank you!",
		},
		unsubscription: {
			subject: "Unsubscription successful",
			plain: "Thank you ||Name|| from " + config.app.title + "!\n\nWe have recieved your request for your unsubscription and have successfully processed it.\n\n\nRegards!",
            html: "Thank you ||Name|| from " + config.app.title + "!\n<br/><br/>We have recieved your request for your unsubscription and have successfully processed it.\n<br/>\n<br/>\n<br/>Regards!",
		}
    }
}

module.exports = messages