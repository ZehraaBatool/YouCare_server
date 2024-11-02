require('dotenv').config();
const express = require('express')
const app = express()
const cors = require("cors")
const port = process.env.PORT;
const mainRoutes=require('./src/routes/mainRoutes')

app.use(cors({
    origin: 'https://you-care-client.vercel.app/', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true // Allows cookies to be sent
}));
app.use(express.json());

app.use('/skincare', mainRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;