const client = require('./client')
const trim = str => str.replace(/\s+/g, "")

const sampleWeather = () => ({
    main: {
        humidity: 5,
        pressure: 11,

    },
    name: "Saint-Petersburg",
    temp: 31,
    wind: {
        speed: 2,
        angle: 23,
    },
    coord: {
        latitude: 11,
        longitude: 22
    },
    id: 13
})

const initialState = () => ({
    current: {
        loading: false,
        title: "",
        temp: 0,
        params: [
            {title: '', value: ''}
        ]
    },
    starred: []
})


function mockFetch(response) {
    return () => new Promise(
        resolve => resolve({json: () => new Promise(res2 => res2(response))})
    )
}

describe("Direction function", () => {
    describe("getDirection()", () => {

        it("180 -> Юг", () => {
            expect(client.getDirection(180)).toBe("Юг")
        })

        it("10 -> Север", () => {
            expect(client.getDirection(10)).toBe("Север")
        })

        it("360 -> Северо-Запад", () => {
            expect(client.getDirection(360)).toBe("Северо-Запад")
        })

        it("75 -> Восток", () => {
            expect(client.getDirection(75)).toBe("Восток")
        })

    })
    describe('getCurrentPositionAsync', () => {
        it('returns correct coordinates after await', async () => {
            const currentPosition = await client.getCurrentPositionAsync()
            expect(currentPosition.coords).toHaveProperty('latitude');
            expect(currentPosition.coords).toHaveProperty('longitude');
            expect(currentPosition.coords).toEqual({
                latitude: '12',
                longitude: '23',
            });
        });
    });
})


describe("addListener", () => {

    it("addListener does work to current if current changes", () => {
        const state = client.wrap(initialState())
        const handler = jest.fn()
        addListener("current", handler)
        state.current = "test"
        expect(handler).toBeCalled()
    })

    it("addListener does work to starred if starred changes", () => {
        const state = wrap(initialState())
        const handler = jest.fn()
        addListener("starred", handler)
        state.starred = "test2"
        expect(handler).toBeCalled()
    })

    it("addListener doesn't work to starred if current changes", () => {
        const state = wrap(initialState())
        const handler = jest.fn()
        addListener("starred", handler)
        state.current = "test2"
        expect(handler).not.toBeCalled()
    })

})

describe("Render", () => {
    describe("renderLoading()", () => {
        it("gets loader", () => {
            const data = client.renderLoader()
            expect(data).toBe(global.document.querySelector('#loading').innerHTML)
        })
    })
    describe("renderStats()", () => {
        it("returns empty string if no stats provided", () => {
            const data = client.renderStats()
            expect(data).toHaveLength(0)
        })
        it("returns correct html if stats provided", () => {
            const data = client.renderStats([{
                title: 1,
                value: 2
            }])
            expect(trim(data)).toBe(trim(`
        <li class="weather_row">
          <div class="weather_row_title">1</div>
          <div class="weather_row_text">2</div>
        </li>
      `))
        })
    })
    describe("renderExtra()", () => {
        it("returns default HTML if state is not changed", () => {
            const weather = client.weatherMapper(sampleWeather())
            setState({
                ...initialState(),
                starred: [weather]
            })
            const data = client.renderExtra()
            expect(trim(data)).toBe(trim(`
        <li class="mt-2rem">
            <div class="city flx">
                <div class="city_remove" data-id="13">
                    ✖
                </div>
                <h4>
                    Saint-Petersburg
                </h4>
                <div class="city_temperature">
                    NaN
                </div>
                <img src="https://www.iconfinder.com/data/icons/weather-129/64/weather-5-512.png" class="city_extra__icon" alt="weather icon">
            </div>
            <ul>
                        
                <li class="weather_row">
                    <div class="weather_row_title">Влажность</div>
                    <div class="weather_row_text">5%</div>
                </li>
            
                <li class="weather_row">
                    <div class="weather_row_title">Давление</div>
                    <div class="weather_row_text">11 гПа</div>
                </li>
            
                <li class="weather_row">
                    <div class="weather_row_title">Ветер м/с</div>
                    <div class="weather_row_text">2 м/с</div>
                </li>
            
                <li class="weather_row">
                    <div class="weather_row_title">Ветер (направление)</div>
                    <div class="weather_row_text">Северо-Восток</div>
                </li>
            
                <li class="weather_row">
                    <div class="weather_row_title">Координаты</div>
                    <div class="weather_row_text">11,22</div>
                </li>
            
            </ul>
        </li>
        `))
        })
    })
})


