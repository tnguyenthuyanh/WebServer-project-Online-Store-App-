import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'
import { ShoppingCart } from '../model/ShoppingCart.js'
import * as ProductDetails from './product_details_page.js'
import * as Saved from './saved_page.js'

export function addEventListeners() {
    Element.menuHome.addEventListener('click', async () => {
        history.pushState(null, null, Route.routePathnames.HOME);
        const label = Util.disableButton(Element.menuHome);
        await home_page();
        Util.enableButton(Element.menuHome, label);
    });

}

export let cart;

export async function home_page() {
    let html = '<h1> Enjoy Shopping!</h1>';

    html += `
    <br>
        <div class="dropdown modal-menus-post-auth d-block" style="width: 100%;">
            <form id="form-sort" class="d-flex">
                <button class="btn btn-secondary btn-sm dropdown-toggle" id="dropdownMenuButton"
                    data-bs-toggle="dropdown" type="submit" aria-expanded="false">
                    Sort by
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    <li><a class="dropdown-item title-option">Price: lowest first</a></li>
                    <li><a class="dropdown-item keywords-option">Price: highest first</a></li>
                    <li><a class="dropdown-item user-option">Name: A-Z</a></li>
                    <li><a class="dropdown-item user-option">Name: Z-A</a></li>
                </ul>
            </form>
        </div>
    <br>
    `;

    let products;
    try {
        products = await FirebaseController.getProductList();
        if (cart) {
            cart.items.forEach(item => {
                const product = products.find(p => item.docId == p.docId)
                if (!product) {
                    cart.removeWholeItem(item);
                }
                else {
                    product.qty = item.qty;
                }
            });
            Element.shoppingCartCount.innerHTML = cart.getTotalQty();
        }
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Cannot get product info', JSON.stringify(e));
    }

    for (let i = 0; i < products.length; i++) {
        html += buildProductView(products[i], i);
    }

    Element.root.innerHTML = html;

    addIncAndDecFormListener(products);

    if (Auth.currentUser)
        Saved.addSaveButtonListeners();

    ProductDetails.addViewButtonListeners();
    addSortEventListener();
}

export function buildProductView(product, index) {
    return `
    <div class="card" style="width: 18rem; display: inline-block;">
        <div class="container" style="padding: 0 0 0 0">
            <img src="${product.imageURL}" class="card-img-top">
            <form method="post" class="product-save-form ${Auth.currentUser ? 'd-block' : 'd-none'}">
                <input type="hidden" name="productId" value="${product.docId}">
                <button id="save-button-${product.docId}" value="unsave" class="top-right" style="border:none; background:none;">
                    <img src="images/star-unsave.png" class="rounded-circle" height="30px">
                </button>
            </form>
        </div>

        <div class="card-body">
            <form method="post" class="d-inline form-view-detail">
                <input type="hidden" name="productId" value="${product.docId}">
                <button class="btn btn-lg card-title">${product.name}</button>
            </form>
            <p class="card-text">
                ${Util.currency(product.price)} <br>
                ${product.summary}
            </p>
            <div class="container pt-3 bg-light ${Auth.currentUser ? 'd-block' : 'd-none'}">
                <form method="post" class="d-inline form-dec-qty">
                    <input type="hidden" name="index" value="${index}">
                    <button class="btn btn-outline-danger" type="submit">&minus;</button>
                </form>
                <div id="qty-${product.docId}" class="container rounded  text-center text-white bg-primary d-inline-block w-50">
                    ${product.qty == null || product.qty == 0 ? 'Add' : product.qty}
                </div>
                <form method="post" class="d-inline form-inc-qty">
                    <input type="hidden" name="index" value="${index}">
                    <button class="btn btn-outline-primary" type="submit">&plus;</button>
                </form>
            </div>
        </div>
    </div>
    `;
}

export function addIncAndDecFormListener(products) {
    const decForms = document.getElementsByClassName('form-dec-qty');
    for (let i = 0; i < decForms.length; i++) {
        decForms[i].addEventListener('submit', e => {
            e.preventDefault();
            const p = products[e.target.index.value];
            cart.removeItem(p);
            document.getElementById('qty-' + p.docId).innerHTML = (p.qty == null || p.qty == 0) ? 'Add' : p.qty;
            Element.shoppingCartCount.innerHTML = cart.getTotalQty();
        });
    }

    const incForms = document.getElementsByClassName('form-inc-qty');
    for (let i = 0; i < decForms.length; i++) {
        incForms[i].addEventListener('submit', e => {
            e.preventDefault();
            const p = products[e.target.index.value];
            cart.addItem(p);
            document.getElementById('qty-' + p.docId).innerHTML = p.qty;
            Element.shoppingCartCount.innerHTML = cart.getTotalQty();
        });
    }
}

export function initShoppingCart() {

    const cartString = window.localStorage.getItem('cart-' + Auth.currentUser.uid);
    cart = ShoppingCart.parse(cartString);
    if (!cart || !cart.isValid() || cart.uid != Auth.currentUser.uid) {
        window.localStorage.removeItem('cart-' + Auth.currentUser.uid);
        cart = new ShoppingCart(Auth.currentUser.uid);
    }

    Element.shoppingCartCount.innerHTML = cart.getTotalQty();
}

export function addSortEventListener() {
    let option_value = '';
    Array.from(document.getElementsByClassName('dropdown-item')).forEach((option) => {
        option.addEventListener('click', async (event) => {
            option_value = event.target.innerText;
            document.getElementById("dropdownMenuButton").innerHTML = option_value;
            const productList = await FirebaseController.sortProduct(option_value);
            let card = document.getElementsByClassName('card');

            while (card[0]) {
                card[0].parentNode.removeChild(card[0]);
            }

            if (cart) {
                cart.items.forEach(item => {
                    const product = productList.find(p => item.docId == p.docId)
                    if (!product) {
                        cart.removeWholeItem(item);
                    } 
                    else {
                        product.qty = item.qty;
                    }
                });
                Element.shoppingCartCount.innerHTML = cart.getTotalQty();
            }

            for (let i = 0; i < productList.length; i++) {
                Element.root.innerHTML += buildProductView(productList[i], i);
            }

            addSortEventListener()
            addIncAndDecFormListener(productList);

            if (Auth.currentUser)
                Saved.addSaveButtonListeners();

            ProductDetails.addViewButtonListeners();
        });
    });

}