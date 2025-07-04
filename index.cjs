var express = require('express')
var ejs = require('ejs')
var mysql = require('mysql2')

var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));


app.listen(8080);

const userId = '9juh8p';  // default user for now
const currencyFormatter = require('currency-formatter');
app.locals.formatCurrency = function (amount) {
  return currencyFormatter.format(amount, { code: 'INR' });
};

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

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  con.query("CALL getproducts(?, ?)", [limit, offset], (err, result) => {
      if (err) {
          console.error("Error fetching products:", err);
          return res.status(500).send("Database error");
      }
      con.query("SELECT COUNT(*) AS totalCount FROM products WHERE qty > 0", (countErr, countResult) => {
          if (countErr) {
              console.error("Count error:", countErr);
              return res.status(500).send("Count error");
          }

          const totalProducts = countResult[0].totalCount;
          const totalPages = Math.ceil(totalProducts / limit);

          res.render('pages/products', {
              result: result[0],
              currentPage: page,
              totalPages: totalPages
          });
      });
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
  const userId = "9juh8p";

  con.query("CALL getproddet(?);", [prodId], (err, result) => {
    if (err) return res.status(500).send("Database error");
    const product = result[0][0];
    if (!product) return res.status(404).send("Product not found");
    con.query("SELECT quantity FROM cart WHERE user_id = ? AND pid = ?", [userId, prodId], (err2, cartResult) => {
      if (err2) throw err2;
      const qtyInCart = cartResult.length > 0 ? cartResult[0].quantity : 0;
      con.query("CALL getsimilar_prod(?, ?)", [product.cate_id, prodId], (err3, similarResult) => {
        if (err3) throw err3;
        con.query("SELECT r.*, u.user_name FROM reviews r JOIN userdetails u ON r.user_id = u.user_id WHERE r.pid = ?", [prodId], (err4, reviewsResult) => {
          if (err4) throw err4;
          res.render('pages/product_details', {product: product,qty: qtyInCart,similarProducts: similarResult[0],userId: userId,reviews: reviewsResult  });
        });
      });
    });
  });
});


app.post('/submitreview/:id', (req, res) => {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });
  const prodId = req.params.id;
  const { user_id, rating, opinion } = req.body;

  const insertQuery = "INSERT INTO reviews (pid, user_id, rating, rev_text) VALUES (?, ?, ?, ?)";
  con.query(insertQuery, [prodId, user_id, rating, opinion], (err, result) => {
    if (err) {
      console.error("Error inserting review:", err); return res.status(500).send("Failed to submit review");
    }
    res.redirect('/product/' + prodId);
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
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  con.query("CALL get_category(?)", [cid], (countErr, countResult) => {
    if (countErr) {
      console.error("Error fetching product count:", countErr); return res.send("Database error (count)");
    }

    const totalProducts = countResult[0][0].totalCount;
    const totalPages = Math.ceil(totalProducts / limit);

    con.query("CALL get_category_page(?, ?, ?)", [cid, limit, offset], (err, result) => {
      if (err) {
        console.error("Error fetching products:", err); return res.send("Database error (products)");
      }
      res.render("pages/category", {products: result[0],currentPage: page,totalPages: totalPages,cateId: cid
      });
    });
  });
});

//BRAND PAGE
app.get('/brand/:pbrand', (req, res) => {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });
  const brand = req.params.pbrand;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  con.query("CALL get_brand(?)", [brand], (countErr, countResult) => {
    if (countErr) {
      console.error("Database error (count)", countErr); return res.status(500).send("Database error (count)");
    }

    const totalProducts = countResult[0][0].totalCount;
    const totalPages = Math.ceil(totalProducts / limit);
    con.query("CALL get_brand_page(?, ?, ?)", [brand, limit, offset], (err, result) => {
      if (err) {
        console.error("Error fetching brand products:", err); return res.status(500).send("Database error (products)");
      }
      res.render("pages/brand", {brandProducts: result[0],pbrand: brand,currentPage: page,totalPages: totalPages
      });
    });
  });
});


//CATEGORY COUNT ITEM ICON 
app.get('/cartitemcount/:userid', (req, res) => {
  const uid = req.params.userid;
  const sql = `CALL getcartitemcount(?)`;
  var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
});
  conn.query(sql, [uid], (err, result) => { if (err) return res.status(500).send(err); res.json({ count: result[0][0].itemCount });});
});

