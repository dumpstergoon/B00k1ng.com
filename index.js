const app = require("express")();

/*

	B00k1ng B0t

	A messenger chat bot and extension for booking.com

	Graham Robertson & Louisette Baillie

*/

const PORT = 3000;

app.get('/', (req, res) => {
	console.log("request received.");
	res.send("Hello, World!");
});

/* Bot  */
app.listen(PORT, () => {
	console.log("b00k1ng b0t - ONLINE.");
});
