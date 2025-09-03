const express = require('express');

// routers
const authRouter = require('./routes/auth');

// create express app
const app = express();

// routes
app.get('/', (req, res) => {
    res.send('home');
});

// api endpoints
app.use('/api/v1/auth', authRouter);

// start the server
const PORT = process.env.PORT || 3001;

const start = async () => {
    try {
        app.listen(PORT, () =>
            console.log(`Server is listening on port ${PORT}...`)
        );
    } catch (error) {
        console.log(error);
    }
}

start();