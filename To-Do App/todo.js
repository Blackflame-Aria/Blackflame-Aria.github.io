let id = 0;

document.getElementById('add').addEventListener('click', () =>{
    let createdDate = new Date();
    let table = document.getElementById('list');
    let row = table.insertRow(1);
    row.setAttribute('id', `item-${id}`);
    row.insertCell(0).innerHTML = document.getElementById('new-task').value;
    row.insertCell(1).innerHTML = document.getElementById('new-start-date').value;
    row.insertCell(2).innerHTML = document.getElementById('new-end-date').value;
    let actions = row.insertCell(3);
    actions.appendChild(createDeleteButton(id++));
    document.getElementById('new-task').value = '';
});

function createDeleteButton(id){
    let btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.id= id;
    btn.innerHTML = 'Complete';
    btn.onclick = () => {
        console.log(`Completing task with id: item-${id}`)
        let elementToDelete = document.getElementById(`item-${id}`);
        elementToDelete.parentNode.removeChild(elementToDelete);
    };
    return btn;
}