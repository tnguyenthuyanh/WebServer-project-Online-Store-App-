import * as Element from './element.js'
import * as Util from './util.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Home from './home_page.js'
import * as Route from '../controller/route.js'
import * as Auth from '../controller/auth.js'
import { Saved } from '../model/saved.js'
import * as ProductDetails from './product_details_page.js'

export function addEventListeners() {
    Element.menuSaved.addEventListener('click', async () => {
        history.pushState(null, null, Route.routePathnames.SAVED);
        const label = Util.disableButton(Element.menuSaved);
        await saved_page();
        // await Util.sleep(1000);
        Util.enableButton(Element.menuSaved, label);
    });
}



export async function saved_page() {
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Access not allowed.</h1>';
        return;
    }
    let savedList = await FirebaseController.getSavedList();
    let productList = [];
    for (let i = 0; i < savedList.length; i++ ) {
        const product = await FirebaseController.getProductById(savedList[i].productId);
        // if (product.hide == '1')
        //     continue;
        productList.push(product);
    }

    let cart = Home.cart;
    if (cart) {
        for (let i = 0; i< cart.items.length; i++) {
        console.log(cart.items[i])

            const product = productList.find(p => cart.items[i].docId == p.docId)
            if (!product)
                continue
            product.qty = cart.items[i].qty;
        }
        Element.shoppingCartCount.innerHTML = cart.getTotalQty();
    }

    let html = '';

    for (let i = 0; i < productList.length; i++) {
        html += Home.buildProductView(productList[i], i);
    }

    Element.root.innerHTML = html;

    Home.addIncAndDecFormListener(productList);
    addSaveButtonListeners();
    ProductDetails.addViewButtonListeners();
}

// called from home_page
export function addSaveButtonListeners() {
    const saveButtonForms = document.getElementsByClassName('product-save-form');
    for (let i = 0; i < saveButtonForms.length; i++) {
        addSaveFormSubmitEvent(saveButtonForms[i]);
    }
}

export async function addSaveFormSubmitEvent(form) {
    const productId = form.productId.value;
    if (await isProductSaved(productId)) {
        const button = form.getElementsByTagName('button')[0];
        Util.switchSavedButton(button, true);
    }
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const productId = e.target.productId.value;
        const button = e.target.getElementsByTagName('button')[0];
        if (button.value == "saved") {
            const label = Util.disableButton(button);
            await FirebaseController.unsaveProduct(productId);
            Util.enableButton(button, label);
            Util.switchSavedButton(button, false);
        }
        else if (button.value == "unsave") {
            const label = Util.disableButton(button);
            const uid = Auth.currentUser.uid;
            const product = await FirebaseController.getProductById(productId);
            const name = product.name;
            const savedProduct = new Saved ({
                productId, name, uid
            });
            await FirebaseController.saveProduct(savedProduct);
            Util.enableButton(button, label);
            Util.switchSavedButton(button, true);
        }
    });
}

export async function isProductSaved(productId) {
    let productList = await FirebaseController.getSavedList(Auth.currentUser.uid);
    for (let i = 0; i < productList.length; i++) {
        if (productList[i].productId == productId) {
            return true;
        }
    }
    return false;
}



