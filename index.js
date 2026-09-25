require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const userCollection = db.collection('users');
        const watchlistCollection = db.collection("watchlist");

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        app.get('/statistics', async (req, res) => {
            const totalMovies = await movieCollection.countDocuments();
            const totalUsers = await userCollection.countDocuments();
            res.send({
                totalMovies,
                totalUsers
            });
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const existingUser = await userCollection.findOne({
                email: user.email
            });
            if (existingUser) {
                return res.send({
                    message: "User already exists"
                });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.post('/movies', async (req, res) => {
            try {
                const newMovie = req.body;
                const existingMovie = await movieCollection.findOne({
                    title: newMovie.title,
                    releaseYear: newMovie.releaseYear
                });
                if (existingMovie) {
                    return res.status(409).send({
                        message: "Movie already exists!"
                    });
                }
                const result = await movieCollection.insertOne(newMovie);
                res.status(201).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to add movie"
                });
            }
        });

        app.patch('/movies/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedMovie = req.body;
                const result = await movieCollection.updateOne(
                    {
                        _id: new ObjectId(id)
                    },
                    {
                        $set: updatedMovie
                    }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).send({
                        message: "Movie not found"
                    });
                }
                res.send({
                    message: "Movie updated successfully"
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to update movie"
                });
            }
        });

        app.get("/movies", async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { addedBy: email }
                    : {};
                const result = await movieCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to fetch movies"
                });
            }
        });

        app.get('/movies/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({
                    message: 'Invalid movie id'
                });
            }
            const result = await movieCollection.findOne({ _id: new ObjectId(id) });
            if (!result) {
                return res.status(404).send({
                    message: 'Movie not found'
                });
            }
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

        app.post("/watchlist", async (req, res) => {
            try {
                const watchlistMovie = req.body;
                const existing = await watchlistCollection.findOne({
                    movieId: watchlistMovie.movieId,
                    addedBy: watchlistMovie.addedBy,
                });
                if (existing) {
                    return res.status(409).send({
                        message: "Movie already in watchlist!",
                    });
                }
                const result = await watchlistCollection.insertOne(
                    watchlistMovie
                );
                res.status(201).send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to add to watchlist",
                });
            }
        });

        app.delete("/watchlist", async (req, res) => {
            try {
                const { movieId, email } = req.query;
                const result = await watchlistCollection.deleteOne({
                    movieId: movieId,
                    addedBy: email,
                });
                if (result.deletedCount === 0) {
                    return res.status(404).send({
                        message: "Movie not found in watchlist!",
                    });
                }
                res.send({
                    message: "Movie removed from watchlist!",
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to remove from watchlist",
                });
            }
        });

        app.get("/watchlist", async (req, res) => {
            try {
                const email = req.query.email;
                const watchlist = await watchlistCollection.find({ addedBy: email }).toArray();
                const movieIds = watchlist.map((item) => item.movieId);
                const movies = await movieCollection
                    .find({
                        _id: {
                            $in: movieIds.map((id) => new ObjectId(id))
                        }
                    })
                    .toArray();
                res.send(movies);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Failed to fetch watchlist"
                });
            }
        });

        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    }
    catch (err) {
        console.error(err)
    }
}
run().catch(console.dir);