describe("Simple functions", () => {
    describe("toObj()", () => {
        it("returns an object", () => {
            const data = client.toObj("1", 2)
            expect(data).toBeInstanceOf(Object)
        })
        it("returns correct object", () => {
            const data = client.toObj("12345678", "87654321")
            expect(data).toHaveProperty("title", "12345678")
            expect(data).toHaveProperty("value", "87654321")
        })
    })
    describe("weatherMapper()", () => {
        it("returns an object", () => {
            const data = client.weatherMapper(sampleWeather())
            expect(data).toBeInstanceOf(Object)
        })
        it("returns an object with valid keys", () => {
            const data = client.weatherMapper(sampleWeather())
            expect(data).toHaveProperty("id")
            expect(data).toHaveProperty("title")
            expect(data).toHaveProperty("temp")
            expect(data).toHaveProperty("params")
        })
    })
    describe("fillTemplate()", () => {
        it("returns valid HTML", () => {
            const template = `<div>{title}</div>`
            const filled = client.fillTemplate(template, {title: 1})
            expect(filled).toBe(`<div>1</div>`)
        })
    })
    describe("initCurrentPosition()", () => {
        it("returns correct position state if position is provided", async () => {
            global.fetch = mockFetch({
                "coord": {"lon": 23, "lat": 12},
                "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
                "base": "stations",
                "main": {
                    "temp": 33.85,
                    "feels_like": 28.95,
                    "temp_min": 33.85,
                    "temp_max": 33.85,
                    "pressure": 1009,
                    "humidity": 10,
                    "sea_level": 1009,
                    "grnd_level": 939
                },
                "visibility": 10000,
                "wind": {"speed": 3.77, "deg": 113},
                "clouds": {"all": 0},
                "dt": 1608205162,
                "sys": {"country": "SD", "sunrise": 1608180099, "sunset": 1608221215},
                "timezone": 7200,
                "id": 7754689,
                "name": "TestyTest",
                "cod": 200
            })
            const data = await client.initCurrentPosition();
            expect(data.current).toHaveProperty("loading", false)
            expect(data.current).toHaveProperty("title", "TestyTest")
        })
        it("returns correct state for Saint-Peterburg if no position provided", async () => {
            global.fetch = mockFetch({
                "coord": {"lon": 30.26, "lat": 59.89},
                "weather": [{"id": 804, "main": "Clouds", "description": "overcast clouds", "icon": "04d"}],
                "base": "stations",
                "main": {"temp": 1.23, "feels_like": -5.08, "temp_min": 1, "temp_max": 1.67, "pressure": 1018, "humidity": 86},
                "visibility": 10000,
                "wind": {"speed": 6, "deg": 300},
                "clouds": {"all": 90},
                "dt": 1608205728,
                "sys": {"type": 1, "id": 8926, "country": "RU", "sunrise": 1608188241, "sunset": 1608209587},
                "timezone": 10800,
                "id": 498817,
                "name": "Saint-Petersburg",
                "cod": 200
            })
            global["navigator"] = {
                geolocation: {
                    getCurrentPosition: (res, rej, opts) => rej(),
                }
            }
            const data = await client.initCurrentPosition()
            expect(data.current).toHaveProperty("loading", false)
            expect(data.current).toHaveProperty("title", "Saint-Petersburg")
        })
    })
    describe("loadFavorites", () => {
        beforeEach(() => {
            setState(initialState())
        })
        it("returns state with empty favorites", async () => {
            global.fetch = mockFetch({"cnt": 0, "list": []})
            await client.loadFavorites()
            const state = client.getState()
            expect(state.starred).toHaveLength(0)
        })
        it("returns state with 2 defined favorites", async () => {
            global.fetch = mockFetch({
                "cnt": 2,
                "list": [{
                    "coord": {"lon": 37.62, "lat": 55.75},
                    "sys": {"country": "RU", "timezone": 10800, "sunrise": 1608184508, "sunset": 1608209786},
                    "weather": [{"id": 500, "main": "Rain", "description": "light rain", "icon": "10d"}],
                    "main": {
                        "temp": 1.97,
                        "feels_like": -3.37,
                        "temp_min": 1.67,
                        "temp_max": 2.22,
                        "pressure": 1018,
                        "humidity": 93
                    },
                    "visibility": 10000,
                    "wind": {"speed": 5, "deg": 260},
                    "clouds": {"all": 75},
                    "dt": 1608203220,
                    "id": 524901,
                    "name": "Penza"
                }, {
                    "coord": {"lon": -0.13, "lat": 51.51},
                    "sys": {"country": "GB", "timezone": 0, "sunrise": 1608192099, "sunset": 1608220321},
                    "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
                    "main": {
                        "temp": 9.55,
                        "feels_like": 5.31,
                        "temp_min": 7.78,
                        "temp_max": 10.56,
                        "pressure": 1015,
                        "humidity": 76
                    },
                    "visibility": 10000,
                    "wind": {"speed": 4.6, "deg": 240},
                    "clouds": {"all": 0},
                    "dt": 1608203376,
                    "id": 2643743,
                    "name": "Yorkshire"
                }]
            })
            await client.loadFavorites()
            const state = client.getState()
            expect(state.starred).toHaveLength(2)
        })
    })
})

