const pool=require('../../db')


// get all order details
const getOrderDetails= async (req, res) => {
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
      res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
  };

// get particular order detail

const getParticularOrder= async (req, res) => {
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
      res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
  };  

 const checkoutInfo= async (req, res) => {
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
        return res.status(400).json({ error: 'All fields are required', details: error.message });
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
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
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
};
module.exports={
    getOrderDetails,getParticularOrder,checkoutInfo
}
