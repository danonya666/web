const apikey = 'bf1e6f31df3365677ca42ccb686d0da8'

const importantBlock = document.querySelector('.important_block')
const blockWrapper = document.querySelector('.block_wrapper')
const otherCityTemplate = document.querySelector('#other-city')
const mainCityTemplate = document.querySelector('#main-city')
const statsTemplate = document.querySelector('#stats-template')
const loadingTemplate = document.querySelector('#loading')
const addNewCity = document.querySelector('.add-new-city')

function fillTemplate(template, values) {
    return template.replace(/{([^{}]*)}/g, function (a, b) {
        return values[b];
    });
}

function getDirection(angle) {
    const degreePerDirection = 360 / 8;

    const offsetAngle = angle + degreePerDirection / 2;

    return (offsetAngle >= 0 && offsetAngle < degreePerDirection) ? "Север"
        : (offsetAngle >= degreePerDirection && offsetAngle < 2 * degreePerDirection) ? "Северо-Восток"
            : (offsetAngle >= 2 * degreePerDirection && offsetAngle < 3 * degreePerDirection) ? "Восток"
                : (offsetAngle >= 3 * degreePerDirection && offsetAngle < 4 * degreePerDirection) ? "Юго-Восток"
                    : (offsetAngle >= 4 * degreePerDirection && offsetAngle < 5 * degreePerDirection) ? "Юг"
                        : (offsetAngle >= 5 * degreePerDirection && offsetAngle < 6 * degreePerDirection) ? "Юго-Запад"
                            : (offsetAngle >= 6 * degreePerDirection && offsetAngle < 7 * degreePerDirection) ? "Запад"
                                : "Северо-Запад";
}

class Api {
    constructor() {
        this.endpoint = 'http://localhost:3000'
    }

    weatherByString(str) {
        return fetch(`${this.endpoint}/weather/city?q=${encodeURIComponent(str)}`).then(res => res.json())
    }

    weatherById(id) {
        return fetch(`${this.endpoint}/weather/city?id=${encodeURIComponent(id)}`).then(res => res.json())
    }

    weatherByLatLon({latitude, longitude}) {
        return fetch(`${this.endpoint}/weather/coordinates?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`).then(res => res.json())
    }

    saveFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        })
    }

    getFavorites() {
        return fetch(`${this.endpoint}/favorites`).then(res => res.json())
    }

    removeFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        }).then(res => res.json())
    }
}

const getCurrentPositionAsync =
    () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true}));

const wrap = obj => {
    return new Proxy(obj, {
        get(target, propKey) {
            return target[propKey]
        },
        set(target, prop, value) {
            target[prop] = value
            updateHandler(prop)
        }
    })
}

let __state__ = {
    current: {
        loading: false,
        title: "",
        temp: 0,
        params: [
            {title: '', value: ''}
        ]
    },
    starred: []
}

const state = wrap(__state__)

let updateListeners = {}

function updateHandler(prop) {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].forEach(handler => handler())
}

function addListener(prop, handler) {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].push(handler)
    else
        updateListeners[prop] = [handler]
}

function toObj(title, value) {
    return {title, value}
}

const api = new Api()


function weatherMapper(obj) {
    const {main, name, wind, coord, id} = obj

    return {
        id,
        title: name,
        temp: Math.round(main.temp),
        params: [
            toObj('Влажность', main.humidity + '%'),
            toObj('Давление', main.pressure + ' гПа'),
            toObj('Ветер м/с', wind.speed + ' м/с'),
            toObj('Ветер (направление)', getDirection(wind.angle)),
            toObj('Координаты', Object.values(coord).join(',')),
        ],
    }
}

function renderLoader() {
    return loadingTemplate.innerHTML
}

async function loadFavorites() {
    const {list} = await api.getFavorites()
    state.starred = [...state.starred, ...list.map(_ => weatherMapper(_))]
}

function renderStats(stats) {
    if (!stats) return ''
    return stats.map(({title, value}) =>fillTemplate(statsTemplate.innerHTML, {title, value})).join('')
}

function renderMain() {
    importantBlock.innerHTML = ""
    const values = {
        loading: state.current.loading ? renderLoader() : '',
        title: state.current.title,
        temp: state.current.temp,
        stats: renderStats(state.current.params)
    }
    const node = mainCityTemplate.cloneNode(true)
    node.innerHTML = fillTemplate(node.innerHTML, values)
    const nodeImported = document.importNode(node.content, true)
    importantBlock.appendChild(nodeImported)
}

function renderExtra() {
    blockWrapper.innerHTML = ""
    state.starred.forEach(loc => {
        const values = {
            loading: loc.loading ? renderLoader() : '',
            title: loc.title,
            temp: loc.temp,
            id: loc.id,
            stats: renderStats(loc.params)
        }
        const node = otherCityTemplate.cloneNode(true)
        node.innerHTML = fillTemplate(node.innerHTML, values)
        const nodeImported = document.importNode(node.content, true)
        blockWrapper.appendChild(nodeImported)
    });
    [...document.querySelectorAll('.city_remove')].forEach(it => {
        it.addEventListener('click', () => {
            const id = it.getAttribute('data-id')
            if (!id) return
            onBtnRemoveClick(id)
        })
    })
}
async function initCurrentPosition() {
    state.current = {
        ...state.current,
        loading: true
    }
    let data = null
    try {
        const pos = await getCurrentPositionAsync()
        const {coords} = pos
        data = await api.weatherByLatLon({
            latitude: coords.latitude,
            longitude: coords.longitude
        })
    } catch (err) {
        const spbid = 498817
        data = await api.weatherById(spbid)
    }

    state.current = {
        ...state.current,
        ...weatherMapper(data),
        loading: false
    }
}

async function onAdd(e) {
    e.preventDefault()
    const val = addNewCity.value;
    if (!val) {
        alert('Введите какой-нибудь город');
        return
    }
    addNewCity.disabled = true
    addNewCity.value = 'Загрузка...'
    try {
        state.starred = [...state.starred, {loading: true}]
        const data = await api.weatherByString(val)
        if (data.cod === '404')
            throw new Error('not found')
        state.starred.pop()
        state.starred = [...state.starred]
        addNewCity.disabled = false
        addNewCity.value = ''
        if (state.starred.map(_ => _.id).includes(data.id)) return alert('Такой город уже есть!')
        await api.saveFavorite(data.id)
        state.starred = [...state.starred, weatherMapper(data)]
    } catch (err) {
        state.starred.pop()
        state.starred = [...state.starred]
        alert('Город не найден!')
    }
    addNewCity.disabled = false
    addNewCity.value = ''
}

async function onBtnRemoveClick(id) {
    state.starred = state.starred.filter(_ => _.id !== parseInt(id, 10))
    await api.removeFavorite(id)
}

/*END-HANDLERS*/

async function main() {
    document.querySelector('#add-city-form').addEventListener('submit', onAdd)
    const refreshGeoElements = document.getElementsByClassName('refresh-geo');
    for (const el of refreshGeoElements) {
        el.onclick = initCurrentPosition;
    }
    addListener('current', renderMain)
    addListener('starred', renderExtra)
    initCurrentPosition()
    loadFavorites()
}

main()
