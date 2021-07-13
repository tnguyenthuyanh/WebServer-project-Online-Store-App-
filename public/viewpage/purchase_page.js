import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Auth from '../controller/auth.js'
import * as Constant from '../model/constant.js'
import * as Util from './util.js'
import * as ProductDetails from './product_details_page.js'

export function addEventListeners() {
    Element.menuPurchases.addEventListener('click', async () => {
        history.pushState(null, null, Route.routePathnames.PURCHASE);
        const label = Util.disableButton(Element.menuPurchases);
        await purchase_page();
        Util.enableButton(Element.menuPurchases, label);
    });

}

export async function purchase_page() {
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>';
        return;
    }

    let html = '<h1>Purchases Page</h1>';
    let carts;
    try {
        carts = await FirebaseController.getPurchaseHistory(Auth.currentUser.uid);
        if (carts.length == 0) {
            html += '<h2>No purchase history found!</h2>';
            Element.root.innerHTML = html;
            return;
        }
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error in getPurchaseHistory', JSON.stringify(e));
    }

    html += `
    <table class="table table-striped">
    <thead>
    <tr>
      <th scope="col">View</th>
      <th scope="col">Items</th>
      <th scope="col">Price</th>
      <th scope="col">Date</th>
    </tr>
    </thead>
    <tbody>
    `;

    for (let i = 0; i < carts.length; i++) {
        html += `
        <tr id="purchase-row-${i}">
            <td>
                <form class="form-purchase-history" method="post">
                    <input type="hidden" name="index" value="${i}">
                    <button class="btn btn-outline-primary">Details</button>
                </form>
            </td>
            <td>${carts[i].getTotalQty()}</td>
            <td>${Util.currency(carts[i].getTotalPrice())}</td>
            <td>${Date(carts[i].timestamp).toString()}
            `
        if (Constant.adminEmails.includes(Auth.currentUser.email)) {
            html += `
                <form class="delete-purchase-history" method="post">
                    <input type="hidden" name="docId" value="${carts[i].docId}">
                    <button class="btn btn-outline-danger float-end">Delete</button>
                </form>
            `;
        }

        html += `</td></tr>`;

    }

    html += '</tbody></table>';

    Element.root.innerHTML = html;

    const deleteForms = document.getElementsByClassName('delete-purchase-history');
    for (let i = 0; i < deleteForms.length; i++) {
        deleteForms[i].addEventListener('submit', async e => {
            e.preventDefault();
            const button = e.target.getElementsByTagName('button')[0];
            Util.disableButton(button);
            const docId = e.target.docId.value;
            try {
                await FirebaseController.deletePurchaseHistory(docId);
                document.getElementById(`purchase-row-${i}`).remove();
                //Util.info('Deleted!', `User deleted: uid=${uid}`);
            } catch (e) {
                if (Constant.DEV) console.log(e);
                Util.info('Delete purchase history in Error', JSON.stringify(e));
            }
            if (deleteForms.length == 0) {
                await purchase_page();
            }
        });
    }

    const historyForms = document.getElementsByClassName('form-purchase-history');
    for (let i = 0; i < historyForms.length; i++) {
        historyForms[i].addEventListener('submit', e => {
            e.preventDefault();
            const index = e.target.index.value;
            Element.modalTransactionTitle.innerHTML = `Purchased At: ${new Date(carts[index].timestamp).toString()}`;
            Element.modalTransactionBody.innerHTML = buidTransactionView(carts[index]);
            Element.modalTransactionView.show();

            const reviewLink = document.getElementsByClassName('review-link');
            for (let i = 0; i < reviewLink.length; i++) {
                reviewLink[i].addEventListener('submit', async e => {
                    e.preventDefault();
                    Element.modalTransactionView.hide();
                    const productId = e.target.docId.value;
                    history.pushState(null, null, Route.routePathnames.ITEM + '#' + productId);
                    await ProductDetails.product_details_page(productId);
                });
            }
        });
    }


}

function buidTransactionView(cart) {
    let html = `
    <table class="table">
    <thead>
      <tr>
        <th scope="col">Image</th>
        <th scope="col">Name</th>
        <th scope="col">Price</th>
        <th scope="col">Qty</th>
        <th scope="col">Sub-Total</th>
        <th scope="col" width="50%">Summary</th>
        <th scope="col">Review</th>
      </tr>
    </thead>
    <tbody>
    `;

    cart.items.forEach(item => {
        html += `
        <tr>
            <td><img src="${item.imageURL}" width="150px"></td>
            <td>${item.name}</td>
            <td>${Util.currency(item.price)}</td>
            <td>${item.qty}</td>
            <td>${Util.currency(item.qty * item.price)}</td>
            <td>${item.summary}</td>
            <td>
            <form class="review-link" method="post">
                <input type="hidden" name="docId" value="${item.docId}">
                <button class="btn btn-outline-primary">Review</button>
            </form>
            </td>
        </tr>
        `;
    });
    html += '</tbody></table>';
    html += `<div style="font-size: 150%">Total: ${Util.currency(cart.getTotalPrice())}</div>`;

    return html;
}