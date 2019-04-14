const request = require("request");
const config = require("./config");
const api = {
	_: (uri, params, data, success, failure) => {
		request({
			uri: uri,
			qs: params || {},
			method: data ? "POST" : "GET",
			json: data
		}, (err, res, body) => {
			if (!err && res.statusCode === config.OK)
				success && success(res, body);
			else if (failure)
				failure(res, body);
			else
				console.error("API ERROR:", res.statusCode, res.statusMessage, body.error, params);
		});
	},
	// TODO: implement Places API
	places: (search_text, fields = ["photos"]) => {
		// api._(
		// 	PLACES_API,
		// 	{
		// 		key: PLACES_KEY,
		// 		input: search_text,
		// 		inputtype: "textquery",
		// 		fields: fields.join(",")
		// 	},
		// );
	},
	booking: (end_point, params, success) => {
		api._(
			config.BOOKING_API + end_point,
			params,
			null,
			(res, body) => success(res, JSON.parse(body))
		);
	},
	autocomplete: (text, success) => {
		api.booking("autocomplete", {
			text: text,
			language: "en",
			extras: "forecast"
		}, success);
	},
	districts: (city_id, success) => {
		api.booking("districts", {
			city_ids: city_id
		}, success);
	},
	messenger: (end_point, params, data) => {
		api._(
			config.MESSENGER_API + end_point,
			Object.assign({
				access_token: config.PAGE_ACCESS_TOKEN
			}, params),
			data
		);
	},
	// TODO: batch messaging.
	messages: (message, params = {}) => api.messenger("messages", params, message),
	profile: (profile, params = {}) => api.messenger("messenger_profile", params, profile),
	upload: (attachment, params = {}) => api.messenger("message_attachments", params, attachment)
};
exports.autocomplete = api.autocomplete;
exports.districts = api.districts;
exports.messages = api.messages;
exports.profile = api.profile;
exports.upload = api.upload;
