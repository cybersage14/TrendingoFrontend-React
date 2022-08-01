const jwt = require('jsonwebtoken');
const config = require('config');
const {
  MESSAGE_ALREADY_EXISTED_USER,
  MESSAGE_INVALID_INFLUENCE_TOKEN,
  MESSAGE_500,
  SITE_BASIC_URL,
  MESSAGE_EMAIL_SENT_SUCCESS,
  MESSAGE_EMAIL_SENT_FAILED
} = require("../utils/constants");
const db = require("../utils/db");
const mailTransporter = require('../utils/mailTransporter');

exports.addUser = async (req, res) => {
  const { walletAddress, influenceToken } = req.body;
  let newUser = null;

  const existedUser = (await db.query(`
    SELECT * FROM users WHERE wallet_address = '${walletAddress}';
  `))[0];

  if (existedUser) {
    if (!existedUser.influenced_by) {
      if (influenceToken) {
        return res.status(200).json({
          userId: existedUser.id,
          message: MESSAGE_INVALID_INFLUENCE_TOKEN
        });
      }
    }
    return res.status(200).json({
      userId: existedUser.id,
      message: MESSAGE_ALREADY_EXISTED_USER
    });
  }

  if (influenceToken) {
    jwt.verify(accessToken, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        newUser = (await db.query(`
          INSERT INTO users (wallet_address) VALUES('${walletAddress}')
        `));
      } else {
        console.log('# decoded => ', decoded);

        const influencer = (await db.query(`
          SELECT * FROM users WHERE wallet_address = '${decoded.id}';
        `))[0];

        console.log('# influencer => ', influencer);

        if (influencer) {
          newUser = (await db.query(`
            INSERT INTO users (wallet_address, influenced_by) 
            VALUES('${walletAddress}', '${decoded.id}')
          `));
        } else {
          newUser = (await db.query(`
            INSERT INTO users (wallet_address) VALUES('${walletAddress}')
          `));
        }
      }
    });
  } else {
    newUser = (await db.query(`
      INSERT INTO users (wallet_address) VALUES('${walletAddress}')
    `));
  }
  return res.status(201).json({ userId: newUser.insertId });
};

exports.influence = async (req, res) => {
  const { userId, userEmail, guestEmail } = req.body;
  const influencer = (await db.query(`SELECT * FROM users WHERE id = ${userId};`))[0];

  jwt.sign({ ...influencer }, config.get('jwtSecret'), {}, (error, token) => {
    if (error) {
      console.log('# error => ', error);
      return res.status(500).send(MESSAGE_500);
    }
    console.log('# token => ', token);
    let mailOptions = {
      from: userEmail,
      to: guestEmail,
      subject: 'Please visit Trendingo site.',
      html: `<a href="${SITE_BASIC_URL}?influence-token=${token}">Click Here to visit Trendingo</a>`
    };

    mailTransporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).send(MESSAGE_EMAIL_SENT_FAILED);
      } else {
        console.log('Email sent: ' + info.response);
        return res.status(200).send(MESSAGE_EMAIL_SENT_SUCCESS);
      }
    });
  });
};

exports.checkWhetherInfluencer = async (req, res) => {
  const { userId } = req.params;
  const influenceds = await db.query(`SELECT * FROM users WHERE influenced_by = ${userId};`);

  if (influenceds.length > 0) {
    return res.status(200).send(true);
  } else {
    return res.status(200).send(false);
  }
};