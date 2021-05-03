onLoad(loadTutorials)
loadTutorials.site = null
loadTutorials.btnLogin = $('#tutorialButtonLogin')
loadTutorials.btnOverview = $('#tutorialButtonOverview')
loadTutorials.btnCalendar = $('#tutorialButtonCalendar')
loadTutorials.btnSettings = $('#tutorialButtonSettings')
function loadTutorials() {
	loadTutorials.btnLogin.click(() => {
		startTutorial('login')
	})
	loadTutorials.tutorialFrame = $('#tutorialFrame')
	loadTutorials.tutorialFrame.on('load', function () {
		var frame = loadTutorials.tutorialFrame
		var contents = frame.contents()
		frame = frame[0]
		var body = contents.find('body')
		TutorialPopup.body = body
		body.append(
			$('<style>', {
				text: `
         .info {
            padding: 7px;
            z-index: 5020;
            background-color: white;
            border: 2px solid var(--col-theme);
         }`
			})
		)
		body.append(
			$('<div>', {
				css: {
					'background-color': 'rgba(0,0,0,0.3)',
					'pointer-events': 'all',
					'z-index': '5000',
					'position': 'fixed',
					'top': 0,
					'bottom': 0,
					'left': 0,
					'right': 0
				}
			})
		)

		switch (loadTutorials.site) {
			case 'login':
				loginTutorial(frame, contents, body)
				break
			case 'overview':
				overviewTutorial(frame, contents, body)
				break
			case 'calendar':
				calendarTutorial(frame, contents, body)
				break
			case 'settings':
				settingsTutorial(frame, contents, body)
				break
		}
	})

	if (me) onLogin()
	else onLogout()
	if (location.hash && location.hash.length > 1) {
		startTutorial(location.hash.substr(1))
	}
	loadNext()
}
onLogin = () => {
	loadTutorials.btnOverview.removeClass('disabled')
	//loadTutorials.btnSettings.removeClass("disabled");
	loadTutorials.btnSettings.click((e) => {
		new Toast('Dieses Tutorial wird in der nächsten version veröffentlicht')
		//	startTutorial("settings")
	})
	loadTutorials.btnOverview.click((e) => {
		startTutorial('overview')
	})
	if (me.userName != 'Anonym') {
		loadTutorials.btnCalendar.removeClass('disabled')
		loadTutorials.btnCalendar.click((e) => {
			startTutorial('calendar')
		})
	} else {
		loadTutorials.btnCalendar.click((e) => {
			disabledReasonToast(true)
		})
	}
	return true
}
onLogout = () => {
	loadTutorials.btnOverview.addClass('disabled')
	loadTutorials.btnCalendar.addClass('disabled')
	loadTutorials.btnSettings.addClass('disabled')

	loadTutorials.btnOverview.click((e) => {
		disabledReasonToast(false)
	})
	loadTutorials.btnSettings.click((e) => {
		disabledReasonToast(false)
	})
	loadTutorials.btnCalendar.click((e) => {
		disabledReasonToast(true)
	})
}

function disabledReasonToast(user = false) {
	if (user) {
		new Toast('Sie müssen als Benutzer eingeloggt sein um dieses Tutorial zu starten.')
	} else {
		new Toast('Sie mussen eingeloggt sein um dieses Tutorial zu starten')
	}
}

function startTutorial(name) {
	loadTutorials.site = name
	switch (name) {
		case 'login':
			setSite('')
			break
		case 'overview':
			setSite('overview')
			break
		case 'calendar':
			setSite('calendar')
			break
		case 'settings':
			setSite('settings')
			break
		default:
	}
	if (location.hash != `#${name}`) history.pushState(null, '', `#${name}`)
}

function setSite(site) {
	if (site == null) {
		if (location.hash != `#`) history.pushState(null, '', `#`)
		$('#tutorialWrapper').addClass('inv')
		return
	}
	$('#tutorialFrame').attr('src', 'https://' + window.location.hostname + '/' + site)
	$('#tutorialWrapper').removeClass('inv')
}

