const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produkt finns inte' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/products', async (req, res) => {
  try {
    const { name, quantity, price, category } = req.body;
    
   
    if (!name || !quantity || !price || !category) {
      return res.status(400).json({ error: 'Alla fält krävs: name, quantity, price, category' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, quantity, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, quantity, price, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, category } = req.body;

    const result = await pool.query(
      'UPDATE products SET name=$1, quantity=$2, price=$3, category=$4 WHERE id=$5 RETURNING *',
      [name, quantity, price, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produkt finns inte' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produkt finns inte' });
    }

    res.json({ message: 'Produkt borttagen' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3000;

async function seedProducts() {
  try {
    const check = await pool.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, quantity, price, category) VALUES
        ('Intel Core i7-13700K', 10, 4299.00, 'Processor'),
        ('NVIDIA RTX 4070', 6, 8499.00, 'Grafikkort'),
        ('Corsair 16GB DDR4', 20, 899.00, 'RAM'),
        ('Samsung 1TB SSD', 15, 1299.00, 'Lagring'),
        ('ASUS ROG Moderkort', 5, 2799.00, 'Moderkort')
      `);
      console.log(' Förifyllda produkter har lagts till.');
    } else {
      console.log(' Produkter finns redan i databasen.');
    }
  } catch (err) {
    console.error(' Fel vid seed:', err.message);
  }
}


async function startServer() {
  try {
    
    await pool.query('SELECT NOW()');
    console.log(' Databasanslutning fungerar');
    
    await seedProducts();
    
    app.listen(PORT, () => {
      console.log(`Server körs på http://localhost:${PORT}`);
      console.log(' API endpoints:');
      console.log('   GET    /products     - Hämta alla produkter');
      console.log('   GET    /products/:id - Hämta en produkt');
      console.log('   POST   /products     - Skapa ny produkt');
      console.log('   PUT    /products/:id - Uppdatera produkt');
      console.log('   DELETE /products/:id - Ta bort produkt');
    });
  } catch (err) {
    console.error(' Kunde inte starta servern:', err.message);
    process.exit(1);
  }
}

startServer();









