exports.DEV_MODE = true;
exports.DOMAIN = "https://b00k1ng.com";
exports.PORT = 3000;
exports.OK = 200;
exports.BAD = 403;

exports.MESSENGER_API = "https://graph.facebook.com/v2.6/me/";
exports.BOOKING_API = "https://hackaton_team_graham:B00ndock5!@distribution-xml.booking.com/2.0/json/";
exports.PLACES_API = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
exports.PHOTOS_API = "https://maps.googleapis.com/maps/api/place/photo/";

exports.APP_ID = 417588018987362;
exports.APP_SECRET = "b00k1ng.b0t"
exports.PAGE_ACCESS_TOKEN = require("./TOKEN.js");
exports.HOME_URL = exports.DOMAIN + "/group";
exports.WHITELIST = [exports.DOMAIN, "https://duckduckgo.com"];

exports.PLACES_KEY = "AIzaSyAKzhe2wmODZQRENcpWXJ0qncxYOtFEG1k";

exports.SEARCH = {
	HOTELS: {
		label: "hotels",
		id: 204
	},
	APARTMENTS: {
		label: "apartments",
		id: 201
	},
	HOSTELS: {
		label: "hostels",
		id: 203
	},
	SINGLE: {
		label: "single",
		id: 10
	},
	DOUBLE: {
		label: "double",
		id: 9
	},
	TRIPLE: {
		label: "triple",
		id: 7
	},
	QUADRUPLE: {
		label: "quadruple",
		id: 4
	},
	MULTIPLE: {
		label: "multiple",
		id: -1
	},

	PARKING: {
		label: "Parking",
		facility_id: 1,
		hotel_facility_id: 2
	},
	WIFI: {
		label: "WiFi",
		hotel_facility_id: 96
	},
	POOL: {
		label: "Swimming Pool",
		hotel_facility_id: 21
	},
	BREAKFAST: {
		label: "Breakfast",
		hotel_facility_id: 24
	},
	TEA_COFFEE: {
		label: "Tea/Coffee maker",
		room_facility_id: 1,
		facility_id: 1
	},
	BATHROOM: {
		label: "Private Bathroom",
		room_facility_id: 38
	}
}

exports.DEFAULT = "default";
exports.SHOW = "show";
exports.HIDE = "hide";
exports.ALL = "all";
exports.SIZE = {
	COMPACT: "compact",
	TALL: "tall",
	FULL: "full",
	LARGE: "large"
};
exports.POSTBACKS = {
	GET_STARTED: "GET_STARTED",
	YES: "YES",
	NO: "NO",
	TRIPS: "TRIPS",
	HELP: "HELP"
};
exports.ACTION = {
	MARK_SEEN: "mark_seen",
	TYPING: "typing_on",
	DONE: "typing_off"
};
exports.MESSAGE = {
	RESPONSE: "RESPONSE",
	UPDATE: "UPDATE",
	SUBSCRIPTION: "MESSAGE_TAG"
};
exports.ATTACHMENT = {
	AUDIO: "audio",
	VIDEO: "video",
	IMAGE: "image",
	FILE: "file",
	TEMPLATE: "template"
};
exports.BUTTON = {
	URL: "web_url",
	POSTBACK: "postback",
	SHARE: "element_share",
	NESTED: "nested"
};
exports.QUICK_REPLY = {
	TEXT: "text"
};
exports.TEMPLATE = {
	GENERIC: "generic",
	LIST: "list",
	MEDIA: "media",
	BUTTON: "button"
};
exports.TAG = {
	FEATURE_FUNCTION_UPDATE: "FEATURE_FUNCTION_UPDATE",
	RESERVATION_UPDATE: "RESERVATION_UPDATE",
	PERSONAL_FINANCE_UPDATE: "PERSONAL_FINANCE_UPDATE",
	PAYMENT_UPDATE: "PAYMENT_UPDATE",
	NON_PROMOTIONAL_SUBSCRIPTION: "NON_PROMOTIONAL_SUBSCRIPTION"
};

exports.SCRIPTS = {
	WELCOME_TITLE: "Hi I'm b00k1ng b0t 🤖️",
	
	WELCOME_MESSAGE: "I'm here to help you plan a trip! 🏖️\
	I'm especially helpful if you're travelling with a group.\
	Making decisions will be super easy when you share your trip in you and your friends' group chat.\n\n",
	
	WHERE_ARE_YOU_GOING: "Where are you going? Simply reply with a city name 🧐️",
	CITY_SEARCHING: "🔎️ Searching... beep-boop-bop",
	CITY_SUCCESS: "Awesome 😎️ We're good at this!",
	CITY_RETRY: "Let's try again. Which city are you going to?",
	
	WHEN_ARE_YOU_GOING: "So, what is your date of arrival?",
	DATE_HINT: "(eg. Oct 31, Christmas Eve, ...)",
	DATE_SUCCESS: "Cool.",
	DATE_RETRY: "Sorry, didn't quite catch that... 😕️",

	HOW_MANY_NIGHTS: "and your leaving date?",
	NIGHTS_SUCCESS: "Almost there! 🏁️",
	NIGHTS_RETRY: "Oops. Give it another go.",
	NIGHTS_CONFIRM: "Is this correct?? ",

	NUMBER_OF_GUESTS: "How many people are travelling in your group? ✈️",
	GUESTS_SUCCESS: "Hooray! 🎉️ Creating your trip...",
	GUESTS_RETRY: "We're so close! Just pass us a whole number between 1 and 100 :)"
};

exports.WEATHER = {
	cloud: "☁️",
	partlycloud: "🌥️",
	lightcloud: "🌤️",
	sun: "☀️",
	fog: "🌫️",
	rain: "☔️",
	rainthunder: "⛈️",
	lightrain: "🌧️",
	lightrainsun: "🌦️",
	lightrainthunder: "⛈️",
	lightrainthundersun: "⛈️🌥️",
	snow: "❄️",
	snowsun: "❄️🌤️",
	snowthunder: "❄️🌩️",
	snowsunthunder: "❄️🌩️🌥️",
	sleet: "🌨️🌧️",
	sleetsun: "🌨️🌥️",
	sleetsunthunder: "🌨️🌥️⛈️",
	sleetthunder: "🌨️⛈️"
};

exports.DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];

exports.MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