const $api = new client.Api();
describe("Api", () => {
    beforeAll(() => {
        global.fetch = (url, options) => new Promise(
            resolve => resolve({json: () => new Promise(res2 => res2({url, options}))})
        )
    })
    it("has endpoint http://localhost:3000", () => {
        expect($api).toHaveProperty("endpoint", "http://localhost:3000")
    })
    it("returns weather by string", async () => {
        const city = "jakarta"
        const {url} = await $api.weatherByString(city)
        expect(url).toBe(`http://localhost:3000/weather/city?q=${city}`)
    })
    it("returns weather by id", async () => {
        const id = 123456
        const {url} = await $api.weatherById(id)
        expect(url).toBe(`http://localhost:3000/weather/city?id=${id}`)
    })
    it("returns weather by lat/lon", async () => {
        const obj = {latitude: 1, longitude: 2}
        const {url} = await $api.weatherByLatLon(obj)
        expect(url).toBe(`http://localhost:3000/weather/coordinates?lat=${obj.latitude}&lon=${obj.longitude}`)
    })
    it("gets favorites", async () => {
        const {url} = await $api.getFavorites()
        expect(url).toBe(`http://localhost:3000/favorites`)
    })
    it("removes favorite", async () => {
        const id = 123456
        const {url, options} = await $api.removeFavorite(id)
        expect(url).toBe(`http://localhost:3000/favorites`)
        expect(options).toHaveProperty('method', 'DELETE')
        expect(options).toHaveProperty('headers')
        expect(options.headers).toHaveProperty('Accept', 'application/json')
        expect(options.headers).toHaveProperty('Content-Type', 'application/json')
        expect(options).toHaveProperty('body', JSON.stringify({id}))
    })
})

describe("Button", () => {
    describe("onAdd()", () => {
        it("preventDefault works", () => {
            const prevent = jest.fn()
            client.onAdd({preventDefault: prevent})
            expect(prevent).toBeCalledTimes(1)
        })
        it("ignores 404", () => {
            global.fetch = mockFetch({cod: "404"})
            const stateBeforeClick = client.getState()
            client.onAdd({preventDefault: jest.fn()})
            expect(stateBeforeClick).toBe(getState())
        })
    })
    describe("onBtnRemoveClick()", () => {
        it("removes from starred", () => {
            client.setState({...initialState(), starred: [{id: 1}]})
            expect(getState().starred).toHaveLength(1)
            global.fetch = mockFetch({})
            client.onBtnRemoveClick(1)
            expect(getState().starred).toHaveLength(0)
        })
    })

})
