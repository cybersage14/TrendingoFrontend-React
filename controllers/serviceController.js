const { MESSAGE_500 } = require("../utils/constants");
const db = require("../utils/db");

exports.getAllServiceTypes = async (req, res) => {
  try {
    const types = await db.query(`SELECT * FROM service_types;`);
    console.log('# types => ', types);
    return res.status(200).send(types);
  } catch (error) {
    console.log('# error => ', error);
    return res.status(500).send(MESSAGE_500);
  }
};