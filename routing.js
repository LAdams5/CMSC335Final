const http = require("http");
const path = require("path");
const express = require("express");
const app = express();
const portNumber = process.env.PORT || 7002;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
require('dotenv').config();


app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());


(async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
        console.log('MongoDB connected via Mongoose');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();

const Review = require('./models/review');
const router = express.Router();

async function getWeather(city) {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            return {
                temperature: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed)
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Weather API error:", error);
        return null;
    }
}

router.get("/test-db", async (request, response) => {
    try {
        const reviews = await Review.find({});
        response.json({
            count: reviews.length,
            reviews: reviews
        });
    } catch (error) {
        response.json({ error: error.message });
    }
});


router.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "public", "index.html"));
});

router.get("/newyork", async (request, response) => {

    const weatherData = await getWeather("New York");
    const variables = {
        city: "New York",
        image: "newyork.jpg",
        weather: weatherData
    };
    response.render("city", variables);

});

router.get("/miami", async (request, response) => {
    const weatherData = await getWeather("Miami");
    const variables = {
        city: "Miami",
        image: "miami.jpg",
        weather: weatherData
    };
    response.render("city", variables);
});

router.get("/seattle", async (request, response) => {
    const weatherData = await getWeather("Seattle");
    const variables = {
        city: "Seattle",
        image: "seattle.jpg",
        weather: weatherData
    };
    response.render("city", variables);

});

router.get("/pierre", async (request, response) => {
    const weatherData = await getWeather("Pierre");
    const variables = {
        city: "Pierre",
        image: "pierre.jpg",
        weather: weatherData
    };
    response.render("city", variables);
});

router.post("/submit-review", async (request, response) => {
    const { city, rating, comment } = request.body;
    
    console.log("City:", city);
    console.log("Rating:", rating);
    console.log("Comment:", comment);
    
    try {
        const newReview = new Review({
            city: city,
            rating: Number(rating),
            comment: comment
        });

        console.log("About to save review:", newReview);
        await newReview.save();
        console.log("Review saved successfully!");

        response.send(`
            <html>
                <head>
                    <title>Review Submitted</title>
                    <h1>Review Submitted Successfully!</h1>
                    <a href="/">Back to Home</a>
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Error saving review:", error);
        response.status(500).send(`
            <html>
                <head>
                    <title>Error</title>
                </head>
                <body>
                    <h1>Error Saving Review</h1>
                    <a href="/">Back to Home</a>
                </body>
            </html>
        `);
    }
});

router.get("/api/reviews/:city", async (request, response) => {
    const cityName = request.params.city;
    try {
        const reviews = await Review.find({ city: cityName }).sort({ createdAt: -1 });
        response.json(reviews);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: "Error retrieving reviews" });
    }
});

router.post("/delete-all-reviews", async (request, response) => {
    try {
        const result = await Review.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} reviews`);
        response.json({ 
            success: true, 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error("Error deleting reviews:", error);
        response.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.use("/", router);

app.listen(portNumber);
console.log(`To access server: http://localhost:${portNumber}`);
