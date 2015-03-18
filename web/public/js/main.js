$(function() {
    function degreesToDirection(degrees) {
        var converted = Math.floor(degrees / 22.5 + .5);
        var directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return directions[converted];
    }

    function celsiusToFahrenheit(c) {
        return (c * 1.8 + 32).toFixed(2);
    }

    function updateHighLow(snapshot, key, conversionDelegate) {
        if(conversionDelegate) {
            $("#" + key + "-high").text(conversionDelegate(snapshot[key].high));
            $("#" + key + "-low").text(conversionDelegate(snapshot[key].low));
        } else {
            $("#" + key + "-high").text(snapshot[key].high);
            $("#" + key + "-low").text(snapshot[key].low);
        }
    }

    function convertUptime(ms) {
        var x = ms / 1000;
        var seconds = x % 60;
        x /= 60;
        var minutes = x % 60;
        x /= 60;
        var hours = x % 24;
        x /= 24;
        return Math.floor(x) + "d" + Math.floor(hours) + "h" + Math.floor(minutes) + "m" + Math.floor(seconds) + "s";
    }

    setInterval(function() {
        $.getJSON("/api/weather", function(data) {
            $("body").fadeIn();

            var latest = data.latest;
            var snapshot = data.snapshot;

            $("#temperature").text(celsiusToFahrenheit(latest.temperature));
            updateHighLow(snapshot, "temperature", celsiusToFahrenheit);

            $("#humidity").text(latest.humidity);
            updateHighLow(snapshot, "humidity");
            $("#pressure").text(latest.pressure);
            updateHighLow(snapshot, "pressure");

            $("#rainfall").text(latest.rainfall);
            $("#rainfall-total").text(snapshot.rainfall.total);

            $("#wind-direction").text(degreesToDirection(latest.wind_direction));
            $("#wind-speed").text(latest.wind_speed);
            $("#wind-gust").text(snapshot.wind_speed.high.toFixed(2));
            $("#wind-mean").text(snapshot.wind_speed.mean.toFixed(2));

            $("#voltage").text(latest.voltage);
            $("#updated").text(latest.added);
            $("#uptime").text(convertUptime(latest.uptime));

            document.title = "FW: " + celsiusToFahrenheit(latest.temperature) + 'F | ' +
              degreesToDirection(latest.wind_direction) + ' ' + latest.wind_speed + 'mph | ' +
              latest.humidity + '%';

        });
    }, 1000);
});
