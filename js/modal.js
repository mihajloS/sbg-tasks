// Handle modal
// Idea of this is is to make modal reusable
// Bad is that connection is passed as parameter and modal is being aware if it
// but for this purpose it will do

// Modal accepts id of button to spawn it and sgb connection instance
class Modal {
    constructor(elId, conn) {
        this.conn = conn
        this._buildaAndAddModalHTML()
        this.elements = {
            modalWrap: document.getElementById('modal'),
            modalBody: document.getElementById('modal_body'),
            createButton: document.getElementById(elId),
            closeButton: document.getElementsByClassName('close_modal')[0],
            textInput: document.getElementById('tbxProjectName'),
            doneButton: document.getElementById('btnCreateProjectDone')
        }
        this._setupModal()
    }

    _buildaAndAddModalHTML() {
        // wrapper
        var modalWrapperDiv = document.createElement('div')
        modalWrapperDiv.setAttribute('id', 'modal')
        // body
        var modalBodyDiv = document.createElement('div')
        modalBodyDiv.setAttribute('id', 'modal_body')
        // close button
        var closeModalSpan = document.createElement('span')
        closeModalSpan.setAttribute('class', 'close_modal modal_toggle')
        closeModalSpan.innerHTML = '&times;'
        // title
        var titleH = document.createElement('h2')
        titleH.setAttribute('class', 'modal_toggle')
        titleH.innerHTML = 'New Project'
        // body details, buttons etc
        var inputSpanWrapper = document.createElement('span')
        inputSpanWrapper.setAttribute('class', 'modal_toggle')
        var pLabel = document.createElement('label')
        pLabel.innerHTML = 'Project name'
        var input = document.createElement('input')
        input.setAttribute('type', 'text')
        input.setAttribute('id', 'tbxProjectName')
        inputSpanWrapper.appendChild(pLabel)
        inputSpanWrapper.appendChild(input)
        var br = document.createElement('br')
        var crtButton = document.createElement('button')
        crtButton.setAttribute('id', 'btnCreateProjectDone')
        crtButton.setAttribute('class', 'modal_toggle')
        crtButton.innerHTML = 'Done'
        // assemble
        modalBodyDiv.appendChild(closeModalSpan)
        modalBodyDiv.appendChild(titleH)
        modalBodyDiv.appendChild(inputSpanWrapper)
        modalBodyDiv.appendChild(br)
        modalBodyDiv.appendChild(crtButton)
        modalWrapperDiv.appendChild(modalBodyDiv)
        // add to stage
        document.body.appendChild(modalWrapperDiv)
    }

    resetModal() {
        var elems = document.getElementsByClassName('modal_toggle')
        for (var i = elems.length - 1; i >= 0; i--) {
            elems[i].style.display = 'block'
        }
        // if there were errors and input went red, reset it
        this.elements.textInput.style.border = '1px solid #CCC'
        // remove text form input
        this.elements.textInput.value = ''
    }

    _setupModal() {
        this._displayModalClick()
        this._closeModalClick()
        this._doneButtonClick()
    }

    _displayModalClick() {
        // open modal click
        var self = this
        this.elements.createButton.addEventListener('click', function() {
            self.resetModal()

            self.conn.getBillingId().then((billingID) => {
            self.elements.textInput.style.display = 'block'
            self.elements.modalWrap.style.display = 'block'
            }, () => {
                alert('Unable add project.')
            })
        })
    }

    _closeModalClick() {
        var self = this
        // close modal click
        this.elements.closeButton.addEventListener('click', function(argument) {
            self.elements.modalWrap.style.display = 'none'
        })

        // close modal on outside click
        window.addEventListener('click', function(e) {
            if (e.target == self.elements.modalWrap)
                self.elements.modalWrap.style.display = 'none'
        })
    }

    _doneButtonClick() {
        var self = this
        this.elements.doneButton.addEventListener('click', function() {
            var projectName = self.elements.textInput.value.trim()
            if (projectName.length === 0) {
                self.elements.textInput.style.border = '1px solid red'
                return
            }

            self.conn.addProject(projectName).then(() => {
                self._spawnMessage(true, 'Project is added')
                
            }, () => {
                self._spawnMessage(false, 'Unable to add project')
            })
        })
    }

    _spawnMessage(success, text) {
        var msg = document.createElement('h2')
        msg.setAttribute('id', 'modal_info')
        var msgClass = (success ? 'modal_success' : 'modal_error')
        msg.setAttribute('class', msgClass)
        msg.innerHTML = text

        var elems = document.getElementsByClassName('modal_toggle')
        for (var i = elems.length - 1; i >= 0; i--) {
            elems[i].style.display = 'none'
        }
        this.elements.modalBody.appendChild(msg)
        var self = this
        setTimeout(() => {
            document.getElementById('modal_info').remove()
            self.elements.modalWrap.style.display = 'none'}, 1000)
        }
}