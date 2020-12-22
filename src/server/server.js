const PORT = 3000
const apikey = 'bf1e6f31df3365677ca42ccb686d0da8'

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();

const weatherRouter = express.Router();
const favoritesRouter = express.Router();
mongoose.connect('mongodb://localhost:27017/web', {useNewUrlParser: true, useUnifiedTopology: true});

const Favorite = mongoose.model('Favorite', { openWeatherId: Number });

const fetchWeatherGet = async (url) => axios.get(`${url}&appid=${apikey}`)

class Api {
    constructor() {
        this.endpoint = 'https://api.openweathermap.org/data/2.5'
    }

    weatherByString(str) {
        return fetchWeatherGet(`${this.endpoint}/weather?q=${encodeURIComponent(str)}&units=metric`);
    }

    weatherById(id) {
        return fetchWeatherGet(`${this.endpoint}/weather?id=${encodeURIComponent(id)}&units=metric`)
    }

    weatherByIds(ids) {
        return fetchWeatherGet(`${this.endpoint}/group?id=${encodeURIComponent(ids.join(','))}&units=metric`)
    }

    weatherByLatLon({latitude, longitude}) {
        return fetchWeatherGet(`${this.endpoint}/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&units=metric`)
    }
}

const $api = new Api();

app.use(cors());
app.use(bodyParser.json());

weatherRouter.get('/city', async (req, res) => {
    const { query } = req;
    const { q, id } = query;
    try {
        if (q) {
            const { data } = await $api.weatherByString(q);
            return res.json(data);
        } else {
            const { data } = await $api.weatherById(id);
            return res.json(data);
        }
    } catch(err) {
        res.status(err.response.status || 500).json({
            ...err.response.data
        });
    }


})

weatherRouter.get('/coordinates', async (req, res) => {
    const { query } = req;
    const { lat, lon } = query;
    try {
        const { data } = await $api.weatherByLatLon({
            latitude: lat,
            longitude: lon
        });
        return res.json(data);
    } catch(err) {
        res.status(err.response.status || 500).json({
            ...err.response.data
        });
    }
})



favoritesRouter.get('/', async (req,res) => {
    let items = await Favorite.find({})
    if(items.length === 0) return res.json([])
    try {
        if (items.length > 19) {
            items = items.slice(20);
        }
        const { data } = await $api.weatherByIds(items.map(({openWeatherId}) => openWeatherId));
        return res.json(data);
    } catch(err) {
        res.status(err.response.status || 500).json({
            ...err.response.data
        });
    }
})

favoritesRouter.post('/', async (req, res) => {
    const { body } = req;
    const { id } = body;
    const favorite = new Favorite({
        openWeatherId: parseInt(id, 10)
    })
    try {
        await favorite.save();
        return res.json({
            msg: 'success'
        })
    } catch(err) {
        res.status(err.response?.status ?? 500).json({
            ...err.response?.data ?? err
        });
    }
})

favoritesRouter.delete('/', async (req, res) => {
    const { body } = req;
    const { id } = body;
    try {
        await Favorite.deleteOne({
            openWeatherId: id
        });
        return res.json({
            msg: 'success'
        })
    } catch(err) {
        res.status(err.response.status || 500).json({
            ...err.response.data
        });
    }
})


app.use('/weather', weatherRouter)
app.use('/favorites', favoritesRouter)

app.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
})

module.exports = {app, Api, fetchWeatherGet}