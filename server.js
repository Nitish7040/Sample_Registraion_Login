const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 12;
dotenv.config();

const app = express();
const PORT = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static('public'));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Connected to the database successfully!');
  }
});

// Routes
app.get('/', (req, res) => {
    res.render('home', { title: 'Signup Form' });
  });
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Signup Form' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login Form' });
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { title: 'Dashboard' }); // Replace 'dashboard' with your actual dashboard view
  });
  



// Post method for signup the user =============================================
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  const hash = await bcrypt.hash(password, saltRounds);

  try {
    const result = await pool.query(
      'INSERT INTO users ("First name", "Last name", "Email", "Password") VALUES ($1, $2, $3, $4)',
      [firstName, lastName, email, hash]
    );

    console.log('User added successfully:', result.rows[0]);
    res.send('<h2>Signup successful!<h2><a href="/">Go Back</a>');
  } catch (error) {
    console.error('Error adding user:', error.message);
    res.status(500).send('<h2>Signup failed!<h2><a href="/">Try Again</a>');
  }
});

// Post method for login the user ======================================================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {

      const result = await pool.query('SELECT * FROM users WHERE "Email" = $1', [email]);  
 
      if (result.rows.length > 0) {
        const user = result.rows[0];
  
        // console.log('User found:', user);

        if (!user.Password) {
          return res.status(401).send('<h2>Password not found in database!<h2><a href="/login">Try Again</a>');
        }
  
      
        const match = await bcrypt.compare(password, user.Password); 
  
        if (match) {

          res.redirect('/dashboard');
        } else {
         
          res.status(401).send('<h2>Invalid credentials!<h2><a href="/login">Try Again</a>');
        }
      } else {
        res.status(401).send('<h2>User not found!<h2><a href="/login">Try Again</a>');
      }
    } catch (error) {
      console.error('Error logging in user:', error.message);
      res.status(500).send('<h2>Login failed!<h2><a href="/login">Try Again</a>');
    }
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
