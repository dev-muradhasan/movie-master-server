require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DATABASE_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('movie_master');
        const movieCollection = db.collection('moviesDb')

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        app.post('/movies', async (req, res) => {
            const newMovie = req.body;
            const result = await movieCollection.insertOne(newMovie)
            res.send(result)
        })

        app.get('/movies', async (req, res) => {
            const result = await movieCollection.find().toArray();
            res.send(result)
        })

        app.get('/top-movies', async (req, res) => {
            const result = await movieCollection.find().sort({ rating: -1 })
                .limit(6).toArray();
            res.send(result)
        })

        app.get('/latest-movies', async (req, res) => {
            const result = await movieCollection.find().sort({ releaseYear: -1 })
                .limit(6).toArray();
            res.send(result)
        })
        
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    }
    catch (err) {
        console.error(err)
    }
}
run().catch(console.dir);



