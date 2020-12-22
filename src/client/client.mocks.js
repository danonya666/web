const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = `
<div class="main_wrapper">
    <header>
        <h1 class="header_title">Погода здесь</h1>
        <button class="header_refresh_fullscreen refresh-geo">
            Обновить геолокацию
        </button>
        <button class="header_refresh_mobile refresh-geo">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Refresh_icon.svg/1200px-Refresh_icon.svg.png"
                 alt="refresh"
                class="header_refresh_mobile_image">
        </button>
        <div></div>
    </header>
    <main>
        <section class="important_block">
            <div class="important_block_left">
                <div class="main_city">
                    <h2>
                        Санкт-Петербург
                    </h2>
                    <div class="main_city_flex">
                        <img src="https://icons-for-free.com/iconfiles/png/512/cloud+day+forecast+lightning+shine+storm+sun+weather+icon-1320183295537909806.png"
                             class="main_city__icon" alt="weather icon"/>
                        <div class="main_city__temperature">
                            -14°C
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section class="city_search_block mt-1rem">
            <h3>
                Избранное
            </h3>
            <form class="city_search_form" id="add-city-form">
                <div class="input_main__form-input mr-1rem">
                    <input type="text" placeholder="Добавить новый город" class="add-new-city">
                </div>
                <div class="city_search_form-btn">
                    +
                </div>
            </form>
        </section>
        <ul class="block_wrapper main_weather_list">
            <template id="other-city" class="a">
                <li class="mt-2rem">
                    {loading}
                    <div class="city flx">
                        <div class="city_remove" data-id="{id}">
                            ✖
                        </div>
                        <h4>
                            {title}
                        </h4>
                        <div class="city_temperature">
                            {temp}
                        </div>
                        <img src="https://www.iconfinder.com/data/icons/weather-129/64/weather-5-512.png"
                             class="city_extra__icon" alt="weather icon"/>
                    </div>
                    <ul>
                        {stats}
                    </ul>
                </li>
            </template>
        </ul>

        <template id="loading">
            <div class="loading">
                <img src="../../assets/loading.gif" alt="loading..">
            </div>
        </template>

        <template id="stats-template">
            <li class="weather_row">
                <div class="weather_row_title">{title}</div>
                <div class="weather_row_text">{value}</div>
            </li>
        </template>

        <template id="main-city" class="important_block">
            {loading}
            <div class="important_block_left">
                <div class="main_city">
                    <h2>
                        {title}
                    </h2>
                    <div class="main_city_flex">
                        <img src="https://cdn0.iconfinder.com/data/icons/good-weather-1/96/weather_icons-48-512.png"
                             class="main_city__icon" alt="weather icon"/>
                        <div class="main_city__temperature">
                            {temp}°
                        </div>
                    </div>
                </div>
            </div>
            <ul class="important_block_right">
                {stats}
            </ul>
        </template>
    </main>
</div>

`
const dom = new JSDOM(html)

global["window"] = dom.window
global["document"] = dom.window.document
const positions = {
  coords: {
    latitude: '12',
    longitude: '23',
  }
}

global["navigator"] = {
  geolocation:{
    getCurrentPosition: (res, rej, opts) => res(positions),
  }
}

global["alert"] = () => {}

