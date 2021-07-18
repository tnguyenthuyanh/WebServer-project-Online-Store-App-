import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as Constant from '../model/constant.js'
import * as Util from './util.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Auth from '../controller/auth.js'

export function addEventListeners() {
    Element.menuUsers.addEventListener('click', async () => {
        history.pushState(null, null, Route.routePathnames.USERS);
        const label = Util.disableButton(Element.menuUsers);
        await users_page();
        Util.enableButton(Element.menuUsers, label);
    });
}

export async function users_page() {
    
    if (!Auth.currentUser || !Constant.adminEmails.includes(Auth.currentUser.email)) {
        let html = '<h2>Protected Page</h2>';
        Element.root.innerHTML = html;
        return;
    }

    let html = `
        <h1> Welcome to User Management Page</h1>
    `;

    let userList;
    try {
        userList = await FirebaseController.getUserList();
        html += `
        <table class="table table-striped">
        <thead>
            <tr>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
        `;
        userList.forEach(user => {
            html += buildUserRow(user);
        });
        html += '</tbody></table>';
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error getUserList', JSON.stringify(e));
    }

    Element.root.innerHTML = html;

    const toggleForms = document.getElementsByClassName('form-toggle-user');
    for (let i = 0; i < toggleForms.length; i++) {
        toggleForms[i].addEventListener('submit', async e => {
            e.preventDefault();
            const button = e.target.getElementsByTagName('button')[0];
            const label = Util.disableButton(button);

            const uid = e.target.uid.value;
            const disabled = e.target.disabled.value;
            const update = {
                disabled: disabled == 'true' ? false : true,
            };
            try {
                await FirebaseController.updateUser(uid, update);
                e.target.disabled.value = `${update.disabled}`;
                document.getElementById(`user-status-${uid}`).innerHTML = `${update.disabled ? 'Disabled' : 'Active'}`;
                Util.info('Status toggled', `Disabled: ${update.disabled}`);
            } catch (e) {
                if (Constant.DEV) console.log(e);
                Util.info('Toggle user status in error', JSON.stringify(e));
            }
            Util.enableButton(button, label);
        });
    }

    const deleteForms = document.getElementsByClassName('form-delete-user');
    for (let i = 0; i < deleteForms.length; i++) {
        deleteForms[i].addEventListener('submit', async e => {
            e.preventDefault();
            // confirm
            if (!window.confirm('Are you sure to delete the user?')) return;
            const button = e.target.getElementsByTagName('button')[0];
            Util.disableButton(button);
            const uid = e.target.uid.value;
            try {
                await FirebaseController.deleteUser(uid);
                document.getElementById(`user-row-${uid}`).remove();
                Util.info('Deleted!', `User deleted: uid=${uid}`);
            } catch (e) {
                if (Constant.DEV) console.log(e);
                Util.info('Delete User in Error', JSON.stringify(e));
            }
        });
    }
}

function buildUserRow(user) {
    return `
        <tr id="user-row-${user.uid}">
            <td>${user.email}</td>
            <td id="user-status-${user.uid}">${user.disabled ? 'Disabled' : 'Active'}</td>
            <td>
                <form class="form-toggle-user" method="post" style="display: inline-block;">
                    <input type="hidden" name="uid" value="${user.uid}">
                    <input type="hidden" name="disabled" value="${user.disabled}">
                    <button type="submit" class="btn btn-outline-primary">Toggle Active</button>
                </form>
                <form class="form-delete-user" method="post" style="display: inline-block;">
                    <input type="hidden" name="uid" value="${user.uid}">
                    <button type="submit" class="btn btn-outline-danger">Delete</button>
                </form>
            </td>
        </tr>
    `;
}