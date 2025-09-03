require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

// routers
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');

// db
const connectDB = require('./db/connect');

// create express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.get('/', (req, res) => {
    res.send('home');
});

// api endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);

// start the server
const PORT = process.env.PORT || 3001;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        console.log('CONNECTED TO DB!!!');
        
        app.listen(PORT, () =>
            console.log(`Server is listening on port ${PORT}...`)
        );
    } catch (error) {
        console.log(error);
    }
}

start();