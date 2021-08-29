'use strict';
const axios = require('axios')

module.exports = function(app, myDataBase) {

  const getLikes = async (stockData) => {

    const result = await Promise.all(stockData.map(async stock => {
      const filter = { stock: stock.symbol };
      const options = { returnDocument: 'after', upsert: true, projection: { "_id": 0, "ips": 0 } }
      const updates = {
        $setOnInsert: {
          stock: stock.symbol,
          likes: 0,
          ips: []
        }
      }
      const res = await myDataBase.findOneAndUpdate(filter, updates, options);

      return { ...res.value, price: stock.latestPrice }
    }))

    return result;
  }

  const updatedlike = async (stockData, ipaddress) => {


    const result = await Promise.all(stockData.map(async (stock) => {
      const filter0 = { stock: stock.symbol };
      const options0 = { projection: { "_id": 0 } }
      
      const { ips } = await myDataBase.findOne(filter0, options0); // get list  of ips
      if (ips === undefined || ips.indexOf(ipaddress) === -1) {
        const filter = { stock: stock.symbol };
        const updates = {
          $inc: { likes: 1 },
          $push: { ips: ipaddress }
        }
        const options = { upsert: true, projection: { "_id": 0, "ips": 0 }, returnDocument: 'after' }
        const res = await myDataBase.findOneAndUpdate(filter, updates, options);
        return { ...res.value, price: stock.latestPrice }
      }
      else if (ips.indexOf(ipaddress) !== -1) {
                  const [stockWithLikes] = await getLikes([stock]);
          return stockWithLikes
      }

    }))
    return result;
  }


  const addRelLike = (data) => data.map((item, index) => {
    if (index == 0)
      item.rel_likes = item.likes - data[1].likes
    else
      item.rel_likes = item.likes - data[0].likes
    return item
  })
  const remLikes = (data) => data.map(item => {
    delete item.likes
    return item
  })

  const getStock = async (stock, like, ipaddress) => {

    const temp = stock.map(stock => axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`))

    let res = await Promise.all(temp)
      .then(async (values) => {
        const stockData = values.map((v) => {
          const { symbol, latestPrice } = v.data;
          return { symbol, latestPrice };
        })
        if (like === 'true') {
          const updatedLike = await updatedlike(stockData, ipaddress)
          return updatedLike;
        }
        else {
          const stockWithLikes = await getLikes(stockData);
          return stockWithLikes
        }

      })

    if (stock.length == 2) {
      res = addRelLike(res)
      res = remLikes(res)
      return { stockData: res };
    }
    return { stockData: res[0] };

  }
  app.route('/api/stock-prices')
    .get(async function(req, res) {
      let { stock, like } = req.query;
      let ipaddress = req.headers["x-forwarded-for"]
      
      if (!ipaddress) ipaddress = '127.0.0.1'//for  testing

      if (typeof stock === 'string')
        stock = [stock];

      res.json(await getStock(stock, like, ipaddress))
    });

  //404 Not Found Middleware.
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

};