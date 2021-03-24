var socket = io();

var game = {};
var info = {index : roomNum, hostName : hostName, playerId : player};

var hitBellSound = new Audio("../../sounds/hitBell.mp3");
hitBellSound.loop = false;
hitBellSound.volume = 0.6;

var holdOutCardSound = new Audio("../../sounds/holdOutCard.mp3");
holdOutCardSound.loop = false;
holdOutCardSound.volume = 0.6;

// 게임 정보에 맞게 렌더링
var render = (gameInfo) => {

    var playerPos = 0;

    for (var i = 0; i < gameInfo.players.length; i++) {
        if (gameInfo.players[i].name == player) {
            playerPos = i;
            break;
        }
    }

    // playerCard render
    $("#anotherPlayersDiv").html("");
    for (var i = playerPos + 1; i < gameInfo.players.length; i++){
        var tmp = "<div class=\"anotherPlayer\">" + gameInfo.players[i].name + "<br/>";
        if (gameInfo.players[i].surfaceCard.num > 0){
            tmp += "<div class=\"another card\">";
            tmp += "<img src=\"../../images/" + gameInfo.players[i].surfaceCard.fruit + "_" + gameInfo.players[i].surfaceCard.num + ".png\" />";
            tmp += "</div></div>";
        }
        else {
            tmp += "<div class=\"another card\" style=\"background-color: red;\"></div></div>";
        }
        $("#anotherPlayersDiv").append(tmp);
    }
    for (var i = 0; i < playerPos; i++){
        var tmp = "<div class=\"another\">" + gameInfo.players[i].name + "<br/>";
        if (gameInfo.players[i].surfaceCard.num > 0){
            tmp += "<div class=\"card\">";
            tmp += "<img src=\"../../images/" + gameInfo.players[i].surfaceCard.fruit + "_" + gameInfo.players[i].surfaceCard.num + ".png\" />";
            tmp += "</div></div>";
        }
        else {
            tmp += "<div class=\"another card\" style=\"background-color: red;\"></div></div>";
        }
        $("#anotherPlayersDiv").append(tmp);
    }

    if (gameInfo.players[playerPos].surfaceCard.num > 0){
        var tmp = "<img src=\"../../images/" + gameInfo.players[playerPos].surfaceCard.fruit + "_" + gameInfo.players[playerPos].surfaceCard.num + ".png\" />";
    }
    else {
        var tmp = "<div class=\"card\" id=\"myHoldOutCard\" style=\"background-color: red;\"></div>";
    }
    $("#myHoldOutCard").html(tmp);

    // player stat render
    if (gameInfo.players[playerPos].available) { 
        $("#playerStat").html("나의 남은 카드 : " + gameInfo.players[playerPos].leftCards);
    }
    else {
        $("#playerStat").html("남은 카드가 없습니다.");
    }

    // nowTurn render
    $("#nowTurn").html("현재 차례 : " + gameInfo.players[gameInfo.nowTurn].name);
    
    // hostFunc render
    if (hostName == player) {
        switch (gameInfo.nowState) {
            case 0: 
            case 3:
                $("#hostFunc").css("display", "block");
                $("#gameStart").css("display", "block");
                break;
            case 1:
            case 2:
                $("#hostFunc").css("display", "none");
                break;
        }
    }

};

// click event
$("#bell").click((e) => {
    socket.emit("hitBell", info);
}); 

$("#myDeck").click((e) => {
    socket.emit("holdOutCard", info);
});

$("#gameStart").click((e) => {
    socket.emit("gameStart", info);
    //$("#hostFunc").css("display", "none");
});

$("#exit").click((e) => {
    location.href = "../../game/list";
});

$(".hamburger").click((e) => {
    document.querySelector(".hamburger").classList.toggle("is-active");
    $("#menu").slideToggle("fast");
});

$("#showLog").click((e) => {
    $("#notice").toggle();
    $("#notice").draggable();
})

// from Server
socket.on("notice", (text) => {
    //console.log(text);
    $("#notice").html(text + "<br/>" + $("#notice").html());
});

socket.on("refresh", (gameInfo) => {
    game = gameInfo;
    render(game);
});

socket.on("ring", () => {
    hitBellSound.load();
    hitBellSound.play();
});

socket.on("cardSound", () => {
    holdOutCardSound.load();
    holdOutCardSound.play();
});

socket.on("getRoomInfo", (roomInfo) => {
    console.log(roomInfo);
});

// joinRoom
socket.emit("joinRoom", {index : roomNum, hostName : hostName, playerId : player});

// css 
$("#menu").css("padding-top", $(".hamburger").css("width"));
$("#myDiv").css("margin-top", $("#anotherPlayersDiv").css("height").replace("px", "") * 1 + $("#bellDiv").css("height").replace("px", "") * 1 + 5 + "px");
$("#bellDiv").css("margin-top", $("#anotherPlayersDiv").css("height"));