function loginTutorial(frame, contents, body) {
	var frameWin = frame.contentWindow
	if (me) {
		frameWin.fakeLogout()
	}
	contents.find('#userBtn').css('z-index', '5010')
	body.append(
		$('<p>', {
			id: 'loginBtnInfo',
			text: 'Zum Anmelden hier drücken',
			class: 'info',
			css: {
				position: 'absolute',
				right: '48px',
				top: '48px'
			}
		})
	)
	contents.find('nav').css('z-index', 'initial')
	contents.find('#dataPopup').css('z-index', '5010')
	body.append(
		$('<p>', {
			id: 'loginInfo',
			text: 'Loggen Sie sich hier mit Ihren Anmeldedaten von Untis ein. Sollte Sie keinen Acount haben geben Sie nur Ihre Schule an. ',
			class: 'info',
			css: {
				position: 'fixed',
				top: 'calc(10% + 280px)',
				left: '50%',
				width: '210px',
				transform: 'translateX(-50%)',
				visibility: 'hidden'
			}
		})
	)

	contents.find('#userBtn').click(function () {
		contents.find('#loginInfo').css('visibility', 'visible')
		contents.find('#loginBtnInfo').css('visibility', 'hidden')
		contents.find('#userBtn').css('z-index', '')
	})
	frameWin.onLogin = function () {
		contents.find('#loginInfo').css('visibility', 'hidden')
		setTimeout(() => {
			setSite(null)
		}, 1000)
		return true
	}
}

function overviewTutorial(frame, contents, body) {
	var pageInfoElem = $('<p>', {
		text: 'Bei der Übersicht siehst du die wichtigsten Infos auf einem Blick',
		class: 'info',
		css: {
			position: 'fixed',
			top: '50%',
			left: '50%',
			width: '210px',
			transform: 'translate(-50%, -50%)'
		}
	})
	body.append(pageInfoElem)
	var editInfoElem = $('<p>', {
		text: 'Im Bearbeiten-Modus kannst du die Infopanels verschieben',
		class: 'info',
		css: {
			position: 'absolute',
			top: '44px',
			right: 'calc(3% + 50px)',
			width: '210px',
			visibility: 'hidden'
		}
	})
	body.append(editInfoElem)
	var moveInfoElem = $('<p>', {
		text: 'Versuche ein Panel zu verschieben',
		class: 'info',
		css: {
			position: 'fixed',
			bottom: '10px',
			left: '50%',
			width: '210px',
			transform: 'translate(-50%, -50%)',
			visibility: 'hidden'
		}
	})
	moveInfoElem.append($('<br>'))
	moveInfoElem.append(
		$('<button>', {
			text: 'Fertig',
			click: () => {
				setSite(null)
			},
			class: 'menu-button',
			css: {
				float: 'right'
			}
		})
	)
	body.append(moveInfoElem)

	body.append(
		$('<style>', {
			text: `
      @keyframes pulse {
        50% {
            opacity: 0.5;
        }
      }
      .pulser {
          animation: pulse 1s linear infinite;
      }`
		})
	)

	pageInfoElem.append('<br>')
	pageInfoElem.append(
		$('<button>', {
			text: 'Weiter',
			class: 'menu-button',
			click: () => {
				var boxEditBtn = contents.find('#boxEditBtn')
				boxEditBtn.css({
					'z-index': 5010,
					'background-color': 'var(--col-background)',
					'position': 'relative'
				})
				boxEditBtn.click(() => {
					editInfoElem.css('visibility', 'hidden')
					moveInfoElem.css('visibility', 'visible')
					boxEditBtn.css('z-index', '')
					var topPanel = null
					for (var i = 1; i < 9 && topPanel == null; i++) {
						contents
							.find('#col' + i)
							.children()
							.each((_, panel) => {
								jqPanel = $(panel)
								if (jqPanel.hasClass('box-wrapper')) {
									topPanel = jqPanel
									return false
								}
							})
					}

					topPanel.css({
						'z-index': 5010,
						'position': 'relative'
					})
					var handle = topPanel.find('.drag-handle')
					handle.addClass('pulser')
					handle.on('mousedown', () => {
						handle.removeClass('pulser')
						topPanel.css('z-index', '')
						contents.find('#panels').css({
							'z-index': 5010,
							'position': 'relative'
						})
					})
					boxEditBtn.css('z-index', '')
				})
				pageInfoElem.css('visibility', 'hidden')
				editInfoElem.css('visibility', 'visible')
			},
			css: {
				float: 'right'
			}
		})
	)
}

