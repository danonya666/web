const apikey = 'd1b9e4aebf1311c3832b4a366dfe8604'

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

const fetchWeatherGet = async (url) => fetch(`${url}&appid=${apikey}`).then(res => res.json())

function getCardinal(angle) {
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
        this.endpoint = 'https://api.openweathermap.org/data/2.5'
    }

    weatherByString(str) {
        const result = fetchWeatherGet(`${this.endpoint}/weather?q=${encodeURIComponent(str)}&units=metric`)
        console.log('res ' + result)
        return result;
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

function param(title, value) {
    return {title, value}
}

const api = new Api()

/*LS*/
function saveCityToLS(id) {
    let data = JSON.parse(localStorage.getItem('cities') || '[]')
    data.push(id)
    localStorage.setItem('cities', JSON.stringify(data))
}

function removeCityFromLS(id) {
    let data = JSON.parse(localStorage.getItem('cities') || '[]')
    localStorage.setItem('cities', JSON.stringify(data.filter(_ => parseInt(_, 10) !== parseInt(id, 10))))
}

/*END-LS*/

/*MAPPERS*/
function weatherMapper(obj) {
    console.log(obj)
    const {main, name, wind, coord, id} = obj

    return {
        id,
        title: name,
        temp: Math.round(main.temp),
        params: [
            param('Влажность', main.humidity + '%'),
            param('Давление', main.pressure + ' гПа'),
            param('Ветер м/с', wind.speed + ' м/с'),
            param('Ветер (направление)', getCardinal(wind.angle)),
            param('Координаты', Object.values(coord).join(',')),
        ],
    }
}

function renderLoader() {
    return loadingTemplate.innerHTML
}

function renderStats(stats) {
    if (!stats) return ''
    return stats.map(({title, value}) =>fillTemplate(statsTemplate.innerHTML, {title, value})).join('')
}

function renderBlockMain() {
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

function renderBlocksExtra() {
    blockWrapper.innerHTML = ""
    console.log('rendering extra');
    state.starred.forEach(loc => {
        console.log('loc', loc);
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
        console.log('itit')
        it.addEventListener('click', () => {
            console.log(it)
            const id = it.getAttribute('data-id')
            if (!id) return
            onBtnRemoveClick(id)
        })
    })
    console.log('added listener')
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

async function initFromLs() {
    const lsData = JSON.parse(localStorage.getItem('cities') || '[]')
    if (lsData.length === 0) return
    const {list} = await api.weatherByIds(lsData)
    state.starred = [...state.starred, ...list.map(_ => weatherMapper(_))]
}

/*END-INIT*/

/*HANDLERS*/
async function onBtnAddClick(e) {
    e.preventDefault()
    const val = addNewCity.value
    addNewCity.disabled = true
    addNewCity.value = 'Загрузка...'
    try {
        state.starred = [...state.starred, {loading: true}]
        const data = await api.weatherByString(val)
        console.log('data: ', data);
        if (data.cod === '404')
            throw new Error('not found')
        state.starred.pop()
        state.starred = [...state.starred]
        addNewCity.disabled = false
        addNewCity.value = ''
        if (state.starred.map(_ => _.id).includes(data.id)) return alert('Такой город уже есть!')
        saveCityToLS(data.id)
        state.starred = [...state.starred, weatherMapper(data)]
        console.log('current state: ', state);
    } catch (err) {
        state.starred.pop()
        state.starred = [...state.starred]
        alert('Ошибочка(')
        console.error(err)
    }
    addNewCity.disabled = false
    addNewCity.value = ''
}

function onBtnRemoveClick(id) {
    console.log(id)
    state.starred = state.starred.filter(_ => _.id !== parseInt(id, 10))
    removeCityFromLS(id)
}

/*END-HANDLERS*/

async function mainFunc() {
    document.querySelector('#add-city-form').addEventListener('submit', onBtnAddClick)
    addListener('current', renderBlockMain)
    addListener('starred', renderBlocksExtra)
    initCurrentPosition()
    initFromLs()
}

mainFunc()


// input 100% на мобильную верстку
// submit on enter input