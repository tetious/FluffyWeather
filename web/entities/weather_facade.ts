import Weather = require('weather');

export class WeatherFacade {

    insertWeatherUpdate(rawWeatherUpdate: string) {
        var update: Weather.Instant;
        rawWeatherUpdate.replace(/(\[|\])/g, '').split('&').forEach((item) => {
            var splitItem = item.split('=');

            switch (splitItem[0]) {
                case "ri":
                    update.rainfall = parseFloat(splitItem[1]);
                case "ws":
                    update.windSpeed = parseFloat(splitItem[1]);
                case "wd":
                    update.windDirection = parseInt(splitItem[1]);
            }
        });
    }
}