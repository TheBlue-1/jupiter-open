onLoad(init)

function init() {
	loadUpdateNews()
}

function loadUpdateNews() {
	ajax('/PHP/ajax.php', {
		body: 'type=get&getType=versionHistory',
		method: 'POST'
	})
		.then(async (resp) => {
			const data = await resp.text()
			if (data != null && data != '') {
				var p = $('<p></p>')
				p.html(data)
				var news = $('#updateNews')
				news.children('p').remove()
				news.append(p)
			}
		})
		.catch(() => {})
}

onLogin = () => {
	return true
}
