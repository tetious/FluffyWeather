
function degreesToDirection(degrees) {
    var converted = Math.floor(degrees / 22.5) + .5;
    var directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return  directions[(converted % 16)];
}


$(function() {
    setInterval(function() {
        $.getJSON("/api/weather", function(data) {
            $("body").fadeIn();
            $("#temperature").text((data.temperature * 1.8 + 32.0).toFixed(2));
            $("#humidity").text(data.humidity);
            $("#pressure").text(data.pressure);
            $("#rainfall").text(data.rainfall);
            $("#wind-direction").text(degreesToDirection(data.wind_direction));
            $("#wind-speed").text(data.wind_speed);
            $("#voltage").text(data.voltage);
            $("#updated").text(data.added);
        });
    }, 1000);
});