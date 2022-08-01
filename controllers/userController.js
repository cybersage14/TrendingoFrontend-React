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
const Sib = require("../utils/Sib");

/** Add a new user */
exports.addUser = async (req, res) => {
  const { walletAddress, influenceToken } = req.body;
  let newUser = null;

  //  Check whether this user is already registered or not.
  const existedUser = await (await db.query(`
    SELECT * FROM users WHERE wallet_address = '${walletAddress}';
  `))[0];

  //  If this user had been registered, don't add newly.
  if (existedUser) {
    if (!existedUser.influenced_by) {
      //  If a user who had registered tries to get discount off.
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

  // If this user was invited by referral link by a user
  if (influenceToken) {
    //  Get the user who sent that link.
    jwt.verify(influenceToken, config.get('jwtSecret'), async (error, decoded) => {
      if (error) {
        newUser = await (await db.query(`
          INSERT INTO users (wallet_address) VALUES('${walletAddress}')
        `));
      } else {
        //  The user who sent that link (We can say this user "inviter").
        const influencer = await (await db.query(`
          SELECT * FROM users WHERE id = ${decoded.id};
        `))[0];

        if (influencer) {
          newUser = await (await db.query(`
            INSERT INTO users (wallet_address, influenced_by) 
            VALUES('${walletAddress}', '${decoded.id}')
          `));
        } else {
          //  If inviter isn't registered in DB, the link receiver can't get 10% discount off.
          newUser = await (await db.query(`
            INSERT INTO users (wallet_address) VALUES('${walletAddress}')
          `));
        }
      }
      return res.status(201).json({ userId: newUser.insertId });
    });
  } else {
    newUser = await (await db.query(`
      INSERT INTO users (wallet_address) VALUES('${walletAddress}')
    `));
    return res.status(201).json({ userId: newUser.insertId });
  }
};

/** Send a man a referral link */
exports.influence = async (req, res) => {
  //  userId - sender's id
  //  userEmail - sender's email
  //  guestEmail - receiver's email
  const { userId, userEmail, guestEmail } = req.body;

  //  Sender's data
  const influencer = (await db.query(`SELECT * FROM users WHERE id = ${userId};`))[0];

  //  Make a token using sender's data
  jwt.sign({ ...influencer }, config.get('jwtSecret'), {}, (error, token) => {
    if (error) {
      console.log('# error => ', error);
      return res.status(500).send(MESSAGE_500);
    }

    const tranEmailApi = new Sib.TransactionalEmailsApi();
    let sender = { email: userEmail };
    let receivers = [{ email: guestEmail }];

    let mailOptions = {
      sender,
      to: receivers,
      subject: 'Please visit Trendingo site.',
      htmlContent: `<a href="${SITE_BASIC_URL}/influence/${token}">Click Here to visit Trendingo</a>`
    };

    //  Send receiver an email.
    tranEmailApi.sendTransacEmail(mailOptions)
      .then((result) => {
        console.log('# result => ', result);
        return res.status(200).send(MESSAGE_EMAIL_SENT_SUCCESS);
      })
      .catch(error => {
        console.log('# error => ', error);
        return res.status(500).send(MESSAGE_EMAIL_SENT_FAILED);
      });
  });
};

/** Check a user had received a referral link or not, had sent one or not  */
exports.checkWhetherInfluencer = async (req, res) => {
  const { userId } = req.params;
  //  Sender?
  const influenceds = await db.query(`SELECT * FROM users WHERE influenced_by = ${userId};`);

  //  Receiver?
  const user = (await db.query(`SELECT * FROM users WHERE id = ${userId};`))[0];

  if (influenceds.length > 0 || user.influenced_by) {
    return res.status(200).send(true);
  } else {
    return res.status(200).send(false);
  }
};