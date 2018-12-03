// Handle index page

// from comm.js
var communicator = new SBGCommunicator()
// from modal.js
var mod = new Modal('btnCreateProject', communicator)

user_getAndDisplay()
tasks_getAndDisplay()
setupLimitDropDown()
setupStatusDropDown()

// Fetch and display username
function user_getAndDisplay() {
    communicator.getUsername().then((username) => {
        var lbUsername = document.getElementById('lbUsername')
        lbUsername.innerText = 'Hello ' + username
    }, () => {
        lbUsername.innerText = 'Error while displaying username'
    })
}

// Fetch display task list
function tasks_getAndDisplay() {
    communicator.getTasks().then((items) => {
        displayTasks(items)
    }, () => {
        tbTasks.innerHTML = 'Error while listing tasks'
    })
}

// Listen for 5/10/25 limit drop down changes
function setupLimitDropDown() {
    document.getElementById('ddLimit').addEventListener("change", function() {
        var selectedLimit = this.options[this.selectedIndex].value;
        communicator.limitTasks = selectedLimit
        if (selectedLimit === 'None')
            communicator.limitTasks = ''

        tasks_getAndDisplay()
    });
}

// Listen for status drop down changes
function setupStatusDropDown() {
    document.getElementById('ddStatus').addEventListener("change", function() {
        var selectedStatus = this.options[this.selectedIndex].value;
        communicator.limitStatus = selectedStatus
        if (selectedStatus === 'ALL')
            communicator.limitStatus = ''
        
        tasks_getAndDisplay()
    });
}

// Draw tasks in html
function displayTasks(items) {
    var tbTasks = document.getElementById('tbTasks')
    
    // in case that there is no data available
    if (items.length === 0) {
        tbTasks.innerHTML = 'No tasks at the moment.'
        return
    }

    var deleteButton = ''
    var tableView = '<table><th></th><th></th><th>Name</th><th>Status</th>'
    for (var i = 0; i < items.length; i++) {
        deleteButton = '<button onclick="deleteTask(this)" id="' + items[i].id + '">Delete</button>'
        if ('DRAFT' !== items[i].status) deleteButton = ''
        tableView += '<tr ' + ((i%2==1) ? '' : 'class="grayRow"') + '>' +
                        '<td>' + (i + 1) + '</td>' +
                        '<td>' + deleteButton + '</td>' +
                        '<td><a href="./task.html?id=' + items[i].id + '">' + items[i].name + '</a></td>' +
                        '<td>' + items[i].status + '</td>' +
                     '</tr>';
    }
    tableView + '</table>'
    tbTasks.innerHTML = tableView
}

// Remove task from backend and html
function deleteTask(button) {
    var taskID = button.id;
    communicator.deleteTask(taskID).then(() => {
        button.parentElement.parentElement.remove()
    },() => {
        alert('Unable to remove selected task')
    })
}