const pool=require('../../db')


// get all shipment details
 const getShipmentDetails=async (req, res) => {
    try {
        try {
            const selectQuery = 'SELECT * FROM shipment';
            const result = await pool.query(selectQuery);
            res.json(result.rows)
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });;
        }

    } catch (error) {

    }
};

// get particular shipment detail

 const getParticularShipment=async (req, res) => {
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
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports={
    getParticularShipment,getShipmentDetails
}
