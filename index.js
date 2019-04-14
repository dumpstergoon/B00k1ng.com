const express = require("express");
const app = express();

const layouts = require('express-ejs-layouts');
const body_parser = require("body-parser");
const cookie_parser = require("cookie-parser");

const config = require("./config");
const models = require("./models");

const api = require("./api");
const receive = require("./receive");
const group = require("./group");

/*

	B00k1ng B0t

	A messenger chat bot and extension for booking.com

	Graham Robertson & Louisette Baillie

*/
const URL = path => config.DOMAIN + path;

/*

	Hook everything together!!

*/
if (config.DEV_MODE) {
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/assets', express.static(__dirname + '/assets'));
}

app.use(layouts);
app.use(body_parser.json());
app.use(body_parser.urlencoded({
	extended: false
}));
app.use(cookie_parser());
app.set("view engine", "ejs");


app.get('/', (req, res) => {
	res.render("index");
});

app.get('/trips', (req, res) => {
	res.render("trips");
});

app.get('/help', (req, res) => {
	res.render("help");
});

app.get('/group', (req, res) => {
	// This only works once group is doing something...
	let data = group.data();

	if (data.ready) {
		// Accommodations
		data.accommodations = [config.SEARCH.HOTELS, config.SEARCH.APARTMENTS, config.SEARCH.HOSTELS];
		// Rooms
		data.rooms = [config.SEARCH.SINGLE, config.SEARCH.DOUBLE, config.SEARCH.MULTIPLE];
		// Facilities
		data.facilities = [config.SEARCH.BREAKFAST, config.SEARCH.TEA_COFFEE, config.SEARCH.BATHROOM, config.SEARCH.WIFI, config.SEARCH.POOL, config.SEARCH.PARKING];
		// Districts
		api.districts(data.city.id, (res, body) => {
			let results = data.result;
			data.city.districts = results.map(result => {
				return {
					label: result.name,
					id: result.district_id
				}
			});

			res.render("group");
		});
	} else {
		res.render("help");
	}
});

// We should make a wee API for testing these messages.
app.route("/webhook")
	.get((req, res) => {
		let mode = req.query['hub.mode'];
		let token = req.query['hub.verify_token'];
		let challenge = req.query['hub.challenge'];

		if (mode && token) {
			if (mode === 'subscribe' && token === config.APP_SECRET) {
				console.log("VERIFIED: Webhook", config.APP_SECRET);
				res.status(config.OK).send(challenge);
			}
		} else {
			console.error("FAILED. Webhook did not validate.");
			res.status(config.BAD).send("Bad Request.");
		}
	})
	.post((req, res) => {
		res.sendStatus(config.OK);

		const data = req.body;
		
		if (data.object === "page") {

			//console.log("MESSAGE RECEIVED:", JSON.stringify(data));

			data.entry.forEach(entry => {
				if (!entry.messaging)
					return;
				
				entry.messaging.forEach(event => {
					if (event.message)
						receive.message(event);
					else if (event.postback)
						receive.postback(event);
					else
						console.error("UNKNOWN EVENT:", event);
				});
			});
		}
	});

if (config.DEV_MODE) {
	api.profile(models.profile.config(
		config.SCRIPTS.WELCOME_TITLE + "\n\n" + config.SCRIPTS.WELCOME_MESSAGE,
		models.profile.menu([
			models.buttons.postback("Get Started", config.POSTBACKS.GET_STARTED),
			models.buttons.menu("My Trips", URL("/trips")),
			models.buttons.menu("Help", URL("/help"))
		])
	));
}

app.listen(config.PORT, () => {
	console.log("b00k1ng b0t - ONLINE.");
	console.log("APP ID:", config.APP_ID);
	console.log("PAGE TOKEN:", config.PAGE_ACCESS_TOKEN);
});