//ORDER PLACING 
app.post('/orders', (req, res) => {
    var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
});
  con.query("SELECT c.pid,c.quantity,p.pcost FROM cart c join products p on c.pid=p.id WHERE user_id = ?", [userId], (err, cartItems) => {
    if (err) return res.send("Error fetching cart");

    if (cartItems.length === 0) return res.send("Cart is empty!");

    const total = cartItems.reduce((sum, item) => sum + item.pcost * item.quantity, 0);

    con.query("INSERT INTO orders (user_id, totalamt) VALUES (?, ?)", [userId, total], (err, orderResult) => {
      if (err) return res.send("Error placing order: " + err.sqlMessage);


      const orderId = orderResult.insertId;
      const orderItems = cartItems.map(item => [orderId, item.pid, item.quantity, item.pcost]);

      con.query("INSERT INTO order_items (order_id, pid, qty, pcost) VALUES ?", [orderItems], (err) => {
        if (err) return res.send("Error adding order items");

        con.query("DELETE FROM cart WHERE user_id = ?", [userId], (err) => {
          if (err) return res.send("Order placed, but cart not cleared");
          res.redirect('/orders'); 
        });
      });
    });
  });
});

//ORDER PLACEMENT PAGE
app.post('/placeorder', (req, res) => {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
});
  con.query("SELECT c.pid, c.quantity, p.pcost, p.img_path, p.pname FROM cart c JOIN products p ON c.pid=p.id WHERE user_id = ?", [userId], (err, cartItems) => {
    if (err) return res.send("Error fetching cart");
    if (cartItems.length === 0) return res.send("Cart is empty!");

    const total = cartItems.reduce((sum, item) => sum + item.pcost * item.quantity, 0);

    con.query("INSERT INTO orders (user_id, totalamt) VALUES (?, ?)", [userId, total], (err, orderResult) => {
      if (err) return res.send("Error placing order: " + err.sqlMessage);

      const orderId = orderResult.insertId;
      const orderItems = cartItems.map(item => [orderId, item.pid, item.quantity, item.pcost]);

      con.query("INSERT INTO order_items (order_id, pid, qty, pcost) VALUES ?", [orderItems], (err) => {
        if (err) return res.send("Error adding order items");

        con.query("DELETE FROM cart WHERE user_id = ?", [userId], (err) => {
          if (err) return res.send("Order placed, but cart not cleared");

          con.query("SELECT date FROM orders WHERE order_id = ?", [orderId], (err, dateResult) => {
            if (err) return res.send("Error fetching order date");

            const orderDate = dateResult[0].date;
            res.render("pages/order_success", {orderId,orderDate,total,items: cartItems
            });
          });
        });
      });
    });
  });
});

//ORDERS PAGE
app.get('/orders', (req, res) => {
  const userId = "9juh8p";
  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });
  const query = "CALL get_user_orders(?)";
  con.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error calling stored procedure: ", err); return res.send("Could not fetch orders");
    }
    res.render("pages/orders", { orders: result[0] }); 
});
});

//PROFILE PAGE
app.get('/login', (req, res) => {
  const mysql = require("mysql");
  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });

  const userId = "9juh8p"; 
  const query = "CALL getuser_details(?)";

  con.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error calling stored procedure: ", err); return res.send("Could not fetch profile details");
    }
    const user = {
      user_name: result[0][0].user_name,user_id: userId,email_id: result[0][0].email_id,add1: result[0][0].add1,
      add2: result[0][0].add2,city: result[0][0].city,state: result[0][0].state,pincode: result[0][0].pincode,phone: result[0][0].phone
    };
    res.render("pages/login", { user });
  });
});


// ADMIN PAGE
app.get('/admin', (req, res) => {
  const success = req.query.success;

  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });
  con.query("SELECT * FROM categories", (catErr, categories) => {
    if (catErr) {
      console.error("Category fetch error:", catErr); return res.send("Error fetching categories.");
    }
    con.query("SELECT * FROM products", (prodErr, products) => {
      if (prodErr) {
        console.error("Product fetch error:", prodErr);
        return res.send("Error fetching products.");
      }
      let message = "";
      if (success === '1') message = "Product added successfully!";
      else if (success === '0') message = "Error adding product.";
      res.render("pages/admin", { products, categories, message });
    });
  });
});


// ADMIN ADD PRODUCT
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.post('/addproduct', upload.single('product_image'), (req, res) => {
  const { pname, pcost, pbrand, sdes, pdes, qty, cate_id } = req.body;
  const imgPath = req.file.filename;

  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
  });
  const addProductQuery = "CALL admin_add(?, ?, ?, ?, ?, ?, ?, ?)";
  con.query(addProductQuery, [pname, pcost, imgPath, pbrand, sdes, pdes, cate_id, qty], (err) => {
    if (err) {
      console.error("Product insert error via procedure:", err);
      return res.redirect("/admin?success=0");
    }
    res.redirect("/admin?success=1");
  });
});

// ADMIN DELETE PRODUCT
app.get('/deleteproduct/:id', (req, res) => {
   var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "22bai1452",
    database: "ecommerce_app"
});
  con.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.send("Error deleting product");
    res.redirect('/admin');
  });
});


