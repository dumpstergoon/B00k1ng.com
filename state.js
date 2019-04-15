const config = require("./config");
const models = require("./models");
const send = require("./send");
const api = require("./api");

const group = require("./group");

const SANITIZE = datestring => datestring.substring(0, datestring.indexOf('T'));
const DATE = date => `${config.DAYS[date.getDay()]} ${date.getDate()} ${config.MONTHS[date.getMonth()]}`;
const NIGHTS = timespan => {
	return Math.floor(timespan / 1000 / 60 / 60 / 24);
};

let _started = false;
const state = {
	default: {
		[config.POSTBACKS.GET_STARTED]: psid => {
			// TODO: Batch messages...
			send.typing_on(psid);
			
			if (!_started) {
				_started = true;
				send.generic(psid, models.elements.generic(
					config.SCRIPTS.WELCOME_TITLE,
					"Let's get started!" // What about this?
				)); // we need like a .then something.....
			}
			setTimeout(() => {
				send.text(psid, config.SCRIPTS.WHERE_ARE_YOU_GOING);
			}, 1500);

			return state.city_search;
		},
		message: (psid, message) => state.default[config.POSTBACKS.GET_STARTED](psid)
	},
	city_search: {
		_id: -1,
		_name: "",
		_region: "",
		_country: "",
		_image: "",
		_url: "",
		[config.POSTBACKS.YES]: psid => {
			setTimeout(() => {
				send.text(psid, config.SCRIPTS.CITY_SUCCESS);
				send.typing_on(psid);
				setTimeout(() => {
					send.text(psid, config.SCRIPTS.WHEN_ARE_YOU_GOING);
					setTimeout(() => {
						send.text(psid, config.SCRIPTS.DATE_HINT);
					}, 1500);
				}, 1000);
			}, 1000);
			return state.travel_date;
		},
		[config.POSTBACKS.NO]: psid => {
			send.text(psid, config.SCRIPTS.CITY_RETRY);
			return state.city_search;
		},
		message: (psid, message) => {
			send.typing_on(psid);
			send.text(psid, config.SCRIPTS.CITY_SEARCHING);

			api.autocomplete(message.text, (res, data) => {
				let result = data.result[0];

				if (!result || !result.forecast) {
					send.text(psid, `No cities with hotels found for "${message.text}". Try again :)`);
					return state.city_search;
				}
				
				state.city_search._id = result.id;
				state.city_search._name = result.city_name;
				state.city_search._region = result.region;
				state.city_search._country = result.country_name;
				state.city_search._image = `${config.DOMAIN}/assets/images/${result.city_name.toLowerCase().replace(/\s/gi, '_')}.jpg`;
				state.city_search._url = `https://duckduckgo.com/?q=${result.city_name}%2C+${result.region}%2C+${result.country_name}&t=h_&ia=weather`;

				send.generic(psid, models.elements.generic(
					result.label,
					`Low: ${result.forecast.min_temp_c}ºC - High: ${result.forecast.max_temp_c}ºC ${config.WEATHER[result.forecast.icon]}`,
					state.city_search._image
				));
				setTimeout(() => send.yes_no(psid, "Is this the right place?"), 1000);
			});

			return state.city_search;
		}
	},
	travel_date: {
		_checkin: Date.now(),
		message: (psid, message) => {
			let datetime = message.nlp.entities.datetime && message.nlp.entities.datetime[0];
			if (datetime) {
				state.travel_date._checkin = (new Date(SANITIZE(datetime.value)));
				send.text(psid, config.SCRIPTS.DATE_SUCCESS);

				setTimeout(() => {
					send.text(psid, config.SCRIPTS.HOW_MANY_NIGHTS);
				}, 1000);

				return state.duration;
			}

			send.text(psid, config.SCRIPTS.DATE_RETRY);
			return state.travel_dates;
		}
	},
	duration: {
		_arrive: null,
		_depart: null,
		_duration: 0,
		[config.POSTBACKS.YES]: psid => {
			send.text(psid, config.SCRIPTS.NIGHTS_SUCCESS);
			setTimeout(() => send.text(psid, config.SCRIPTS.NUMBER_OF_GUESTS), 1500);
			return state.guests;
		},
		[config.POSTBACKS.NO] : psid => {
			send.text(psid, config.SCRIPTS.NIGHTS_DENIED);
			setTimeout(() => send.text(psid, config.SCRIPTS.WHEN_ARE_YOU_GOING), 1000);
			return state.travel_date;
		},
		message: (psid, message) => {
			let datetime = message.nlp.entities.datetime && message.nlp.entities.datetime[0];

			if (datetime) {
				let checkin = state.travel_date._checkin;
				let checkout = (new Date(SANITIZE(datetime.value)));

				console.log("========================================");
				console.log(checkin, checkout);
				console.log("========================================");

				state.duration._arrive = checkin;
				state.duration._depart = checkout;
				state.duration._duration = NIGHTS(checkout.getTime() - checkin.getTime());

				send.text(psid, `Arrive: ${DATE(checkin)}`);
				setTimeout(() => send.text(psid, `Depart: ${DATE(checkout)}`), 1000);
				setTimeout(() => send.yes_no(psid, config.SCRIPTS.NIGHTS_CONFIRM), 2000);

				return state.duration;
			}

			send.text(psid, config.SCRIPTS.NIGHTS_RETRY);
			return state.duration;
		}
	},
	guests: {
		_guests: 1,
		message: (psid, message) => {
			// USE NLP a wee bit to get number of guests.
			// Just assume it is a plan number for now
			let guests = parseInt(message.text);
			
			if (isNaN(guests)) {
				send.text(psid, config.SCRIPTS.GUESTS_RETRY);
				return state.guests;
			}

			let city = {
				id: state.city_search._id,
				name: state.city_search._name,
				region: state.city_search._region,
				country: state.city_search._country,
				image: state.city_search._image,
				url: state.city_search._url,
			}

			let duration = {
				start: DATE(state.duration._arrive),
				end: DATE(state.duration._depart),
				days: state.duration._duration
			}

			send.text(psid, config.SCRIPTS.GUESTS_SUCCESS);
			send.typing_on(psid);
			setTimeout(() => {
				send.list(
					psid,
					[
						models.elements.list_item(
							city.name,
							`${city.region}, ${city.country}`,
							city.image,
							models.buttons.click(config.DOMAIN + "/group"),
							models.buttons.url(
								"View City",
								city.url,
								config.SIZE.FULL,
								config.HIDE
							)
						),
						models.elements.list_item(
							`${duration.start} to ${duration.end}`,
							`${duration.days} night stay 🌛️`
						),
						models.elements.list_item(
							`${guests} guest${guests > 1 ? 's' : ''}`,
							`Share this module with your friends to start planning your trip together! 💃️`
						),
					],
					models.buttons.url(
						"Start Planning",
						config.DOMAIN + "/group",
						config.SIZE.FULL,
						config.HIDE
					),
					config.SIZE.LARGE,
					true
				);
				
				setTimeout(() => {
					send.typing_on(psid);
					setTimeout(() => {
						send.text(psid, `I have saved ${city.name}, ${city.country} in "My Trips"`);
						send.typing_on(psid);
						send.attachment(
							psid,
							models.attachment(
								models.payloads.attachment(
									config.DOMAIN + "/assets/images/drawer.jpg",
									false
								)
							),
							"You will now see Booking Bot in your messenger drawer, you can access this anytime."
						);
						setTimeout(() => {
							send.text(psid, "Start a group chat in messenger with your fellow travellers, or open an existing one. Booking Bot will help the group easily vote and book the best fit for all.");
							setTimeout(() => send.text(psid, "Bon voyage! ✈️"), 1500);
						}, 2000);
					}, 3000);
				}, 2000);
			}, 2000);

			group.update({
				city: city,
				duration: duration,
				guests: guests
			});

			return state.done;
		}
	},
	done: {
		message: (psid, message) => {
			send.text(psid, "ECHO: " + message.text);
			return state.done; // loop
		}
	}
};

exports.default = state.default;
exports.city_search = state.city_search;
exports.travel_date = state.travel_date;
exports.duration = state.default;
exports.guests = state.default;
exports.done = state.default;
