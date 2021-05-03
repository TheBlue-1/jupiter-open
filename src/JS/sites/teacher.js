onLoad(load)
onLogin = load
onLogout = lout

var classes

function lout() {
	toggleLoginEnforcer('Du musst als Lehrer angemeldet sein um diese Seite zu nutzen!')
}
async function load() {
	if (!me || !me.isTeacher) {
		toggleLoginEnforcer('Du musst als Lehrer angemeldet sein um diese Seite zu nutzen!')
		return true
	}
	toggleLoginEnforcer(null)
	var box = $('#classesBox')
	var data = await WebUntis.getTeachersClasses(false)
	if (!data.exists) return
	data = data.first
	classes = {}
	data = safeJSONParse(data)
	if (!data) {
		new Toast('Interner Fehler')
		console.warn('Invalid JSON')
		return
	}
	box.empty()
	for (var i = 0; i < data.length; i++) {
		var classId = data[i].id
		classes[classId] = {}
		classes[classId].students = {}
		classes[classId].name = data[i].name
		for (var j = 0; j < data[i].admins.length; j++) {
			data[i].admins[j] = data[i].admins[j].userId
		}

		for (var j = 0; j < data[i].students.data.elements.length; j++) {
			var studentId = data[i].students.data.elements[j].id
			classes[classId].students[j] = {}
			classes[classId].students[j].id = studentId
			classes[classId].students[j].isAdmin = data[i].admins.indexOf('' + studentId) != -1
			classes[classId].students[j].name = data[i].students.data.elements[j].displayname
		}
		var classBox = $('<div>', {class: 'classBox'})
		box.append(classBox)
		classBox.append($('<h4>', {text: classes[classId].name + ':'}))
		var adminBlock = $('<p>', {class: 'admin-block'})
		classBox.append(adminBlock)
		adminBlock.append($('<b>', {text: 'Administratoren:'}))
		adminBlock.append($('<br>'))
		var adminList = $('<ul>')
		adminBlock.append(adminList)
		var selectP = $('<p>', {text: 'Admin hinzufügen: '})
		var studentSelect = $('<select>')
		selectP.append(studentSelect)
		selectP.append(
			$('<button>', {
				text: 'Hinzufügen',
				click: function () {
					onAddClick(studentSelect[0], classId)
				},
				class: 'menu-button'
			})
		)
		classBox.append(selectP)

		$.each(classes[classId].students, function (_, student) {
			if (student.isAdmin) {
				var li = $('<li>')
				adminList.append(li)
				li.append(
					$('<span>', {
						text: student.name
					}).append(
						$('<button>', {
							class: 'remove-icon',
							style: 'background-color: transparent',
							click: function () {
								onRemoveClick(student.id, classId)
							}
						})
					)
				)
			} else studentSelect.append($('<option>', {text: student.name, value: student.id}))
		})
	}
	return true
}
function onAddClick(select, id) {
	userId = select.value
	ajax('/PHP/ajax.php', {
		method: 'POST',
		body: 'type=put&putType=addAdmin&id=' + userId + '&class=' + id
	})
		.then(() => {
			new Toast('Erfolgreich hinzugefügt', 1)
		})
		.catch(() => {})
	load()
}
function onRemoveClick(id, classId) {
	ajax('/PHP/ajax.php', {
		method: 'POST',
		body: 'type=put&putType=deleteAdmin&id=' + id + '&class=' + classId
	})
		.then(() => {
			new Toast('Erfolgreich entfernt', 1)
		})
		.catch(() => {})
	load()
}
