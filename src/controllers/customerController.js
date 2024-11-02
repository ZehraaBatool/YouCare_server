const pool=require('../../db')
const bcrypt = require('bcryptjs');

//  get customer information
const getCustomerInfo= async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM customer';
        const result = await pool.query(selectQuery);
        res.json(result.rows)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
};

//  get registered customer information
const getRegisteredCustomer= async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM registration';
        const result = await pool.query(selectQuery);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
};

 const getRegCustomerById=async (req, res) => {
    const { user_id } = req.params;
    try {
        const selectQuery = 'SELECT * FROM registration WHERE user_id = $1';
        const result = await pool.query(selectQuery, [user_id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('registered customer detail not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
};

// insert customer information(sign up)
const signUp = async (req, res) => {
    try {
        const { username, password, email, phoneno } = req.body;

        if (!username || !password || !email || !phoneno) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const addcustomer = await pool.query(
            'INSERT INTO registration(username, password, email, phoneno) VALUES($1, $2, $3, $4) RETURNING *',
            [username, hashedPassword, email, phoneno]
        );

        if (addcustomer.rowCount === 0) {
            return res.status(500).json({ error: 'Failed to add customer to the database' });
        }

        res.status(201).json({ message: 'Customer registered successfully' });
    } catch (error) {
        if (error.code === '23505') {  // PostgreSQL error code for unique constraint violation
            res.status(409).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
            console.log(error.message)
        }
    }
};


// sign in

 const signIn=async (req, res) => {
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
        res.status(500).json({ error: 'Internal Server Error', details: error.message });    }
};


module.exports={
    getCustomerInfo,getRegisteredCustomer,getRegCustomerById,signIn,signUp
}