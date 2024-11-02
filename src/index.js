const express = require('express')
const app = express()
const multer = require('multer');
const cors = require("cors")
const pool = require('../db')
const bcrypt = require('bcryptjs');



app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// routes
// add product in product table
app.post("/add-product", upload.single('picture'), async (req, res) => {
    try {
        const { product_id, product_name, description, price, quantity, category_id, rating } = req.body;
        const picture = req.file.buffer;

        const addProduct = await pool.query('INSERT INTO product(product_id,product_name,description,price,picture,quantity,category_id,rating)values($1, $2, $3, $4, $5, $6, $7, $8)', [product_id, product_name, description, price, picture, quantity, category_id, rating])
        res.status(201).send('Product added successfully');
    } catch (error) {
        console.error(error.message)
    }
});

// get product details
app.get('/product/:product_id', async (req, res) => {
    const { product_id } = req.params;
  
    try {
      const selectQuery = 'SELECT * FROM product WHERE product_id = $1';
      const result = await pool.query(selectQuery, [product_id]);
  
      if (result.rows.length > 0) {
        const product = result.rows[0];
        // Assuming 'image_data' is the column containing bytea data
        const imageData = product.picture.toString('base64');
        const productWithBase64Image = {
          ...product,
          image_data: imageData,
        };
        res.json(productWithBase64Image);
      } else {
        res.status(404).send('Product not found');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

//delete product
app.delete("/product/:product_id", async (req, res) => {
    try {
        const { product_id } = req.params;
        const deleteproduct = await pool.query("DELETE FROM product WHERE product_id=$1", [product_id])

        if (deleteproduct.rowCount > 0) {
            res.status(200).send('Product deleted successfully');
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});
// edit product quantity
app.put("/product/:product_id/quantity", async (req, res) => {
    const { quantity } = req.body;
    const { product_id } = req.params;
    if (quantity === undefined) {
        return res.status(400).send("Quantity is required");
    }
    try {
        const editquantity = await pool.query("UPDATE product SET quantity=$1 WHERE product_id=$2", [quantity, product_id])

        if (editquantity.rowCount > 0) {
            res.status(200).send('Product quantity updated successfully');
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// edit product price
app.put("/product/:product_id/price", async (req, res) => {
    const { price } = req.body;
    const { product_id } = req.params;
    if (price === undefined) {
        return res.status(400).send("price is required");
    }
    try {
        const editprice = await pool.query("UPDATE product SET price=$1 WHERE product_id=$2", [price, product_id])

        if (editprice.rowCount > 0) {
            res.status(200).send('Product price updated successfully');
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// get all products
app.get('/product', async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM product';
        const result = await pool.query(selectQuery);
        res.json(result.rows)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//  get customer information
app.get('/customers', async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM customer';
        const result = await pool.query(selectQuery);
        res.json(result.rows)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// insert customer information(sign up)
app.post("/sign-up", async (req, res) => {
    try {
        const { username, password, email, phoneno } = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const addcustomer = await pool.query('INSERT INTO registration(username,password,email,phoneno)values($1, $2, $3, $4)', [username, hashedPassword, email, phoneno])
        res.status(201).send(' registered customer added successfully');
    } catch (error) {
        console.error(error.message)
    }
});

// sign in

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch customer by email
        const customerQuery = await pool.query('SELECT password FROM registration WHERE email = $1', [email]);
        console.log(customerQuery.rows); // Log query result

        if (customerQuery.rowCount > 0) {
            const hashedPassword = customerQuery.rows[0].password;

            bcrypt.compare(password, hashedPassword, (err, result) => {
                if (err) {
                    res.status(500).json({ error: 'Internal server error' });
                } else if (result) {
                    res.status(200).json({ message: 'Login successful' });
                } else {
                    res.status(401).json({ error: 'Invalid username or password' });
                }
            });
        } else {
            res.status(404).json({ error: 'registered user not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


// get all order details
app.get('/orderDetails', async (req, res) => {
    try {
      const selectQuery = `
        SELECT 
          customer.customer_id, customer.username, customer.email,customer.phoneno,customer.address,customer.city, "order".order_id, "order".total_amount,
          order_item.product_id, order_item.total_quantity, product.product_name
        FROM 
          customer
        INNER JOIN 
          "order" ON customer.customer_id = "order".customer_id
        INNER JOIN 
          order_item ON "order".order_id = order_item.order_id
        INNER JOIN 
          product ON order_item.product_id = product.product_id;
      `;
  
      const result = await pool.query(selectQuery);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// get particular order detail

app.get('/orderDetails/:order_id', async (req, res) => {
    const { order_id } = req.params;
  
    try {
      const selectQuery = `
        SELECT 
          customer.customer_id, customer.username, customer.email, customer.phoneno, customer.address, customer.city, 
          "order".order_id, "order".total_amount,
          order_item.product_id, order_item.total_quantity, product.product_name
        FROM 
          customer
        INNER JOIN 
          "order" ON customer.customer_id = "order".customer_id
        INNER JOIN 
          order_item ON "order".order_id = order_item.order_id
        INNER JOIN 
          product ON order_item.product_id = product.product_id
        WHERE 
          "order".order_id = $1;
      `;
      
      const result = await pool.query(selectQuery, [order_id]);
  
      if (result.rows.length > 0) {
        res.json(result.rows);
      } else {
        res.status(404).send('Order detail not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).send('Internal Server Error');
    }
  });  

  app.post('/checkout', async (req, res) => {
    const {
        username,
        phoneno,
        products, // Array of product names and quantities
        total_amount,
        email,
        address,
        city,
        zip_code
    } = req.body;

    if (!username || !phoneno || !products || !total_amount || !email || !address || !city || !zip_code) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        function generateCustomerId() {
            return 'CU' + Math.floor(Math.random() * 1000000);
        }
        const customer_id = generateCustomerId();

        const customerQuery = `
            INSERT INTO customer (customer_id, username, phoneno, email, address, city, zip_code) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const customerValues = [customer_id, username, phoneno, email, address, city, zip_code];

        await pool.query(customerQuery, customerValues);

        function generateOrderId() {
            return 'OI' + Math.floor(Math.random() * 10000000);
        }

        const order_id = generateOrderId();

        
        console.log('Generated Order ID:', order_id); // Debugging log

        const orderQuery = `
            INSERT INTO "order" (order_id, customer_id, total_amount) 
            VALUES ($1, $2, $3)
        `;
        const orderValues = [order_id, customer_id, total_amount];
        await pool.query(orderQuery, orderValues);

        function generateItemId() {
            return 'II' + Math.floor(Math.random() * 100000);
        }

        const item_id = generateItemId();

        const orderItemQuery = `
            INSERT INTO order_item (customer_id, order_id, product_id, total_quantity,item_id) 
            VALUES ($1, $2, $3, $4 ,$5)
        `;
        for (const product of products) {
            const productResult = await pool.query('SELECT product_id FROM product WHERE product_name = $1', [product.name]);
            const product_id = productResult.rows[0]?.product_id;

            if (!product_id) {
                throw new Error(`Product not found: ${product.name}`);
            }

            const orderItemValues = [customer_id, order_id, product_id, product.quantity,item_id];
            await pool.query(orderItemQuery, orderItemValues);
        }

        function generateShippingId() {
            return 'SH' + Math.floor(Math.random() * 1000000);
        }
        const shipping_id = generateShippingId();

        function generateTrackingNumber() {
            return 'TR' + Math.floor(Math.random() * 1000000);
        }
        const tracking_number = generateTrackingNumber();

        function generateShipmentAndDeliveryDates() {
            const currentDate = new Date();
        
            const shipmentDate = new Date(currentDate);
            shipmentDate.setDate(shipmentDate.getDate() + 2);
        
            const deliveryDate = new Date(currentDate);
            deliveryDate.setDate(deliveryDate.getDate() + 7);
        
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
            };
        
            return {
                shipment_date: formatDate(shipmentDate),
                delivery_date: formatDate(deliveryDate)
            };
        }
        
        const { shipment_date, delivery_date } = generateShipmentAndDeliveryDates();

        const shipmentQuery = `
            INSERT INTO shipment (shipping_id, order_id, shipping_address, shipment_date, delivery_date, tracking_number) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const shipmentValues = [shipping_id, order_id, address, shipment_date, delivery_date, tracking_number];
        await pool.query(shipmentQuery, shipmentValues);

        const shipmentDetailsQuery = 'SELECT * FROM shipment WHERE order_id = $1';
        const shipmentDetailsResult = await pool.query(shipmentDetailsQuery, [order_id]);

        res.status(201).json({ message: 'Order and shipment successfully placed', shipment: shipmentDetailsResult.rows[0] });
    } catch (error) {
        console.error('Error saving shipment details:', error);
        res.status(500).json({ error: 'An error occurred while entering shipment details' });
    }
});

// get all shipment details
app.get("/shipment", async (req, res) => {
    try {
        try {
            const selectQuery = 'SELECT * FROM shipment';
            const result = await pool.query(selectQuery);
            res.json(result.rows)
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }

    } catch (error) {

    }
})

// get particular shipment detail

app.get('/shipment/:shipping_id', async (req, res) => {
    const { shipping_id } = req.params;

    try {
        const selectQuery = 'SELECT * FROM shipment WHERE shipping_id = $1';
        const result = await pool.query(selectQuery, [shipping_id]);

        if (result.rows.length > 0) {
            const order = result.rows[0];
            res.json(order);
        } else {
            res.status(404).send('shipment detail not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




app.listen(5000, () => {
    console.log(`Server is running on http://localhost:5000/`);
});