function calendarTutorial(frame, contents, body) {
	var pageInfo = new TutorialPopup('Mit dem Kalender können Termine auf einen Blick überschaut werden.', 'Weiter', () => {
		pageInfo.hide()
		addEventInfo.show()
		var addEventButtons = contents.find('.add-event-button')

		addEventButtons.css({
			'z-index': 5010,
			'box-shadow': '0px 0px 1px 3px snow'
		})

		frame.contentWindow.editEventPopup = (date) => {
			popupDate = date
			addEventInfo.hide()
			eventInfo.show()
			addEventButtons.css({
				'z-index': 0,
				'background-color': 'var(--col-calendar-addbtn)',
				'box-shadow': '0px 0px 0px 0px snow'
			})

			var calendarPopup = contents.find('#dataPopup')
			calendarPopup.css({
				'z-index': 5010
			})
		}
	})
	var addEventInfo = new TutorialPopup('Klicke auf eines der Plus um einen Termin hinzuzufügen.')
	var eventInfo = new TutorialPopup(
		'Im nächsten Fenster kannst du Termine eintragen. Dein Kalssenvorstand kann festlegen ob du deine Termine mit deiner Klasse teilen kannst.',
		'Weiter',
		() => {
			eventInfo.hide()
			oldEdit(popupDate)
			var button = contents.find('.popup-buttons button')
			if (button != null) {
				button.unbind()
				button.click(() => {
					var form = contents.find('#popupForm')
					if (!form[0].checkValidity()) {
						form[0].reportValidity()
						return
					}
					saveInfo.show()
					eventInfo.hide()
				})
			}
		}
	)
	var saveInfo = new TutorialPopup(
		'Möchtest du den Eintrag wirklich erstellen?',
		'Ja',
		() => {
			frame.contentWindow.editEventPopup.sendEvent()
			setTimeout(() => {
				setSite(null)
			}, 1000)
		},
		'Nein',
		() => {
			setTimeout(() => {
				setSite(null)
			}, 1000)
		}
	)
	var popupDate = null
	var oldEdit = frame.contentWindow.editEventPopup
	pageInfo.show()
}

function settingsTutorial(frame, contents, body) {
	var homePage = contents.find($('x-setting[data-name=homePage] > div.setting-value > select')[0])
	/*homePage.css({
        "z-index": 5040
    });*/
}
class TutorialPopup {
	elem
	constructor(text, rightButtonText = undefined, rightButtonClick = undefined, leftButtonText = undefined, leftButtonClick = undefined) {
		this.elem = $('<p>', {
			class: 'info',
			css: {
				position: 'fixed',
				top: '50%',
				left: '50%',
				width: '250',
				transform: 'translate(-50%, -50%)',
				visibility: 'hidden'
			}
		})
		this.elem.append(
			$('<p>', {
				text: text
			})
		)
		if (rightButtonText)
			this.elem.append(
				$('<button>', {
					class: 'menu-button',
					text: rightButtonText,
					click: rightButtonClick,
					css: {float: 'right'}
				})
			)
		if (leftButtonText)
			this.elem.append(
				$('<button>', {
					class: 'menu-button',
					text: leftButtonText,
					click: leftButtonClick,
					css: {float: 'left'}
				})
			)

		TutorialPopup.body.append(this.elem)
	}
	show() {
		this.elem.css('visibility', 'visible')
	}
	hide() {
		this.elem.css('visibility', 'hidden')
	}
}
