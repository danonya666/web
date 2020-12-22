const server = require("./server");
const request = require("supertest");

const $api  = new server.Api()
describe("Api()", () => {
    it("has endpoint https://api.openweathermap.org/data/2.5", () => {
        expect($api).toHaveProperty("endpoint", "https://api.openweathermap.org/data/2.5")
    })
    it("returns weather by string", async () => {
        const city = "jakarta"
        const {data} = await $api.weatherByString(city)
        expect(data.name).toBe("Jakarta")
        expect(data.cod).toBe(200)
    })
    it("returns weather by id", async () => {
        const id = 524901
        const {data} = await $api.weatherById(id)
        expect(data.name).toBe("Moscow")
        expect(data.cod).toBe(200)
        expect(data.id).toBe(id)
    })
    it("returns weather by ids", async () => {
        const id_list = [524901,2643743]
        const {data} = await $api.weatherByIds(id_list)
        expect(data).toHaveProperty("cnt",2)
        expect(data.list).toHaveLength(2)
        expect(data.list.some(_=>_.name === "London")).toBeTruthy()
        expect(data.list.some(_=>_.name === "Moscow")).toBeTruthy()
    })
    it("returns weather by lat/lon", async () => {
        const lat_lon = {latitude: 55.751244, longitude:37.618423}
        const {data} = await $api.weatherByLatLon(lat_lon)
        expect(data.name).toBe("Moscow")
        expect(data.cod).toBe(200)
        expect(data.id).toBe(524901)
    })
})

describe("express.app", () => {
    describe("/weather", () => {
        it("returns Saint-Petersburg for id=498817", () => {
            return request(server.app)
                .get('/weather/city?id=498817')
                .then(response => {
                    expect(response.statusCode).toBe(200)
                    expect(response.body.name).toBe("Saint Petersburg")
                })
        })
        it("returns Saint-Petersburg for q=Saint Petersburg", () => {
            return request(server.app)
                .get(`/weather/city?q=${encodeURIComponent('Saint Petersburg')}`)
                .then(response => {
                    expect(response.statusCode).toBe(200)
                    expect(response.body.name).toBe("Saint Petersburg")
                    expect(response.body.id).toBe(498817)
                })
        })
        it("returns Moscow by lat/lon", () => {
            return request(server.app)
                .get(`/weather/coordinates?lat=${encodeURIComponent(55.75)}&lon=${encodeURIComponent(37.62)}`)
                .then(response => {
                    expect(response.statusCode).toBe(200)
                    expect(response.body.name).toBe("Moscow")
                    expect(response.body.id).toBe(524901)
                })
        })
    })
    describe("/favorites", () => {
        it("saves and returns favorites", async () => {
            const NY_ID = 5128581
            const $s = request(server.app)
            const response = await $s.get("/favorites")
            expect(response.status).toBe(200)

            const startLength = response.body.list?.length ?? 0
            const responsePost = await $s.post("/favorites").send({id:NY_ID})
            expect(responsePost.status).toBe(200)
            expect(responsePost.body).toHaveProperty("msg", "success")

            const responseCompleteList = await $s.get("/favorites")
            const completeLength = responseCompleteList.body.list.length
            expect(responseCompleteList.status).toBe(200)
            expect(startLength + 1).toBe(completeLength)

        })
        it("saves and deletes favorites", async () => {
            const BOSTON_ID = 4930956
            const $s = request(server.app)
            const response = await $s.get("/favorites")
            expect(response.status).toBe(200)

            const initialLength = response.body.list?.length ?? 0;
            const responsePost = await $s.post("/favorites").send({id:BOSTON_ID})
            expect(responsePost.status).toBe(200)
            expect(responsePost.body).toHaveProperty("msg", "success")

            const responseCompleteList = await $s.get("/favorites")
            const completeLength = responseCompleteList.body.list.length
            expect(responseCompleteList.status).toBe(200)
            expect(initialLength + 1).toBe(completeLength)

            await $s.delete("/favorites").send({id:BOSTON_ID})
            expect(responsePost.status).toBe(200)
            expect(responsePost.body).toHaveProperty("msg", "success")

            const responseAfterDelete = await $s.get("/favorites")
            const afterDeleteLength = responseAfterDelete.body.list.length
            expect(responseAfterDelete.status).toBe(200)
            expect(initialLength).toBe(afterDeleteLength)
        })
    })

})

