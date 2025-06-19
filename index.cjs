var express = require('express')
var ejs = require('ejs')
//var bodyParser = require('body-parser');
var mysql = require('mysql2');


var app = express();

app.use(express.static('public'));
app.set('view engine','ejs');

app.listen(8080);
//app.use(bodyParser.urlencoded({extended:true}));

//HOME PAGE
app.get('/',function(req,res)
{
    res.render('pages/website');
});

//PRODUCTS PAGE
app.get('/products',function(req,res)
{
    var con = mysql.createConnection({
        host: "localhost",
        user:"root",
        password:"22bai1452",
        database:"ecommerce_app"

    });
    con.query("CALL getproducts();",(err,result)=>{
        res.render('pages/products',{result:result[0]});
    });
});

//PRODUCTS DETAILS PAGE
app.get('/product/:id', function(req, res) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    const prodId = req.params.id;
    con.query("CALL getproddet(?);", [prodId], (err, result) => {
        res.render('pages/product_details', { product: result[0][0] });
  });
});

//CART PAGE
app.get('/cart', function(req, res) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    con.query("CALL getcartitems();", (err, result) => {
        res.render('pages/cart', { cartItems: result[0] });
    });
});
