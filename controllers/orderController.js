const db = require("../utils/db");

exports.addNewOrder = async (req, res) => {
  const {
    userId,
    telegramUsername,
    alternativeUsername,
    orderItems,
    originPrice,
    discountPercentage,
    realPrice
  } = req.body;

  try {
    let newOrder = (await db.query(`
      INSERT INTO orders (
        id_user, 
        telegram_username, 
        alternative_telegram_username, 
        origin_price, 
        discount_percentage, 
        sold_price
      ) VALUES (
        ${userId},
        '${telegramUsername}',
        '${alternativeUsername}',
        ${originPrice},
        ${discountPercentage},
        ${realPrice}
      )
    `));

    for (let i = 0; i < orderItems.length; i += 1) {
      let queryOfFields = `(id_order, service_type, service_title, price`;
      let queryOfValues = `(
        ${newOrder.insertId}, 
        '${orderItems[i].service_type}', 
        '${orderItems[i].service_title}', 
        ${price}
      `;

      for (let key in orderItems[i]) {
        queryOfFields += `, ${key}`;
        queryOfValues += `, '${orderItems[i][key]}'`;
      }

      queryOfFields += ')';
      queryOfValues += ')';

      await db.query(`INSERT INTO order_items ${queryOfFields} VALUES ${queryOfValues};`);
    }
    return res.status(201).send('');
  } catch (error) {
    console.log('# error => ', error);
    return res.status(500).send('');
  }
};