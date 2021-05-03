/**
 * jQuery Plugin to obtain touch gestures from iPhone, iPod Touch and iPad, should also work with Android mobile phones (not tested yet!)
 * Common usage: wipe images (left and right to show the previous or next image)
 * @author Andreas Waltl, netCU Internetagentur (http://www.netcu.de)
 * This file has been modified by the webiste developers!
 */
;(function($) {
	$.fn.swipe = function(settings) {
		var config = {
			maxMoveX: 100,
			maxMoveY: 100,
			cancelMoveY: 100,
			cancelMoveX: 100,
			minMoveY: 20,
			minMoveX: 20,
			enableX: true,
			enableY: true,
			left: function() {},
			right: function() {},
			up: function() {},
			down: function() {},
			moveHorizontal: function(dx, pageX) {},
			moveVertical: function(dy, pageY) {},
			cancel: function() {},
			preventDefaultEvents: true
		}

		if (settings) $.extend(config, settings)

		this.each(function() {
			var start = {}
			var isMoving = false

			function cancelTouch() {
				this.removeEventListener('touchmove', onTouchMove)
				this.removeEventListener('touchend', onTouchEnd)
				start = {}
				isMoving = false
			}

			function onTouchMove(e) {
				if (config.preventDefaultEvents) {
					e.preventDefault()
				}
				var x = e.touches[0].pageX
				var y = e.touches[0].pageY
				var dx = start.x - x
				var dy = start.y - y
				if (!isMoving) {
					if (config.enableX && Math.abs(dx) >= config.minMoveX) isMoving = true
					else if (config.enableY && Math.abs(dy) >= config.minMoveY) isMoving = false
				}
				if (isMoving) {
					if (!config.enableX && Math.abs(dx) >= config.cancelMoveX) {
						config.cancel()
						cancelTouch()
						return
					}
					if (!config.enableY && Math.abs(dy) >= config.cancelMoveY) {
						config.cancel()
						cancelTouch()
						return
					}
					if (config.enableX)
						if (config.moveHorizontal(dx, x) === true) {
							config.cancel()
							cancelTouch()
							return
						}
					if (config.enableY)
						if (config.moveVertical(dy, y) === true) {
							config.cancel()
							cancelTouch()
							return
						}
					if (config.enableX && Math.abs(dx) >= config.maxMoveX) {
						cancelTouch()
						if (dx > 0) {
							config.left()
						} else {
							config.right()
						}
					} else if (config.enableY && Math.abs(dy) >= config.maxMoveY) {
						cancelTouch()
						if (dy > 0) {
							config.down()
						} else {
							config.up()
						}
					}
				}
			}

			function onTouchEnd(e) {
				if (isMoving) config.cancel()
			}

			function onTouchStart(e) {
				if (e.touches.length == 1) {
					isMoving = false
					start.x = e.touches[0].pageX
					start.y = e.touches[0].pageY
					this.addEventListener('touchmove', onTouchMove, false)
					this.addEventListener('touchend', onTouchEnd, false)
				}
			}
			if ('ontouchstart' in document.documentElement) {
				this.addEventListener('touchstart', onTouchStart, false)
			}
		})

		return this
	}
})(jQuery)
