var socket = io();

var game = {};
var info = {index : roomNum, hostName : hostName, playerId : player};
// 게임 정보에 맞게 렌더링
var render = (gameInfo) => {

    var playerPos = gameInfo.players.indexOf(player);
    
    // player render
    $("#gameDiv").html("");
    for (var i = playerPos; i < playerPos + gameInfo.players.length; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i] + " : " + gameInfo.playerSurfaceCard[i].fruit + ", " + gameInfo.playerSurfaceCard[i].num + "</div>"
        console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    for (var i = 0; i < playerPos; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i] + " : " + gameInfo.playerSurfaceCard[i].fruit + ", " + gameInfo.playerSurfaceCard[i].num + "</div>";
        console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    
    // player stat render
    $("#playerStat").html("나의 남은 카드 : " + gameInfo.playerLeftCards[playerPos]);

};

// click event
$("#bell").click((e) => {
    socket.emit("hitBell", info);
}); 

$("#myDeck").click((e) => {
    socket.emit("holdOutCard", info);
});

// from Server
socket.on("notice", (text) => {
    console.log(text);
    $("#notice").html(text);
});

socket.on("refresh", (gameInfo) => {
    game = gameInfo;
    render(game);
});

// joinRoom
socket.emit("joinRoom", {index : roomNum, hostName : hostName, playerId : player});