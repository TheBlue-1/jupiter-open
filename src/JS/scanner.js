function isMobileDevice() {
	return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent)
}

function isTouchDevice() {
	var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ')
	var mq = function (query) {
		isTouch = window.matchMedia(query).matches
		return isTouch
	}

	if ('ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch)) {
		isTouch = true
		return isTouch
	}

	// include the 'heartz' as a way to have a non matching MQ to help terminate the join
	// https://git.io/vznFH
	var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('')
	isTouch = mq(query)
	return isTouch
}
