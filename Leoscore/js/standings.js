function load() {
    $("#button i").removeClass("fa fa-search");
    $("#button i").addClass("fa fa-circle-o-notch fa-spin");

    setTimeout(function() {
        $("#button i").removeClass("fa fa-circle-o-notch fa-spin");
        $("#button i").addClass("fa fa-search");
    }, 1500);
}
var input = document.getElementById("input");
const map = new Map();
map.set("World Cup", 1);
map.set("Champions Leauge", 2);
map.set("Premier League", 39);
map.set("Championship", 40);
map.set("Ligue 1", 61);
map.set("Bundesliga", 78);
map.set("2. Bundesliga", 79);
map.set("Serie A", 135);
map.set("La Liga", 141);
map.set("Super Liga", 286);
input.addEventListener("keypress", function (event){
    if (event.key === "Enter")
    {
        var games = document.getElementById("wg-api-football-games");
        var userInput = input.innerText;
        if (map.has(userInput))
        {
            alert("funkt");
            games.setAttribute("data-league", userInput);
        }
        else
        {
            alert("Not Available");
        }
    }
})