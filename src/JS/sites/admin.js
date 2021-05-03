loadUsers()
loadEditData()

function loadUsers() {}
function loadEditData() {}
function change() {}
function create() {
	askEmpAjax(
		'type=set&setType=addEmp&username=' +
			$('#nuser').val() +
			'&rank=' +
			$('#nrank').val() +
			'&school=' +
			$('#nschool').val() +
			'&password=' +
			$('#npass').val() +
			'&uUsername=' +
			$('#nuUser').val() +
			'&uPassword=' +
			$('#nuPass').val(),
		function () {
			new Toast('Erfolgreich')
		}
	)
}
function askEmpAjax(data, callback) {
	ajax('/PHP/empajax.php', {
		method: 'POST',
		body: data
	})
		.then(callback)
		.catch(() => {})
}
