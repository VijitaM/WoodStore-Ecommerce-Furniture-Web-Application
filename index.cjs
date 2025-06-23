var express = require('express')
var ejs = require('ejs')
var mysql = require('mysql2')

var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.listen(8080);

const userId = 'abc123';  // default user for now

// HOME PAGE
app.get('/', (req, res) => {
    res.render('pages/website');
});
app.get('/website', (req, res) => {
    res.render('pages/website');
});
app.get('/about', (req, res) => {
    res.render('pages/about');
});
app.get('/contact', (req, res) => {
    res.render('pages/contact');
});

// PRODUCTS PAGE
app.get('/products', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    con.query("CALL getproducts();", (err, result) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).send("Database error");
        }
        res.render('pages/products', { result: result[0] });
    });
});

// PRODUCT DETAILS PAGE
app.get('/product/:id', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    const prodId = req.params.id;
    con.query("CALL getproddet(?);", [prodId], (err, result) => {
        if (err) {
            console.error("Error fetching product details:", err);
            return res.status(500).send("Database error");
        }
        con.query("SELECT quantity FROM cart WHERE user_id = ? AND pid = ?", [userId, prodId], (err2, cartResult) => {
            if (err2) throw err2;
             const qtyInCart = cartResult.length > 0 ? cartResult[0].quantity : 0;
        res.render('pages/product_details', { product: result[0][0],qty: qtyInCart });
    });
});
});


// ADD TO CART
app.get('/addtocart/:id', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    const prodId = req.params.id;
    con.query("CALL addtocart(?, ?);", [userId, prodId], (err, result) => {
        if (err) {
            console.error("Add to cart error:", err);
            return res.status(500).send("Could not add item to cart.");
        }
        res.redirect('/cart');
    });
});

// VIEW CART
app.get('/cart', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    con.query("CALL getcartitems(?);", [userId], (err, result) => {
        if (err) {
            console.error("Error fetching cart items:", err);
            return res.status(500).send("Database error");
        }
        res.render('pages/cart', { cart: result[0] });
    });
});

// INCREMENT QUANTITY
app.get('/cart/increment/:pid', (req, res) => {
    res.redirect(`/addtocart/${req.params.pid}`);
});

// DECREMENT QUANTITY
app.get('/cart/decrement/:pid', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
    const pid = req.params.pid;
    con.connect(err => {
        if (err) return res.status(500).send("Database connection error");

        const sql = `UPDATE cart SET quantity = quantity - 1 WHERE user_id = ? AND pid = ? AND quantity > 0`;
        con.query(sql, [userId, pid], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database update error");
            }

            // Delete if quantity hits 0
            const deleteSql = `DELETE FROM cart WHERE user_id = ? AND pid = ? AND quantity = 0`;
            con.query(deleteSql, [userId, pid], () => {
                res.redirect('/cart');
            });
        });
    });
});

//CATEGORY PAGE
app.get('/category/:cid', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "22bai1452",
        database: "ecommerce_app"
    });
  const cid = req.params.cid;

  con.query("SELECT p.id,p.pname, p.img_path, p.pcost, c.cate_name FROM products p JOIN categories c ON p.cate_id = c.cate_id WHERE p.cate_id = ? and p.qty>0", [cid], (err, result) => {
    if (err) {
      res.send("Database error");
    } else {
      res.render("pages/category", { products: result });
    }
  });
});

//CATEGORYCOUT ITEM ICON 
app.get('/cartitemcount/:userid', (req, res) => {
  const uid = req.params.userid;
  const sql = `CALL getcartitemcount(?)`;
  var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
});

  conn.query(sql, [uid], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ count: result[0][0].itemCount });
  });
});
