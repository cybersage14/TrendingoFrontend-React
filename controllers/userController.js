const { MESSAGE_ALREADY_EXISTED_USER, MESSAGE_INVALID_INFLUENCE_TOKEN } = require("../utils/constants");
const db = require("../utils/db");

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
        console.log('# decoded.walletAddress => ', decoded.walletAddress);

        const influencer = (await db.query(`
          SELECT * FROM users WHERE wallet_address = '${decoded.walletAddress}';
        `))[0];

        console.log('# influencer => ', influencer);

        if (influencer) {
          newUser = (await db.query(`
            INSERT INTO users (wallet_address, influenced_by) 
            VALUES('${walletAddress}', '${influencer.id}')
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