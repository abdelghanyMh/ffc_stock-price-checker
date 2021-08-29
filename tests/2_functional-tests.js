const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');


chai.use(chaiHttp);
// NOTE after passing all tests app crashes Idk why ?
suite('Functional Tests', function() {
  let numbreLikesBefore;
  let numbreLikesAfter;
  let msft_likes;
  let goog_likes

  test('Viewing one stock: GET request to /api/stock-prices/', done => {
    chai.request(server)
      .get('/api/stock-prices/?stock=GOOG')
      .end((err, response) => {
        if (err) throw err
        assert.equal(response.status, 200);
        assert.property(response.body.stockData, 'likes', 'Doesnt have likes property');
        assert.property(response.body.stockData, "stock");
        assert.property(response.body.stockData, 'price');
        numbreLikesBefore = response.body.stockData.likes

        done();

      })
  });
  test('Viewing one stock and liking it: GET request to /api/stock-prices/', done => {

    chai.request(server)
      .get('/api/stock-prices/?stock=GOOG&like=true')
      .end((err, response) => {
        if (err) throw err
        assert.equal(response.status, 200);
        assert.equal(response.body.stockData.likes, numbreLikesBefore, 'numbre of Likes didn\'t inceremnt');
        assert.equal(response.body.stockData.stock, "GOOG");
        assert.property(response.body.stockData, 'price');
        numbreLikesAfter = response.body.stockData.likes

        done();
      })
  });
  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', done => {


    chai.request(server)
      .get('/api/stock-prices/?stock=GOOG&like=true')
      .end((err, response) => {
        if (err) throw err
        assert.equal(response.body.stockData.likes, numbreLikesAfter, 'numbre of Likes incorrect');
        done();
      });


  });
  test('Viewing two stocks: GET request to /api/stock-prices/', done => {
    chai.request(server)
      .get('/api/stock-prices/?stock=GOOG&stock=MSFT')
      .end((err, response) => {
        if (err) throw err
        assert.equal(response.status, 200);
        assert.property(response.body.stockData[0], 'rel_likes', 'rel_likes have likes property');
        assert.equal(response.body.stockData[0].stock, "GOOG");
        assert.property(response.body.stockData[0], 'price');

        assert.property(response.body.stockData[1], 'rel_likes', 'Doesn\'t have rel_likes property');
        assert.equal(response.body.stockData[1].stock, "MSFT");
        assert.property(response.body.stockData[1], 'price');
        done();

      })
  });
  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', done => {

    chai.request(server)
      .get('/api/stock-prices/?stock=GOOG')
      .end((err, response) => {
        if (err) throw err
        goog_likes = response.body.stockData.likes

      });
    chai.request(server)
      .get('/api/stock-prices/?stock=MSFT')
      .end((err, response) => {
        if (err) throw err
        msft_likes = response.body.stockData.likes
  });
  chai.request(server)
    .get('/api/stock-prices/?stock=GOOG&stock=MSFT&like=true')
    .end((err, response) => {
      if (err) throw err
      assert.equal(response.status, 200);
      assert.equal(response.body.stockData[0].rel_likes, goog_likes - msft_likes, 'the difference between the likes on both stocks in false');
      assert.equal(response.body.stockData[0].stock, "GOOG");
      assert.property(response.body.stockData[0], 'price');

      assert.equal(response.body.stockData[1].rel_likes, msft_likes - goog_likes, 'the difference between the likes on both stocks in false');
      assert.equal(response.body.stockData[1].stock, "MSFT");
      assert.property(response.body.stockData[1], 'price');
      done();

    })
});
});