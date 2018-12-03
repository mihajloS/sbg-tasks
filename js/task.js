// Handle task page

// collect task id from url
const urlParams = new URLSearchParams(window.location.search); // won't work in IE
const tid = urlParams.get('id');

// from comm.js
var communicator = new SBGCommunicator()
// from modal.js
var modal = new Modal('btnCreateProject', communicator)

// fetch and display task in html
showTask(tid)

function showTask(taskID) {
	// handle bad task id
	if (taskID === null) {
		displayError('No task id provided')
		return;
	}
 	// fetch task and display it
	communicator.getTask(taskID).then((task) => {
		var task_elements = document.getElementsByClassName('task_data')
		for (index = 0; index < task_elements.length; ++index) {
		    task_elements[index].style.display = 'block'
		}
		document.getElementsByClassName('task_data')[0].style.display = 'block'
		document.getElementById('task_name').innerText = 'Task name: ' + task.name
		document.getElementById('task_status').innerText = 'Task name: ' + task.status
		document.getElementById('task_project').innerText = 'Task name: ' + task.project
	}, () => {
		displayError('Error while fetching task!')
	})
}

function displayError(msg) {
	var errorEl = document.getElementsByClassName('error')[0]
		errorEl.style.display = 'block';
		errorEl.innerText = msg
}