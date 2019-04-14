/* A static file for managing our group shit... */
const group = {
	search_criteria: () => {
		return {
			accommodations: [],
			proximity: {
				city_centre: true,
				radius: 0,
				districts: []
			}
		}
	}
};

let _state = {
	ready: false
};

exports.update = args => {
	console.log("GROUP ACTIVITY BEGIN...");
	console.log("========================================");
	console.dir(args);
	console.log("========================================");

	_state = Object.assign(_state, {
		ready: true,
	}, args);
};
exports.data = () => {
	return _state;
};
