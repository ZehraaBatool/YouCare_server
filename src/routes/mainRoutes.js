const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const{addingProduct, getProductDetails, deleteProduct, editProductQuantity, editProductPrice, getAllProducts}=require('../controllers/productsController');
const { getCustomerInfo, getRegCustomerById, getRegisteredCustomer, signUp, signIn } = require('../controllers/customerController');
const { getOrderDetails, getParticularOrder,checkoutInfo } = require('../controllers/orderController');
const { getShipmentDetails, getParticularShipment } = require('../controllers/shipmentController');

router.post('/add-product', upload.single('picture'),addingProduct)
router.get('/product/:product_id',getProductDetails)
router.delete("/product/:product_id",deleteProduct)
router.put("/product/:product_id/quantity",editProductQuantity)
router.put("/product/:product_id/price",editProductPrice)
router.get('/product',getAllProducts)
router.get('/customers',getCustomerInfo)
router.get('/registered-customers',getRegisteredCustomer)
router.get('/registered-customers/:user_id',getRegCustomerById)
router.post("/sign-up",signUp)
router.post("/login",signIn)
router.get('/orderDetails',getOrderDetails)
router.get('/orderDetails/:order_id',getParticularOrder)
router.post('/checkout',checkoutInfo)
router.get("/shipment",getShipmentDetails)
router.get('/shipment/:shipping_id',getParticularShipment)


module.exports = router;